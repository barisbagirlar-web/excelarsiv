'use strict';

// Firebase Admin Storage needs a bucket name while the function module is loading.
// Firebase may provide FIREBASE_CONFIG without storageBucket when the default bucket
// has not been provisioned yet, so normalize the config before loading any handler.
let firebaseConfig = {};
try {
  firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
} catch {
  firebaseConfig = {};
}

const projectId =
  firebaseConfig.projectId ||
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  'carbon-web-1265b';

firebaseConfig.projectId = projectId;
firebaseConfig.storageBucket =
  firebaseConfig.storageBucket ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  `${projectId}.appspot.com`;

process.env.FIREBASE_CONFIG = JSON.stringify(firebaseConfig);

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
