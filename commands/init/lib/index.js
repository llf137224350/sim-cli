'use strict';
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const glob = require('glob');
const ejs = require('ejs');

const Command = require('@sim-cli/command');
const log = require('@sim-cli/log');
const Package = require('@sim-cli/package');
const {startSpinner, execAsync} = require('@sim-cli/utils');
const getProjectTemplates = require('./getProjectTemplates');
// 项目类型
const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const TEMPLATE_TYPE_NORMAL = 'normal'; // 标准模板
const TEMPLATE_TYPE_CUSTOM = 'custom'; // 自定义模板
const WHITE_COMMANDS = ['npm', 'cnpm']; // 命令白名单
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
      this.projectInfo = projectInfo;
      // 下载项目模板
      await this.downloadTemplate();
      // 安装模板
      await this.installTemplate();
    } catch (e) {
      if (process.env.LOG_LEVEL === 'verbose') {
        console.error(e);
      } else {
        log.error('', e.message);
      }
    }
  }

  /**
   * 安装模板
   * @returns {Promise<void>}
   */
  async installTemplate() {
    if (!this.templateInfo) {
      throw new Error('项目模板信息不存在！');
    }
    if (!this.templateInfo.type) { //  没有类型，按标准模板处理
      this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
    }
    if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) { // 标准安装
      await this.installNormalTemplate();
    } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {  // 自定义安装
      await this.installCustomTemplate();
    } else {
      throw new Error('项目模板类型无法识别！');
    }
  }

  /**
   * 判断是否是在命令白名单中
   * @param command
   */
  checkWhite(command) {
    return WHITE_COMMANDS.includes(command) ? command : null;
  }

  /**
   * 执行后端返回的命令
   * @param command
   * @param errMsg
   * @returns {Promise<void>}
   */
  async execCommand(command, errMsg) {
    let ret = -1;
    if (command) {
      const cmdArray = command.split(' ');
      const cmd = this.checkWhite(cmdArray[0]);
      if (!cmd) {
        throw new Error('命令不存在，执行命令：' + command);
      }
      ret = await execAsync(cmd, cmdArray.slice(1));
      if (ret !== 0) {
        throw new Error(errMsg);
      }
    }
    return ret;
  }

  /**
   * 模板渲染
   * @returns {Promise<void>}
   */
  async ejsRender(options) {
    return new Promise((resolve, reject) => {
      const dir = process.cwd();
      glob('**', {
        cwd: dir,
        ignore: options.ignore || '',
        nodir: true
      }, (error, files) => {
        if (error) {
          reject(error);
        }
        Promise.all(files.map((file) => {
          const filePath = path.resolve(dir, file);
          return new Promise((resolve, reject) => {
            const options = {
              className: this.projectInfo.className,
              version: this.projectInfo.version
            }
            if (this.projectInfo.description) { // 当为组件的时候 有description
              options['description'] = this.projectInfo.description;
            }
            ejs.renderFile(filePath, options, (error, result) => {
              if (error) {
                reject(error);
              }
              // 重新写入文件
              fse.writeFileSync(filePath, result);
              resolve(result);
            })
          })
        })).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
      });
    });
  }

  /**
   * 安装标准模板
   */
  async installNormalTemplate() {
    const spinner = startSpinner('正在安装模板...');
    try {
      const templatePath = path.resolve(this.packageManager.cacheFilePath, 'template');
      const targetPath = process.cwd();
      // 确保目录是否存在，如果不存在则创建
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      // 拷贝模板
      fse.copySync(templatePath, targetPath);
      // 停止动画
      spinner.stop(true);
      // ejs模板渲染
      let ignore = ['**/node_modules/**'];
      if (this.templateInfo.ignore) {
        ignore = [...ignore, ...this.templateInfo.ignore];
      }
      await this.ejsRender({ignore});
      const {installCommand, startCommand} = this.templateInfo;
      // 依赖安装
      await this.execCommand(installCommand, '依赖安装失败！');
      // 执行项目启动命令
      await this.execCommand(startCommand, '项目启动失败！');
    } catch (e) {
      spinner.stop(true);
      throw e
    }
  }

  /**
   * 安装自定义模板
   */
  async installCustomTemplate() {
    if (await this.packageManager.exists()) {
      const rootFile = this.packageManager.getRootFilePath();
      if (fs.existsSync(rootFile)) {
        log.notice('开始执行自定义模板文件');
        console.log(this.projectInfo);
        const options = {
          projectInfo: this.projectInfo,
          templateInfo: this.templateInfo,
          sourcePath: path.resolve(this.packageManager.cacheFilePath, 'template'),
          targetPath: process.cwd()
        }
        const code = `require('${rootFile}')(${JSON.stringify(options)})`;
        const ret = await execAsync('node', ['-e', code]);
        log.success('自定义模板安装成功，code：' + ret);
      } else {
        throw new Error('自定义模板入口文件不存在！');
      }
    }
  }

  /**
   * 下载项目模板
   */
  async downloadTemplate() {
    const {projectTemplate} = this.projectInfo;
    // 获取模板信息
    const templateInfo = this.templates.find(item => item.npmName === projectTemplate);
    const storeDir = path.resolve(userHome, '.sim-cli', 'template', 'node_modules');
    const targetPath = path.resolve(userHome, '.sim-cli', 'template');
    const packageManager = new Package({
      packageName: templateInfo.npmName,
      packageVersion: templateInfo.version,
      targetPath: targetPath,
      storeDir: storeDir
    });
    if (await packageManager.exists()) { // 存在 有新版本更新 无新版本 无操作
      await packageManager.update();
      this.templateInfo = templateInfo;
      this.packageManager = packageManager;
      log.success('模板更新成功！');
    } else {
      await packageManager.install();
      this.templateInfo = templateInfo;
      this.packageManager = packageManager;
      log.success('模板下载成功！');
    }
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
    // 判断模板是否存在
    const templates = await getProjectTemplates();
    if (!templates || !templates.length) {
      throw new Error('项目模板不存在！');
    }
    this.templates = templates.filter((template) => {
      return template.tag.includes(type);
    });
    await this.getProjectInfo(info, type);
    info['type'] = type;
    return info;
  }

  validateProjectName() {
    return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(this.projectName)
  }

  /**
   * 获取项目基本信息
   * @param info
   * @param type
   */
  async getProjectInfo(info, type) {
    // 判断用户是否传入projectName
    let isOk = false;
    if (this.projectName) {
      isOk = this.validateProjectName();
    }
    const options = [];
    const title = type === TYPE_PROJECT ? '项目' : '组件';
    if (!isOk) { // 传入的项目名称不合法
      options.push({
        type: 'input',
        name: 'projectName',
        message: `请输入${title}名称：`,
        default: '',
        validate: function (v) {
          // 首字符必须为字母
          // 中间只能为字母 数字 - _
          // 尾字符只能为数字或者字母
          const done = this.async();
          setTimeout(function () {
            if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done(`请输入合法的${title}名称`);
              return;
            }
            done(null, true);
          }, 0);
        },
        filter: function (v) {
          return v;
        }
      });
    }
    options.push({
      type: 'input',
      name: 'projectVersion',
      message: `请输入${title}版本号：`,
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
    });
    if (type === TYPE_COMPONENT) {
      options.push({
        type: 'input',
        name: 'componentDescription',
        message: `请输入${title}描述信息：`,
        default: '',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done(`请输入${title}描述信息`);
              return;
            }
            done(null, true);
          }, 0);
        }
      });
    }
    options.push({
      type: 'list',
      name: 'projectTemplate',
      message: `请选择${title}模板`,
      choices: this.createTemplatesChoices()
    });
    const o = await inquirer.prompt(options);
    if (isOk) { // 传入的项目名称合法
      o.projectName = this.projectName;
    }
    // 格式化项目名称 将驼峰形式转为使用-连接的形式 如abcDef => abc-def
    o.className = require('kebab-case')(o.projectName).replace(/^-/, '');
    o.version = o.projectVersion;
    // 如果是组件，则新增一个属性记录描述
    if (type === TYPE_COMPONENT) {
      o.description = o.componentDescription;
    }
    Object.assign(info, o);
  }

  /**
   * 选择项目模板
   */
  createTemplatesChoices() {
    return this.templates.map((item) => {
      return {
        name: item.name,
        value: item.npmName
      }
    });
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
      ifContinue = await this.confirm(colors.red(`是否确认清空 "${currentDirPath}" 目录？`));
      if (!ifContinue) { // 输入n也要安装，只是不清空本地文件夹
        return true;
      }
      // 清空目录
      fse.emptyDirSync(currentDirPath);
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

