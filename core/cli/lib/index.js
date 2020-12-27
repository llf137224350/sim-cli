'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const dotenv = require('dotenv');
const pkg = require('../package.json');
const log = require('@sim-cli/log');
const npmInfo = require('@sim-cli/get-npm-info')
const constant = require('./constant');
let argv;

async function core() {
  try {
    // 1、检查版本号
    checkPkgVersion();
    // 2、检查node版本号
    checkNodeVersion();
    // 3、检查是否为root权限使用sim-cli
    checkRoot();
    // 4、检查用户主目录
    checkUserHome();
    // 5、检查入参
    checkInputArgs();
    // 6、检查环境变量
    checkEnv();
    // 7、检查版本更新
    await checkGlobalUpdate();
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

// 检查用户主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在，请检查后重试！'));
  }
}

// 检查入参
function checkInputArgs() {
  argv = require('minimist')(process.argv.slice(2));
  checkArgs();
}

// 设置log级别
function checkArgs() {
  process.env.LOG_LEVEL = argv.debug || argv.d ? 'verbose' : 'info';
  log.level = process.env.LOG_LEVEL;
}

// 检查环境变量
function checkEnv() {
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {// 主目录下存在.env文件
    // 执行后主目录下.env申明的会被挂载到 process.env上
    dotenv.config({path: dotenvPath});
  }
  // 将cli后续缓存等使用的路径设置到环境变量
  process.env.CLI_HOME_PATH = path.join(userHome, process.env.CLI_HOME || constant.DEFAULT_CLI_HOME);

  // 主目录下不存在 .env文件
  // createDefaultConfig();
}

// 创建默认配置文件
// function createDefaultConfig() {
//   const defaultConfig = {
//     home: userHome
//   }
//   defaultConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME || constant.DEFAULT_CLI_HOME);
//   // 将路径设置到环境变量
//   process.env.CLI_HOME_PATH = defaultConfig.cliHome;
// }

// 检查版本更行
// TODO: 每次执行都检查更新是否值得，因为如果请求npm官方，则请求会比较慢，那么执行命令给人的感觉会不会比较慢？
async function checkGlobalUpdate() {
  // 获取当前版本、包名
  const currentVersion = pkg.version;
  const packageName = pkg.name;
  // 调用npm 接口，获取版本信息 http://registry.npmjs.org/包名
  // 获取大于当前版本的最新的版本号
  const lastVersion = await npmInfo.getNpmSemverVersion(currentVersion, packageName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) { // 有新版本
    log.warn('更新提示：', `请手动更新${packageName}到最新版本，当前版本：${currentVersion}，最新版本：${lastVersion}。`);
    log.warn('更新命令：', `npm install -g ${packageName}`);
  }
}
