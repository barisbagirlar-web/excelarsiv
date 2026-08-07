'use strict';

const crypto = require('node:crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { TIERS, PRODUCTS, getTierForPrice, getTierByProductId } = require('./catalog');

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const SHOPIER_WEBHOOK_TOKEN = defineSecret('SHOPIER_WEBHOOK_TOKEN');

const REGION = 'europe-west1';
const CHECKOUT_TTL_MS = 2 * 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 10 * 60 * 1000;
const MAX_CHECKOUTS_PER_IP_HOUR = 20;

const functionDefaults = {
  region: REGION,
  maxInstances: 20,
  timeoutSeconds: 30,
  memory: '256MiB',
};

function sendJson(res, status, payload) {
  res.status(status);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(payload));
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyCheckoutSecret(checkout, secret) {
  if (!checkout?.secretHash || !secret) return false;
  return safeEqualText(checkout.secretHash, sha256(String(secret)));
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
}

async function enforceCheckoutRateLimit(req) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = sha256(`${getClientIp(req)}|${hour}`);
  const ref = db.collection('excelarsiv_rate_limits').doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
    if (count >= MAX_CHECKOUTS_PER_IP_HOUR) {
      const error = new Error('RATE_LIMITED');
      error.code = 'RATE_LIMITED';
      throw error;
    }
    tx.set(
      ref,
      {
        count: count + 1,
        expiresAt: Timestamp.fromMillis((hour + 2) * 3_600_000),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

function getRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  return Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
}

function normalizeSignature(value) {
  return String(value ?? '').trim().replace(/^sha256=/i, '');
}

function verifyShopierSignature(rawBody, signature, token) {
  const provided = normalizeSignature(signature);
  if (!provided || !token) return false;

  const digest = crypto.createHmac('sha256', token).update(rawBody).digest();
  const candidates = [digest.toString('hex'), digest.toString('base64')];
  return candidates.some((candidate) => safeEqualText(candidate, provided));
}

function firstValue(source, paths) {
  for (const path of paths) {
    let value = source;
    for (const key of path.split('.')) {
      value = value?.[key];
    }
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function numericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/₺|TL|TRY/gi, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectProductIds(value, output = new Set(), depth = 0) {
  if (depth > 7 || value === null || value === undefined) return output;
  if (Array.isArray(value)) {
    for (const item of value) collectProductIds(item, output, depth + 1);
    return output;
  }
  if (typeof value !== 'object') return output;

  for (const [key, item] of Object.entries(value)) {
    if (/^(product_?id|productid)$/i.test(key) && item !== null && item !== undefined) {
      output.add(String(item));
    }
    collectProductIds(item, output, depth + 1);
  }
  return output;
}

function normalizeOrderPayload(payload, headers = {}) {
  const data = payload?.data?.order ?? payload?.data ?? payload?.order ?? payload ?? {};
  const email = normalizeEmail(
    firstValue(data, [
      'email',
      'buyer.email',
      'customer.email',
      'customerEmail',
      'buyerEmail',
      'billing.email',
      'shipping.email',
    ]),
  );
  const orderId = String(
    firstValue(data, ['id', 'orderId', 'order_id', 'orderid', 'platformOrderId', 'platform_order_id']) ?? '',
  ).trim();
  const amount = numericValue(
    firstValue(data, [
      'total',
      'totalPrice',
      'total_price',
      'totalOrderValue',
      'total_order_value',
      'amount',
      'price',
    ]),
  );
  const currency = String(
    firstValue(data, ['currency', 'currencyCode', 'currency_code']) ?? 'TRY',
  ).toUpperCase();
  const eventType = String(
    headers['shopier-event'] ??
      headers['shopier-topic'] ??
      payload?.type ??
      payload?.event ??
      payload?.eventType ??
      '',
  ).toLowerCase();
  const productIds = [...collectProductIds(data)];

  return { email, orderId, amount, currency, eventType, productIds, rawOrder: data };
}

function tierFromOrder(order) {
  for (const id of order.productIds) {
    const tier = getTierByProductId(id);
    if (tier) return tier;
  }
  if (order.amount !== null) return getTierForPrice(Math.round(order.amount));
  return null;
}

function expectedCurrency(currency) {
  if (!currency) return true;
  return ['TRY', 'TL', '0'].includes(String(currency).toUpperCase());
}

function pendingKey(email, tier) {
  return sha256(`${email}|${tier}`);
}

exports.createCheckout = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  try {
    await enforceCheckoutRateLimit(req);
  } catch (error) {
    if (error?.code === 'RATE_LIMITED') return sendJson(res, 429, { error: 'RATE_LIMITED' });
    console.error('checkout rate limit error', error);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }

  const productSlug = String(req.body?.productSlug ?? '').trim();
  const email = normalizeEmail(req.body?.email);
  const product = PRODUCTS[productSlug];

  if (!product) return sendJson(res, 400, { error: 'UNKNOWN_PRODUCT' });
  if (!validEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });

  const tier = TIERS[product.tier];
  if (!tier || tier.priceTL !== product.priceTL) {
    console.error('catalog tier mismatch', { productSlug, product });
    return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });
  }

  const checkoutId = crypto.randomBytes(16).toString('hex');
  const checkoutSecret = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const checkoutRef = db.collection('excelarsiv_checkouts').doc(checkoutId);
  const pointerRef = db.collection('excelarsiv_pending').doc(pendingKey(email, product.tier));

  await db.runTransaction(async (tx) => {
    const pointer = await tx.get(pointerRef);
    if (pointer.exists) {
      const previousId = String(pointer.data()?.checkoutId ?? '');
      if (previousId) {
        const previousRef = db.collection('excelarsiv_checkouts').doc(previousId);
        const previous = await tx.get(previousRef);
        if (previous.exists && previous.data()?.status === 'pending') {
          tx.update(previousRef, {
            status: 'expired',
            expiredReason: 'superseded',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }

    tx.create(checkoutRef, {
      productSlug,
      productName: product.name,
      tier: product.tier,
      expectedAmountTL: product.priceTL,
      expectedShopierProductId: tier.shopierProductId,
      email,
      emailHash: sha256(email),
      secretHash: sha256(checkoutSecret),
      status: 'pending',
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + CHECKOUT_TTL_MS),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(pointerRef, {
      checkoutId,
      expiresAt: Timestamp.fromMillis(now + CHECKOUT_TTL_MS),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return sendJson(res, 201, {
    checkoutId,
    checkoutSecret,
    shopierUrl: tier.shopierUrl,
    deliveryUrl: '/teslimat',
    expiresInSeconds: Math.floor(CHECKOUT_TTL_MS / 1000),
  });
});

exports.shopierWebhook = onRequest(
  { ...functionDefaults, secrets: [SHOPIER_WEBHOOK_TOKEN] },
  async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

    const rawBody = getRawBody(req);
    const signature = req.headers['shopier-signature'];
    if (!verifyShopierSignature(rawBody, signature, SHOPIER_WEBHOOK_TOKEN.value())) {
      return sendJson(res, 401, { error: 'INVALID_SIGNATURE' });
    }

    let payload;
    try {
      payload = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : JSON.parse(rawBody.toString('utf8'));
    } catch {
      return sendJson(res, 400, { error: 'INVALID_JSON' });
    }

    const order = normalizeOrderPayload(payload, req.headers);
    if (order.eventType && !order.eventType.includes('order')) {
      return sendJson(res, 200, { ok: true, ignored: true });
    }

    const tierName = tierFromOrder(order);
    const tier = tierName ? TIERS[tierName] : null;
    const orderId = order.orderId || sha256(rawBody).slice(0, 32);
    const orderRef = db.collection('excelarsiv_shopier_orders').doc(sha256(orderId));

    if (!validEmail(order.email) || !tierName || !tier || !expectedCurrency(order.currency)) {
      await orderRef.set({
        orderIdHash: sha256(orderId),
        emailHash: order.email ? sha256(order.email) : null,
        tier: tierName,
        amount: order.amount,
        currency: order.currency,
        status: 'rejected_unmatched',
        receivedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return sendJson(res, 200, { ok: true, matched: false });
    }

    if (order.amount !== null && Math.round(order.amount) !== tier.priceTL) {
      await orderRef.set({
        orderIdHash: sha256(orderId),
        emailHash: sha256(order.email),
        tier: tierName,
        amount: order.amount,
        currency: order.currency,
        status: 'rejected_amount',
        receivedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return sendJson(res, 200, { ok: true, matched: false });
    }

    const pointerRef = db.collection('excelarsiv_pending').doc(pendingKey(order.email, tierName));

    await db.runTransaction(async (tx) => {
      const alreadyProcessed = await tx.get(orderRef);
      if (alreadyProcessed.exists && alreadyProcessed.data()?.status === 'fulfilled') return;

      const pointer = await tx.get(pointerRef);
      const checkoutId = pointer.exists ? String(pointer.data()?.checkoutId ?? '') : '';
      if (!checkoutId) {
        tx.set(orderRef, {
          orderIdHash: sha256(orderId),
          emailHash: sha256(order.email),
          tier: tierName,
          amount: order.amount,
          currency: order.currency,
          status: 'orphan_no_pending_checkout',
          receivedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
      }

      const checkoutRef = db.collection('excelarsiv_checkouts').doc(checkoutId);
      const checkoutSnap = await tx.get(checkoutRef);
      if (!checkoutSnap.exists) {
        tx.set(orderRef, {
          orderIdHash: sha256(orderId),
          emailHash: sha256(order.email),
          tier: tierName,
          amount: order.amount,
          currency: order.currency,
          status: 'orphan_missing_checkout',
          receivedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
      }

      const checkout = checkoutSnap.data();
      const notExpired = checkout.expiresAt?.toMillis?.() > Date.now();
      const valid =
        checkout.status === 'pending' &&
        notExpired &&
        checkout.email === order.email &&
        checkout.tier === tierName &&
        Number(checkout.expectedAmountTL) === tier.priceTL;

      if (!valid) {
        tx.set(orderRef, {
          orderIdHash: sha256(orderId),
          emailHash: sha256(order.email),
          tier: tierName,
          amount: order.amount,
          currency: order.currency,
          status: 'orphan_invalid_checkout',
          checkoutId,
          receivedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
      }

      tx.update(checkoutRef, {
        status: 'paid',
        shopierOrderIdHash: sha256(orderId),
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.delete(pointerRef);
      tx.set(orderRef, {
        orderIdHash: sha256(orderId),
        emailHash: sha256(order.email),
        checkoutId,
        productSlug: checkout.productSlug,
        tier: tierName,
        amount: order.amount ?? tier.priceTL,
        currency: order.currency || 'TRY',
        status: 'fulfilled',
        receivedAt: FieldValue.serverTimestamp(),
      });
    });

    return sendJson(res, 200, { ok: true });
  },
);

exports.checkoutStatus = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const checkoutId = String(req.body?.checkoutId ?? '').trim();
  const checkoutSecret = String(req.body?.checkoutSecret ?? '');
  if (!/^[a-f0-9]{32}$/.test(checkoutId) || !checkoutSecret) {
    return sendJson(res, 400, { error: 'INVALID_CHECKOUT' });
  }

  const snap = await db.collection('excelarsiv_checkouts').doc(checkoutId).get();
  if (!snap.exists || !verifyCheckoutSecret(snap.data(), checkoutSecret)) {
    return sendJson(res, 404, { error: 'CHECKOUT_NOT_FOUND' });
  }

  const checkout = snap.data();
  let status = checkout.status;
  if (status === 'pending' && checkout.expiresAt?.toMillis?.() <= Date.now()) status = 'expired';

  return sendJson(res, 200, {
    status,
    productName: checkout.productName,
    productSlug: checkout.productSlug,
    tier: checkout.tier,
    amountTL: checkout.expectedAmountTL,
  });
});

exports.createDownloadToken = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const checkoutId = String(req.body?.checkoutId ?? '').trim();
  const checkoutSecret = String(req.body?.checkoutSecret ?? '');
  const checkoutRef = db.collection('excelarsiv_checkouts').doc(checkoutId);
  const snap = await checkoutRef.get();

  if (!snap.exists || !verifyCheckoutSecret(snap.data(), checkoutSecret)) {
    return sendJson(res, 404, { error: 'CHECKOUT_NOT_FOUND' });
  }

  const checkout = snap.data();
  if (checkout.status !== 'paid') return sendJson(res, 409, { error: 'PAYMENT_NOT_CONFIRMED' });

  const product = PRODUCTS[checkout.productSlug];
  if (!product) return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });

  const file = bucket.file(product.storageKey);
  const [exists] = await file.exists();
  if (!exists) {
    console.error('paid product file missing', { productSlug: checkout.productSlug, storageKey: product.storageKey });
    return sendJson(res, 409, { error: 'FILE_NOT_READY' });
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  const now = Date.now();

  await db.collection('excelarsiv_download_tokens').doc(tokenHash).create({
    checkoutId,
    productSlug: checkout.productSlug,
    storageKey: product.storageKey,
    used: false,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + DOWNLOAD_TOKEN_TTL_MS),
  });

  return sendJson(res, 201, {
    downloadUrl: `/api/download?token=${encodeURIComponent(token)}`,
    expiresInSeconds: Math.floor(DOWNLOAD_TOKEN_TTL_MS / 1000),
  });
});

exports.downloadFile = onRequest(
  { ...functionDefaults, timeoutSeconds: 60, memory: '512MiB', maxInstances: 30 },
  async (req, res) => {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

    const token = String(req.query?.token ?? '');
    if (token.length < 32 || token.length > 128) return sendJson(res, 400, { error: 'INVALID_TOKEN' });

    const tokenHash = sha256(token);
    const tokenRef = db.collection('excelarsiv_download_tokens').doc(tokenHash);
    let tokenData = null;

    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(tokenRef);
        if (!snap.exists) {
          const error = new Error('TOKEN_NOT_FOUND');
          error.code = 'TOKEN_NOT_FOUND';
          throw error;
        }
        const data = snap.data();
        if (data.used || data.expiresAt?.toMillis?.() <= Date.now()) {
          const error = new Error('TOKEN_EXPIRED');
          error.code = 'TOKEN_EXPIRED';
          throw error;
        }
        tokenData = data;
        tx.update(tokenRef, {
          used: true,
          usedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error) {
      if (error?.code === 'TOKEN_NOT_FOUND') return sendJson(res, 404, { error: 'TOKEN_NOT_FOUND' });
      if (error?.code === 'TOKEN_EXPIRED') return sendJson(res, 410, { error: 'TOKEN_EXPIRED' });
      throw error;
    }

    const product = PRODUCTS[tokenData.productSlug];
    if (!product || product.storageKey !== tokenData.storageKey) {
      return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });
    }

    const file = bucket.file(product.storageKey);
    const [exists] = await file.exists();
    if (!exists) return sendJson(res, 404, { error: 'FILE_NOT_FOUND' });

    const asciiName = `${tokenData.productSlug}.${product.fileFormat}`;
    const utf8Name = encodeURIComponent(`${product.name}.${product.fileFormat}`);
    res.status(200);
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.set('Cache-Control', 'private, no-store, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');

    const stream = file.createReadStream();
    stream.on('error', (error) => {
      console.error('download stream error', error);
      if (!res.headersSent) sendJson(res, 500, { error: 'DOWNLOAD_FAILED' });
      else res.destroy(error);
    });
    stream.pipe(res);
  },
);

exports._test = {
  normalizeEmail,
  numericValue,
  normalizeOrderPayload,
  tierFromOrder,
  verifyShopierSignature,
};
