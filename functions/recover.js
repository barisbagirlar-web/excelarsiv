'use strict';

const crypto = require('node:crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const { TIERS, PRODUCTS } = require('./catalog');
const { normalizeShopierOrder } = require('./index')._test;

if (getApps().length === 0) initializeApp();
const db = getFirestore();
const SHOPIER_ACCESS_TOKEN = defineSecret('SHOPIER_ACCESS_TOKEN');

const REGION = 'europe-west1';
const MAX_RECOVERIES_PER_IP_HOUR = 10;
const SHOPIER_API_BASE = 'https://api.shopier.com/v1';

function sendJson(res, status, payload) {
  res.status(status);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(payload));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
}

async function enforceRecoveryRateLimit(req) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = sha256(`recover|${getClientIp(req)}|${hour}`);
  const ref = db.collection('excelarsiv_rate_limits').doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.data()?.count ?? 0) : 0;
    if (count >= MAX_RECOVERIES_PER_IP_HOUR) {
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

async function fetchShopierOrder(orderId, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch(`${SHOPIER_API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`SHOPIER_API_${response.status}`);
    const payload = await response.json();
    return normalizeShopierOrder(payload?.data?.order ?? payload?.data ?? payload?.order ?? payload);
  } finally {
    clearTimeout(timeout);
  }
}

function paidOrderMatches(order, emailHash, product) {
  if (!order?.id || !['paid', 'completed', 'successful', 'success'].includes(order.paymentStatus)) return false;
  if (!validEmail(order.email) || sha256(order.email) !== emailHash) return false;
  if (order.tier !== product.tier || order.knownQuantity !== 1) return false;
  if (!['TRY', 'TL'].includes(order.currency)) return false;
  if (order.amount === null || Math.abs(order.amount - product.priceTL) > 0.01) return false;
  return true;
}

const recoverPurchase = onRequest(
  {
    region: REGION,
    maxInstances: 10,
    timeoutSeconds: 20,
    memory: '256MiB',
    secrets: [SHOPIER_ACCESS_TOKEN],
  },
  async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });

    try {
      await enforceRecoveryRateLimit(req);
    } catch (error) {
      if (error?.code === 'RATE_LIMITED') return sendJson(res, 429, { error: 'RATE_LIMITED' });
      return sendJson(res, 500, { error: 'INTERNAL_ERROR' });
    }

    const productSlug = String(req.body?.productSlug ?? '').trim();
    const email = normalizeEmail(req.body?.email);
    const orderId = String(req.body?.shopierOrderId ?? '').trim();
    const product = PRODUCTS[productSlug];

    if (!product) return sendJson(res, 400, { error: 'UNKNOWN_PRODUCT' });
    if (!validEmail(email)) return sendJson(res, 400, { error: 'INVALID_EMAIL' });
    if (!/^[A-Za-z0-9_-]{4,80}$/.test(orderId)) return sendJson(res, 400, { error: 'INVALID_ORDER_ID' });

    const emailHash = sha256(email);
    let order;
    try {
      order = await fetchShopierOrder(orderId, SHOPIER_ACCESS_TOKEN.value());
    } catch (error) {
      console.error('Shopier recovery lookup failed', error?.message);
      return sendJson(res, 503, { error: 'VERIFICATION_TEMPORARILY_UNAVAILABLE' });
    }

    if (!order || !paidOrderMatches(order, emailHash, product)) {
      return sendJson(res, 409, { error: 'ORDER_DOES_NOT_MATCH' });
    }

    const orderHash = sha256(order.id);
    const orderRef = db.collection('excelarsiv_shopier_orders').doc(orderHash);
    const freshSecret = crypto.randomBytes(32).toString('base64url');
    let checkoutId = null;
    let productName = product.name;

    try {
      await db.runTransaction(async (tx) => {
        const orderSnap = await tx.get(orderRef);

        if (orderSnap.exists && orderSnap.data()?.status === 'fulfilled') {
          const existing = orderSnap.data();
          if (existing.productSlug !== productSlug || existing.emailHash !== emailHash) {
            const error = new Error('ORDER_ALREADY_USED');
            error.code = 'ORDER_ALREADY_USED';
            throw error;
          }

          const existingCheckoutId = String(existing.checkoutId ?? '');
          const checkoutRef = db.collection('excelarsiv_checkouts').doc(existingCheckoutId);
          const checkoutSnap = await tx.get(checkoutRef);
          if (!checkoutSnap.exists || checkoutSnap.data()?.status !== 'paid') {
            const error = new Error('RECOVERY_RECORD_INVALID');
            error.code = 'RECOVERY_RECORD_INVALID';
            throw error;
          }

          checkoutId = existingCheckoutId;
          productName = checkoutSnap.data()?.productName ?? product.name;
          tx.update(checkoutRef, {
            secretHash: sha256(freshSecret),
            recoveredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          return;
        }

        checkoutId = crypto.randomBytes(16).toString('hex');
        const checkoutRef = db.collection('excelarsiv_checkouts').doc(checkoutId);
        tx.create(checkoutRef, {
          productSlug,
          productName: product.name,
          tier: product.tier,
          expectedAmountTL: product.priceTL,
          expectedShopierProductId: TIERS[product.tier].shopierProductId,
          emailHash,
          secretHash: sha256(freshSecret),
          status: 'paid',
          recovered: true,
          shopierOrderIdHash: orderHash,
          createdAt: FieldValue.serverTimestamp(),
          paidAt: FieldValue.serverTimestamp(),
          recoveredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.create(orderRef, {
          orderIdHash: orderHash,
          emailHash,
          checkoutId,
          productSlug,
          tier: product.tier,
          amount: order.amount,
          currency: order.currency,
          status: 'fulfilled',
          recovered: true,
          fulfilledAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (error) {
      if (error?.code === 'ORDER_ALREADY_USED') return sendJson(res, 409, { error: 'ORDER_ALREADY_USED' });
      console.error('purchase recovery transaction failed', error?.code || error?.message);
      return sendJson(res, 500, { error: 'RECOVERY_FAILED' });
    }

    return sendJson(res, 200, {
      checkoutId,
      checkoutSecret: freshSecret,
      productSlug,
      productName,
      tier: product.tier,
      amountTL: product.priceTL,
      status: 'paid',
      recovered: true,
    });
  },
);

module.exports = { recoverPurchase };
