'use strict';

module.exports = core;
const semver = require('semver');
const colors = require('colors/safe');
const pkg = require('../package.json');
const log = require('@sim-cli/log');
const constant = require('./constant');

function core() {
  try {
    // 检查版本号
    checkPkgVersion();
    // 检查node版本号
    checkNodeVersion();
    // 检查是否为root权限使用sim-cli
    checkRoot();
    // 检查用户主目录

  } catch (e) {
    log.error('', e.message);
  }
}

// 检查版本号
function checkPkgVersion() {
  log.info('', '当前版本：v' + pkg.version)
}

// 检查node版本号
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`sim-cli 需要安装 v${lowestVersion} 以上版本的Node.js`));
  }
}

// 检查是否为root权限使用sim-cli
function checkRoot() {
  require('root-check')();
}
