'use strict';
const fs = require('fs');
const inquirer = require('inquirer');
const fes = require('fs-extra');
const semver = require('semver');
const Command = require('@sim-cli/command');
const log = require('@sim-cli/log');

// 项目类型
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

/**
 * 初始化命令
 */
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('projectName', this.projectName);
    log.verbose('force', this.force);
  }

  /**
   * 业务逻辑
   */
  async exec() {
    try {
      //  1.0 准备阶段
      const projectInfo = await this.prepare();
      if (!projectInfo) return;
      // 下载项目模板
      this.downloadTemplate();
    } catch (e) {
      if (process.env.LOG_LEVEL === 'verbose') {
        console.error(e);
      } else {
        log.error('', e.message);
      }
    }
  }

  /**
   * 下载项目模板
   */
  downloadTemplate() {
    console.log('下载项目模板');
  }

  /**
   * 执行准备阶段
   * @returns {Promise<void>} true继续执行，false中断执行
   */
  async prepare() {
    // 处理是否为空逻辑处理，返回 true继续执行，false中断执行
    const res = await this.emptyDirSync();
    if (!res) return false;
    // 获取基本信息
    return await this.getObjectBaseInfo();
  }

  /**
   * 获取创建项目的基本信息
   * @returns {Promise<void>}
   */
  async getObjectBaseInfo() {
    const info = {};
    const {type} = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择项目初始化类型',
      default: TYPE_PROJECT,
      choices: [{
        name: '项目',
        value: TYPE_PROJECT
      }, {
        name: '组件',
        value: TYPE_COMPONENT
      }]
    });
    if (type === TYPE_PROJECT) {
      //  获取项目信息
      await this.getProjectInfo(info);
    } else if (type === TYPE_COMPONENT) {
      // 获取项目信息
    }
    info['type'] = type;
    return info;
  }

  /**
   * 获取项目基本信息
   * @param info
   */
  async getProjectInfo(info) {
    const o = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称：',
        default: '',
        validate: function (v) {
          // 首字符必须为字母
          // 中间只能为字母 数字 - _
          // 尾字符只能为数字或者字母
          const done = this.async();
          setTimeout(function () {
            if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('请输入合法的项目名称');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          return v;
        }
      },
      {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号：',
        default: '1.0.0',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!(!!semver.valid(v))) {
              done('请输入合法的项目版本号');
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          return semver.valid(v) ? semver.valid(v) : v;
        }
      }
    ]);
    Object.assign(info, o);
  }

  /**
   * 清空目录
   * @returns {Promise<boolean>} true 继续向下执行，false终止执行
   */
  async emptyDirSync() {
    const currentDirPath = process.cwd();
    // 判断当前目录是否空
    const isEmpty = this.isDirEmpty(currentDirPath);
    // 当前目录不为空
    if (!isEmpty) {
      let ifContinue = false;
      if (!this.force) { // 没有传入--force，则询问是否清空
        ifContinue = await this.confirm('当前目录不为空，是否继续创建？');
        if (!ifContinue) { // 输入n
          return false;
        }
      }
      // 二次确认
      ifContinue = await this.confirm('是否确认清空当前目录？');
      if (!ifContinue) { // 输入n也要安装，只是不清空本地文件夹
        return true;
      }
      // 清空目录
      fes.emptyDirSync(currentDirPath);
    }
    return true;
  }

  /**
   * 终端询问
   * @param message
   * @returns {Promise<*>}
   */
  async confirm(message) {
    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: message,
      default: false
    });
    return answer.continue;
  }

  /**
   * 判断当前执行命令的目录是否为空目录
   * @returns {boolean} 是否为空
   */
  isDirEmpty(dirPath) {
    let fileList = fs.readdirSync(dirPath);
    // 过滤掉不影响的文件
    fileList = fileList.filter((file) => {
      return !file.startsWith('.') && !['node_modules'].includes(file);
    });
    return !fileList || fileList.length <= 0;
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;

