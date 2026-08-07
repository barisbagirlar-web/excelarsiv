'use strict';

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
