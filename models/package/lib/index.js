'use strict';
const path = require('path');
const colors = require('colors');
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const fsExtra = require('fs-extra');
const npminstall = require('npminstall');
const {isObject} = require('@sim-cli/utils');
const formatPath = require('@sim-cli/format-path');
const {getDefaultRegistry, getNpmLastestVersion} = require('@sim-cli/get-npm-info');

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
    // 缓存目录
    this.storeDir = options.storeDir;
    // 包名
    this.packageName = options.packageName;
    // 包版本
    this.packageVersion = options.packageVersion;

    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  async prepare() {
    // 判断缓存目录是否存在
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLastestVersion(this.packageName);
    }
  }

  /**
   * 获取缓存路径
   *_@imooc-cli_init@1.1.2@@imooc-cli
   */
  get cacheFilePath() {
    const dir = `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    return path.resolve(this.storeDir, dir)
  }

  /**
   * 过去指定版本缓存路径
   * @param version
   * @returns {string}
   */
  getSpecifiedVersionCacheFilePath(version) {
    const dir = `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    return path.resolve(this.storeDir, dir)
  }

  /**
   * 包是否存在
   */
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else { // 自己指定了targetPath
      return pathExists(this.targetPath);
    }
  }

  /**
   * 安装包
   */
  async install() {
    // 获取最新版本
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      // trace: false,
      // detail: true,
      registry: getDefaultRegistry(),
      storeDir: this.storeDir,
      pkgs: [{
        name: this.packageName,
        version: this.packageVersion
      }]
    });
  }

  /**
   * 更新包
   */
  async update() {
    await this.prepare();
    // 获取最新版号
    const latestPackageVersion = await getNpmLastestVersion(this.packageName);
    const latestVersionCacheFilePath = this.getSpecifiedVersionCacheFilePath(latestPackageVersion);
    // 最新版本号在本地是否存在
    // 如果不存在，则直接安装最新版本
    if (!pathExists(latestVersionCacheFilePath)) {
      await npminstall({
        root: this.targetPath,
        registry: getDefaultRegistry(),
        storeDir: this.storeDir,
        pkgs: [{
          name: this.packageName,
          version: latestPackageVersion
        }]
      });
      this.packageVersion = latestPackageVersion;
    } else {
      this.packageVersion = latestPackageVersion;
    }
  }

  _getRootFilePath(_path) {
    // 获取package.json 所在目录
    const rootDir = pkgDir(_path);
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

  /**
   * 获取入口文件
   */
  getRootFilePath() {
    if (this.storeDir) {
      return this._getRootFilePath(this.cacheFilePath);
    } else {
      return this._getRootFilePath(this.targetPath);
    }
  }
}

module.exports = Package;
