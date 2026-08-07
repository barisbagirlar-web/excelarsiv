'use strict';

const core = require('./index');
const { createCheckout } = require('./safe-checkout');
const { recoverPurchase } = require('./recover');

module.exports = {
  createCheckout,
  checkoutStatus: core.checkoutStatus,
  verifyShopierOrder: core.verifyShopierOrder,
  recoverPurchase,
  createDownloadToken: core.createDownloadToken,
  downloadFile: core.downloadFile,
};
