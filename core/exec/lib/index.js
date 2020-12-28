'use strict';
const path = require('path');
const colors = require('colors');
const Package = require('@sim-cli/package');
const log = require('@sim-cli/log');
// 命令与包名配置表
const SETTINGS = {
  'init': '@sim-cli/init'
}
// 缓存目录
const CACHE_DIR = 'dependencies'

async function exec() {
  try {
    let targetPath = process.env.CLI_TARGET_PATH;
    let storeDir = '';
    let pkg;
    const cmdObj = arguments[arguments.length - 1];
    const homePath = process.env.CLI_HOME_PATH;
    const packageName = SETTINGS[cmdObj.name()];
    const packageVersion = 'latest';
    // 没有传路径 =》 找缓存路径 =》 有则更新没有则下载安装
    if (!targetPath) {
      targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
      storeDir = path.resolve(targetPath, 'node_modules');
      pkg = new Package({
        targetPath,
        packageName,
        packageVersion,
        storeDir
      });
      if (await pkg.exists()) { // 更新package
        await pkg.update();
      } else { // 安装package
        await pkg.install();
      }
    } else { // 传入了targetPath
      pkg = new Package({
        targetPath,
        packageName,
        packageVersion
      });
    }
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);
    log.verbose('storeDir', storeDir);
    // 获取最终执行文件路径
    const rootFile = pkg.getRootFilePath();
    // init需要packageName,和一个对象，但是arguments是一个伪数组
    // 所以需要调用apply把数组转换为参数列表形式
    if (rootFile) {
      require(rootFile).call(null, Array.from(arguments));
    } else {
      throw new Error(colors.red('未找到文件'));
    }
  } catch (e) {
    if (process.env.LOG_LEVEL === 'verbose') {
      console.error(e)
    } else {
      log.error('', e.message);
    }
  }
}

module.exports = exec;
