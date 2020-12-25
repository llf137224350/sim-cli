#! /usr/bin/env node

const importLocal = require('import-local');
const log = require('@sim-cli/log');
if (importLocal(__filename)) { // 使用本地的版本
  log.info('', '正在使用 sim-cli 本地版本');
} else {
  // 加载lib下index并传入sim-cli后的参数
  require('../lib')(process.argv.slice(2));
}
