'use strict';
const Spinner = require('cli-spinner').Spinner;
const cp = require('child_process');

/**
 * 是否为一个对象
 * @param o
 * @returns {boolean}
 */
function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

/**
 * 睡眠
 * @param timeout
 * @returns {Promise<unknown>}
 */
function sleep(timeout = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

/**
 * 终端动画
 * @param msg 提示文本
 * @param spinnerStr 动画内容
 * @returns {Spinner}
 */
function startSpinner(msg = 'loading...', spinnerStr = '|/-\\') {
  const spinner = new Spinner(`${msg} %s`);
  spinner.setSpinnerString(spinnerStr);
  spinner.start();
  return spinner;
}

/**
 * 兼容windows spawn
 * @param command mode
 * @param args ['-e',code]
 * @param options
 * @returns {ChildProcessWithoutNullStreams}
 */
function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  // win32 ['/c','node','-e',code]
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return cp.spawn(command, cmdArgs, options || {
    cwd: process.cwd(),
    stdio: 'inherit' // 将输出流直接输出到主进程
  })
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = exec(command, args, options);
    p.on('error', (e) => {
      reject(e);
    });
    p.on('exit', (e) => {
      resolve(e);
    });
  });
}

module.exports = {
  isObject,
  sleep,
  startSpinner,
  exec,
  execAsync
};

