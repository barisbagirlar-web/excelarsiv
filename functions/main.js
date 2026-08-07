'use strict';

const core = require('./index');
const { createCheckout } = require('./safe-checkout');

module.exports = {
  createCheckout,
  checkoutStatus: core.checkoutStatus,
  verifyShopierOrder: core.verifyShopierOrder,
  createDownloadToken: core.createDownloadToken,
  downloadFile: core.downloadFile,
};
