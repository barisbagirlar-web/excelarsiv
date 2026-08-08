'use strict';

const crypto = require('node:crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { TIERS, PRODUCTS, getTierByProductId } = require('./catalog');

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const SHOPIER_ACCESS_TOKEN = defineSecret('SHOPIER_ACCESS_TOKEN');

const REGION = 'europe-west1';
const CHECKOUT_TTL_MS = 2 * 60 * 60 * 1000;
const DOWNLOAD_TOKEN_TTL_MS = 5 * 60 * 1000;
const SHOPIER_RECHECK_MS = 8 * 1000;
const MAX_CHECKOUTS_PER_IP_HOUR = 20;
const SHOPIER_API_BASE = 'https://api.shopier.com/v1';

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
  return String(value ?? '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a ?? ''), 'utf8');
  const right = Buffer.from(String(b ?? ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyCheckoutSecret(checkout, secret) {
  if (!checkout?.secretHash || !secret) return false;
  return safeEqualText(checkout.secretHash, sha256(secret));
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

function numericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').trim();
  if (!text) return null;

  const stripped = text.replace(/\s/g, '').replace(/₺|TL|TRY/gi, '');
  const normalized = stripped.includes(',')
    ? stripped.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
    : stripped;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeShopierOrder(raw) {
  const lineItems = Array.isArray(raw?.lineItems)
    ? raw.lineItems
    : Array.isArray(raw?.line_items)
      ? raw.line_items
      : [];

  const email = normalizeEmail(
    raw?.shippingInfo?.email ??
      raw?.shipping_info?.email ??
      raw?.billingInfo?.email ??
      raw?.billing_info?.email ??
      raw?.email,
  );

  const amount = numericValue(
    raw?.totals?.total ?? raw?.total ?? raw?.totalPrice ?? raw?.total_price ?? raw?.amount,
  );
  const currency = String(raw?.currency ?? 'TRY').trim().toUpperCase();
  const id = String(raw?.id ?? raw?.orderId ?? raw?.order_id ?? '').trim();
  const paymentStatus = String(
    raw?.paymentStatus ?? raw?.payment_status ?? raw?.transaction?.status ?? '',
  ).trim().toLowerCase();
  const dateCreated = String(raw?.dateCreated ?? raw?.date_created ?? raw?.createdAt ?? raw?.created_at ?? '').trim();

  const knownTiers = new Set();
  let knownQuantity = 0;
  for (const item of lineItems) {
    const productId = item?.productId ?? item?.product_id;
    const tier = getTierByProductId(productId);
    if (tier) {
      knownTiers.add(tier);
      knownQuantity += Number(item?.quantity ?? 1) || 0;
    }
  }

  return {
    id,
    email,
    amount,
    currency,
    paymentStatus,
    dateCreated,
    tier: knownTiers.size === 1 ? [...knownTiers][0] : null,
    knownQuantity,
    raw,
  };
}

function extractOrders(payload) {
  if (Array.isArray(payload)) return payload;
  for (const value of [payload?.orders, payload?.items, payload?.data?.orders, payload?.data?.items, payload?.data]) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function orderIsPaid(order) {
  return ['paid', 'completed', 'successful', 'success'].includes(order.paymentStatus);
}

function orderMatchesCheckout(order, checkout) {
  if (!order?.id || !orderIsPaid(order)) return false;
  if (!validEmail(order.email) || sha256(order.email) !== checkout.emailHash) return false;
  if (order.tier !== checkout.tier || order.knownQuantity !== 1) return false;
  if (!['TRY', 'TL'].includes(order.currency)) return false;
  if (order.amount === null || Math.abs(order.amount - Number(checkout.expectedAmountTL)) > 0.01) return false;

  const orderTime = Date.parse(order.dateCreated);
  const checkoutTime = checkout.createdAt?.toMillis?.() ?? 0;
  if (Number.isFinite(orderTime) && checkoutTime && orderTime < checkoutTime - 5 * 60 * 1000) return false;
  return true;
}

async function shopierRequest(path, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch(`${SHOPIER_API_BASE}${path}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`SHOPIER_API_${response.status}`);
      error.code = 'SHOPIER_API_ERROR';
      error.httpStatus = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function pendingKey(emailHash, tier) {
  return sha256(`${emailHash}|${tier}`);
}

async function claimOrderForCheckout(checkoutRef, checkout, order) {
  const orderHash = sha256(order.id);
  const orderRef = db.collection('excelarsiv_shopier_orders').doc(orderHash);
  const pointerRef = db.collection('excelarsiv_pending').doc(pendingKey(checkout.emailHash, checkout.tier));

  return db.runTransaction(async (tx) => {
    const [freshCheckoutSnap, orderSnap] = await Promise.all([tx.get(checkoutRef), tx.get(orderRef)]);
    if (!freshCheckoutSnap.exists) return false;

    const freshCheckout = freshCheckoutSnap.data();
    if (freshCheckout.status === 'paid') return true;
    if (freshCheckout.status !== 'pending') return false;
    if (!orderMatchesCheckout(order, freshCheckout)) return false;

    if (orderSnap.exists) {
      const existing = orderSnap.data();
      if (existing.status === 'fulfilled' && existing.checkoutId !== checkoutRef.id) return false;
    }

    tx.update(checkoutRef, {
      status: 'paid',
      shopierOrderIdHash: orderHash,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.delete(pointerRef);
    tx.set(orderRef, {
      orderIdHash: orderHash,
      emailHash: freshCheckout.emailHash,
      checkoutId: checkoutRef.id,
      productSlug: freshCheckout.productSlug,
      tier: freshCheckout.tier,
      amount: order.amount,
      currency: order.currency,
      status: 'fulfilled',
      fulfilledAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function acquireReconcileLease(checkoutRef) {
  const now = Date.now();
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(checkoutRef);
    if (!snap.exists || snap.data()?.status !== 'pending') return false;
    const last = snap.data()?.lastShopierCheckAt?.toMillis?.() ?? 0;
    if (now - last < SHOPIER_RECHECK_MS) return false;
    tx.update(checkoutRef, { lastShopierCheckAt: Timestamp.fromMillis(now) });
    return true;
  });
}

async function reconcileFromRecentOrders(checkoutRef, checkout, token) {
  if (!(await acquireReconcileLease(checkoutRef))) return false;

  const payload = await shopierRequest('/orders?limit=50', token);
  const orders = extractOrders(payload).map(normalizeShopierOrder);
  const candidates = orders
    .filter((order) => orderMatchesCheckout(order, checkout))
    .sort((a, b) => Date.parse(b.dateCreated || 0) - Date.parse(a.dateCreated || 0));

  for (const order of candidates) {
    if (await claimOrderForCheckout(checkoutRef, checkout, order)) return true;
  }
  return false;
}

async function readAuthorizedCheckout(req, res) {
  const checkoutId = String(req.body?.checkoutId ?? '').trim();
  const checkoutSecret = String(req.body?.checkoutSecret ?? '');
  if (!/^[a-f0-9]{32}$/.test(checkoutId) || checkoutSecret.length < 32) {
    sendJson(res, 400, { error: 'INVALID_CHECKOUT' });
    return null;
  }

  const ref = db.collection('excelarsiv_checkouts').doc(checkoutId);
  const snap = await ref.get();
  if (!snap.exists || !verifyCheckoutSecret(snap.data(), checkoutSecret)) {
    sendJson(res, 404, { error: 'CHECKOUT_NOT_FOUND' });
    return null;
  }
  return { ref, snap, checkoutSecret };
}

exports.createCheckout = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  try {
    await enforceCheckoutRateLimit(req);
  } catch (error) {
    if (error?.code === 'RATE_LIMITED') return sendJson(res, 429, { error: 'RATE_LIMITED' });
    console.error('checkout rate limit failed', error?.message);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }

  const productSlug = String(req.body?.productSlug ?? '').trim();
  const email = normalizeEmail(req.body?.email);
  const product = PRODUCTS[productSlug];
  if (!product) return sendJson(res, 400, { error: 'UNKNOWN_PRODUCT' });
  if (!validEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });

  const tier = TIERS[product.tier];
  if (!tier || tier.priceTL !== product.priceTL) {
    console.error('commerce catalog mismatch', productSlug);
    return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });
  }

  // Fail closed before opening Shopier: catalog-driven sale switch. Products not
  // marked for sale must never reach the payment provider.
  if (product.satista === false) {
    console.warn('checkout blocked: product not for sale', productSlug);
    return sendJson(res, 409, { error: 'PRODUCT_NOT_FOR_SALE' });
  }

  // Fail closed before opening Shopier: never accept payment for a product whose
  // private sale file is not already present in Firebase Storage.
  try {
    const [fileReady] = await bucket.file(product.storageKey).exists();
    if (!fileReady) {
      console.warn('checkout blocked: paid file missing', product.storageKey);
      return sendJson(res, 409, { error: 'PRODUCT_NOT_READY' });
    }
  } catch (error) {
    console.error('checkout readiness check failed', error?.message);
    return sendJson(res, 503, { error: 'PRODUCT_READINESS_UNAVAILABLE' });
  }

  const checkoutId = crypto.randomBytes(16).toString('hex');
  const checkoutSecret = crypto.randomBytes(32).toString('base64url');
  const emailHash = sha256(email);
  const now = Date.now();
  const checkoutRef = db.collection('excelarsiv_checkouts').doc(checkoutId);
  const pointerRef = db.collection('excelarsiv_pending').doc(pendingKey(emailHash, product.tier));

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
      emailHash,
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
    productSlug,
    productName: product.name,
    tier: product.tier,
    amountTL: product.priceTL,
    shopierUrl: tier.shopierUrl,
    expiresInSeconds: Math.floor(CHECKOUT_TTL_MS / 1000),
  });
});

exports.checkoutStatus = onRequest(
  { ...functionDefaults, secrets: [SHOPIER_ACCESS_TOKEN] },
  async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    const auth = await readAuthorizedCheckout(req, res);
    if (!auth) return;

    let checkout = auth.snap.data();
    if (checkout.status === 'pending' && checkout.expiresAt?.toMillis?.() <= Date.now()) {
      await auth.ref.update({ status: 'expired', expiredReason: 'timeout', updatedAt: FieldValue.serverTimestamp() });
      checkout = { ...checkout, status: 'expired' };
    }

    let verificationDelayed = false;
    if (checkout.status === 'pending') {
      try {
        await reconcileFromRecentOrders(auth.ref, checkout, SHOPIER_ACCESS_TOKEN.value());
      } catch (error) {
        verificationDelayed = true;
        console.error('Shopier reconciliation delayed', error?.code || error?.message);
      }
      const refreshed = await auth.ref.get();
      if (refreshed.exists) checkout = refreshed.data();
    }

    return sendJson(res, 200, {
      status: checkout.status,
      productName: checkout.productName,
      productSlug: checkout.productSlug,
      tier: checkout.tier,
      amountTL: checkout.expectedAmountTL,
      verificationDelayed,
    });
  },
);

exports.verifyShopierOrder = onRequest(
  { ...functionDefaults, secrets: [SHOPIER_ACCESS_TOKEN] },
  async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    const auth = await readAuthorizedCheckout(req, res);
    if (!auth) return;

    const orderId = String(req.body?.shopierOrderId ?? '').trim();
    if (!/^[A-Za-z0-9_-]{4,80}$/.test(orderId)) {
      return sendJson(res, 400, { error: 'INVALID_ORDER_ID' });
    }

    const checkout = auth.snap.data();
    if (checkout.status === 'paid') return sendJson(res, 200, { status: 'paid' });
    if (checkout.status !== 'pending') return sendJson(res, 409, { error: 'CHECKOUT_NOT_PENDING' });

    try {
      const payload = await shopierRequest(`/orders/${encodeURIComponent(orderId)}`, SHOPIER_ACCESS_TOKEN.value());
      const order = normalizeShopierOrder(payload?.data?.order ?? payload?.data ?? payload?.order ?? payload);
      if (!orderMatchesCheckout(order, checkout)) {
        return sendJson(res, 409, { error: 'ORDER_DOES_NOT_MATCH' });
      }
      const claimed = await claimOrderForCheckout(auth.ref, checkout, order);
      if (!claimed) return sendJson(res, 409, { error: 'ORDER_ALREADY_USED' });
      return sendJson(res, 200, { status: 'paid' });
    } catch (error) {
      console.error('Shopier order verification failed', error?.code || error?.message);
      return sendJson(res, 503, { error: 'VERIFICATION_TEMPORARILY_UNAVAILABLE' });
    }
  },
);

exports.createDownloadToken = onRequest(functionDefaults, async (req, res) => {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  const auth = await readAuthorizedCheckout(req, res);
  if (!auth) return;

  const checkout = auth.snap.data();
  if (checkout.status !== 'paid') return sendJson(res, 409, { error: 'PAYMENT_NOT_CONFIRMED' });

  const product = PRODUCTS[checkout.productSlug];
  if (!product) return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });

  const file = bucket.file(product.storageKey);
  const [exists] = await file.exists();
  if (!exists) {
    console.error('paid file missing', product.storageKey);
    return sendJson(res, 409, { error: 'FILE_NOT_READY' });
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  const now = Date.now();
  await db.collection('excelarsiv_download_tokens').doc(tokenHash).create({
    checkoutId: auth.ref.id,
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
  { ...functionDefaults, timeoutSeconds: 60, memory: '512MiB', maxInstances: 20 },
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
        tx.update(tokenRef, { used: true, usedAt: FieldValue.serverTimestamp() });
      });
    } catch (error) {
      if (error?.code === 'TOKEN_NOT_FOUND') return sendJson(res, 404, { error: 'TOKEN_NOT_FOUND' });
      if (error?.code === 'TOKEN_EXPIRED') return sendJson(res, 410, { error: 'TOKEN_EXPIRED' });
      console.error('download token transaction failed', error?.message);
      return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
    }

    const product = PRODUCTS[tokenData.productSlug];
    if (!product || product.storageKey !== tokenData.storageKey) {
      return sendJson(res, 500, { error: 'CATALOG_MISMATCH' });
    }

    const file = bucket.file(product.storageKey);
    const [exists] = await file.exists();
    if (!exists) return sendJson(res, 404, { error: 'FILE_NOT_FOUND' });

    const mime = product.fileFormat === 'xlsm'
      ? 'application/vnd.ms-excel.sheet.macroEnabled.12'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const asciiName = `${tokenData.productSlug}.${product.fileFormat}`;
    const utf8Name = encodeURIComponent(`${product.name}.${product.fileFormat}`);

    res.status(200);
    res.set('Content-Type', mime);
    res.set('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    res.set('Cache-Control', 'private, no-store, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');

    const stream = file.createReadStream();
    stream.on('error', (error) => {
      console.error('download stream failed', error?.message);
      if (!res.headersSent) sendJson(res, 500, { error: 'DOWNLOAD_FAILED' });
      else res.destroy(error);
    });
    stream.pipe(res);
  },
);

exports._test = {
  normalizeEmail,
  numericValue,
  normalizeShopierOrder,
  extractOrders,
  orderIsPaid,
  orderMatchesCheckout,
};
