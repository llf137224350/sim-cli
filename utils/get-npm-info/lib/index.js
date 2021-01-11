'use strict';
const urlJoin = require('url-join');
const axios = require('axios');
const semver = require('semver');

/**
 * 获取线上npm包信息
 * @param packageName 包名
 * @param registry 仓库地址
 */
function getNpmInfo(packageName, registry) {
  if (!packageName) {
    return null;
  }
  // 默认淘宝地址
  registry = registry || getDefaultRegistry();
  // 拼接查询npm上包信息的路径
  const npmInfoUrl = urlJoin(registry, packageName);
  // 加载数据
  return axios.get(npmInfoUrl).then((resopnse) => {
    if (resopnse.status === 200) {
      return resopnse.data;
    }
    return null;
  }).catch(err => {
    Promise.reject(err);
  });
}

/**
 *
 * 获取线上npm版本
 * @param packageName 包名
 * @param registry 仓库地址
 * @returns {Promise<string[]|*[]>} 版本数组
 */
async function getNpmVersions(packageName, registry) {
  const npmInfo = await getNpmInfo(packageName, registry);
  if (npmInfo) {
    return Object.keys(npmInfo.versions);
  } else {
    return [];
  }
}

/**
 * 获取仓库地址
 * @param isOriginal 是否为npm官方、默认true
 * @returns {string} 仓库地址
 */
function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'http://registry.npmjs.org' : 'http://registry.npm.taobao.org'
}

/**
 * 获取大于某一个版本的所有版本号
 * @param baseVersion 当前版本
 * @param versions 所有版本数组
 * @returns {*[]|*} 大于当前版本的版本数组
 */
function getNpmSemverVersions(baseVersion, versions) {
  return versions.length ? versions
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a) ? 1 : -1) : [];
}

/**
 * 获取大于当前版本的最新的版本号
 * @param baseVersion 当前版本
 * @param packageName 包名
 * @param registry 仓库地址   'http://registry.npmjs.org' : 'http://registry.npm.taobao.org'
 * @returns {Promise<*>} 最新版本号 有可能为undefined
 */
async function getNpmSemverVersion(baseVersion, packageName, registry) {
  const versions = await getNpmVersions(packageName, registry);
  const newVersions = getNpmSemverVersions(baseVersion, versions);
  if (newVersions.length) {
    return newVersions[0];
  }
}

/**
 * 获取指定包最新版本
 * @param packageName 包名
 * @param registry 仓库
 * @returns {Promise<null|string>}
 */
async function getNpmLastestVersion(packageName, registry) {
  const versions = await getNpmVersions(packageName, registry);
  if (versions) { // 查到了版本
    return versions.sort((a, b) => semver.gt(b, a) ? 1 : -1)[0];
  }
  return null;
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersions,
  getDefaultRegistry,
  getNpmSemverVersion,
  getNpmLastestVersion
};
