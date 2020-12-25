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
const constant = require('./constant');
let argv;

function core() {
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
  console.log(argv);
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
