'use strict';

module.exports = core;
const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const dotenv = require('dotenv');
const commander = require('commander');
const pkg = require('../package.json');
const log = require('@sim-cli/log');
const npmInfo = require('@sim-cli/get-npm-info')
const exec = require('@sim-cli/exec');
const constant = require('./constant');
const program = new commander.Command();//  创建一个命令实例
async function core() {
  try {
    // 准备阶段检查
    await prepare();
    // 8 、注册命令
    registerCommand();
  } catch (e) {
    if (program.debug) {
      console.error(e);
    } else {
      log.error('', e.message);
    }
  }
}

async function prepare() {
  // 1、检查版本号
  checkPkgVersion();
  // 3、检查是否为root权限使用sim-cli
  checkRoot();
  // 4、检查用户主目录
  checkUserHome();
  // 6、检查环境变量
  checkEnv();
  // 7、检查版本更新
  // await checkGlobalUpdate();
}

// 检查版本号
function checkPkgVersion() {
  log.info('', '当前版本：v' + pkg.version)
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

// 注册命令
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0]) // 设置名称
    .usage('<command> [options]') // 设置使用方式
    .version(pkg.version) // 设置版本
    .option('-d, --debug', '是否开启调试模式', false) // 添加调试模式
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  // 命令注册
  addCommand();
  // 添加命令事件监听
  addProgramEventListener();
  // 参数解析
  program.parse(process.argv);

  // 未输入命令 -- 打印帮助信息
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

// 命令注册
function addCommand() {
  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);
}

// 添加命令事件监听
function addProgramEventListener() {
  // 监听debug
  program.on('option:debug', function () {
    process.env.LOG_LEVEL = program.debug ? 'verbose' : 'info';
    log.level = process.env.LOG_LEVEL;
  });
  // 监听targetPath 属性
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = program.targetPath;
  });
  // 监听未知命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    log.error('不受支持的命令', obj[0]);
    availableCommands.length && log.info('当前支持的命令', availableCommands.join(','));
  });
}
