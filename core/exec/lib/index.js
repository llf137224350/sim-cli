'use strict';
const Package = require('@sim-cli/package');
const log = require('@sim-cli/log');
// 命令与包名配置表
const SETTINGS = {
  'init': '@sim-cli/init'
}

function exec() {
  const cmdObj = arguments[arguments.length - 1];
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  const packageName = SETTINGS[cmdObj.name()];
  const packageVersion = 'latest';
  // 没有传路径 =》 找缓存路径 =》 有则更新没有则下载安装
  if (!targetPath) {
    targetPath = ''; // 生成缓存路径
  }
  log.verbose('targetPath', targetPath)
  log.verbose('homePath', homePath)
  new Package({
    targetPath,
    packageName,
    packageVersion
  })
}

module.exports = exec;
