'use strict';

/**
 * Shopier API istemcisi — tek kaynak.
 * Token: Firebase Secret SHOPIER_ACCESS_TOKEN (koda yazılmaz).
 * Dokümantasyon: https://developer.shopier.com (Orders API v1)
 */

const { getTierByProductId } = require('./catalog');

const SHOPIER_API_BASE = 'https://api.shopier.com/v1';
const SHOPIER_REQUEST_TIMEOUT_MS = 6_000;

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
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

function unwrapOrderPayload(payload) {
  return payload?.data?.order ?? payload?.data ?? payload?.order ?? payload;
}

async function shopierRequest(path, token, { timeoutMs = SHOPIER_REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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

async function fetchShopierOrderById(orderId, token) {
  try {
    const payload = await shopierRequest(`/orders/${encodeURIComponent(orderId)}`, token);
    return normalizeShopierOrder(unwrapOrderPayload(payload));
  } catch (error) {
    if (error?.httpStatus === 404) return null;
    throw error;
  }
}

module.exports = {
  SHOPIER_API_BASE,
  SHOPIER_REQUEST_TIMEOUT_MS,
  normalizeEmail,
  validEmail,
  numericValue,
  normalizeShopierOrder,
  extractOrders,
  orderIsPaid,
  unwrapOrderPayload,
  shopierRequest,
  fetchShopierOrderById,
};
