'use strict';
const path = require('path');
const colors = require('colors');
const pkgDir = require('pkg-dir').sync;
const {isObject} = require('@sim-cli/utils');
const formatPath = require('@sim-cli/format-path');
/**
 * package 类
 */
class Package {
  constructor(options) {
    if (!options) {
      throw new Error(colors.red('Package类构造函数不能为空，且需要传入一个对象'));
    }
    if (!isObject(options)) {
      throw new Error(colors.red('Package类构造函数需要传入一个对象'));
    }
    // 加载执行包路径
    this.targetPath = options.targetPath;
    // 包名
    this.packageName = options.packageName;
    // 包版本
    this.packageVersion = options.packageVersion;

    console.log( this.getRootFilePath());
  }

  /**
   * 包是否存在
   */
  exists() {
  }

  /**
   * 安装包
   */
  install() {

  }

  /**
   * 更新包
   */
  update() {
  }

  /**
   * 获取入口文件
   */
  getRootFilePath() {
    // 获取package.json 所在目录
    const rootDir = pkgDir(this.targetPath);
    if (rootDir) {
      // 加载package.json
      const pkgFile = require(path.resolve(rootDir, 'package.json'));
      if (pkgFile && pkgFile.main) {
        // 返回入口文件地址
        return formatPath(path.resolve(rootDir, pkgFile.main));
      }
    }
    return null;
  }
}

module.exports = Package;
