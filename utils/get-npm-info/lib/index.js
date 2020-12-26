'use strict';

/**
 * 获取线上npm包信息
 * @param packageName 包名
 * @param registry 仓库地址
 */
function getNpmInfo(packageName, registry) {
  // 默认淘宝地址
  registry = registry || 'http://registry.npm.taobao.org'
  console.log(packageName);
}

module.exports = {
  getNpmInfo
};
