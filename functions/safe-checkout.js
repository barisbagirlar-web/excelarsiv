'use strict';

const crypto = require('node:crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { TIERS, PRODUCTS } = require('./catalog');

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const bucket = getStorage().bucket();

const REGION = 'europe-west1';
const CHECKOUT_TTL_MS = 30 * 60 * 1000;
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
  return String(value ?? '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
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
    tx.set(ref, {
      count: count + 1,
      expiresAt: Timestamp.fromMillis((hour + 2) * 3_600_000),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

function pendingKey(emailHash, tier) {
  return sha256(`${emailHash}|${tier}`);
}

const createCheckout = onRequest(functionDefaults, async (req, res) => {
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

  try {
    await db.runTransaction(async (tx) => {
      const pointer = await tx.get(pointerRef);
      let previousRef = null;
      let previous = null;

      if (pointer.exists) {
        const previousId = String(pointer.data()?.checkoutId ?? '');
        if (previousId) {
          previousRef = db.collection('excelarsiv_checkouts').doc(previousId);
          previous = await tx.get(previousRef);
        }
      }

      // There may only be one pending checkout per e-mail + Shopier price tier.
      // A repeated click or a switch to another product in the same tier must not
      // strand the buyer behind a 409. Supersede the old unpaid session and issue
      // a fresh secret while preserving the one-active-session invariant used by
      // Shopier reconciliation.
      if (previous?.exists && previous.data()?.status === 'pending') {
        const data = previous.data();
        const notExpired = data?.expiresAt?.toMillis?.() > now;
        tx.update(previousRef, {
          status: 'expired',
          expiredReason: notExpired ? 'superseded' : 'timeout',
          updatedAt: FieldValue.serverTimestamp(),
        });
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
  } catch (error) {
    console.error('checkout create failed', error?.message);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
  }

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

module.exports = { createCheckout };
