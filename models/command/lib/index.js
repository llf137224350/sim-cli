'use strict';
const semver = require('semver');
const colors = require('colors/safe');
const log = require('@sim-cli/log');
// node最低版本号
const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('参数不能为空！');
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须是一个数组！');
    }
    if (!argv.length) {
      throw new Error('参数列表为空！');
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain
        .then(() => this.checkNodeVersion())
        .then(() => this.initArgs())
        .then(() => this.init())
        .then(() => this.exec())
        .catch((error) => {
          log.error(error.message);
        });
    })
  }

  /**
   * 初始化
   */
  init() {
    throw new Error('子类必须重写init方法');
  }

  /**
   * 执行
   */
  exec() {
    throw new Error('子类必须重写exec方法');
  }

  /**
   * 初始化参数
   */
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  // 检查node版本号
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`sim-cli 需要安装 v${lowestVersion} 以上版本的Node.js`));
    }
  }
}

module.exports = Command;

