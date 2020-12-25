#! /usr/bin/env node

const importLocal = require('import-local');

if (importLocal(__filename)) { // 使用本地的版本
  require('npmlog').info('cli', '正在使用sim-cli本地版本');
} else {
  // 加载lib下index并传入sim-cli后的参数
  require('../lib')(process.argv.slice(2));
}
