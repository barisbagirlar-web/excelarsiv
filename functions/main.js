'use strict';

// Firebase CLI injects FIREBASE_CONFIG automatically, but direct gcloud Functions
// deployments do not. Populate the minimum config before any Firebase Admin module
// is loaded so Storage initialization cannot crash the container during startup.
if (!process.env.FIREBASE_CONFIG) {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'carbon-web-1265b';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId, storageBucket });
}

const core = require('./index');
const { createCheckout } = require('./safe-checkout');
const { recoverPurchase } = require('./recover');
const { requestProofDemo, downloadProofDemo } = require('./proof-demo');

module.exports = {
  createCheckout,
  checkoutStatus: core.checkoutStatus,
  verifyShopierOrder: core.verifyShopierOrder,
  recoverPurchase,
  createDownloadToken: core.createDownloadToken,
  downloadFile: core.downloadFile,
  requestProofDemo,
  downloadProofDemo,
};
