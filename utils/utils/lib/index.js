'use strict';
const Spinner = require('cli-spinner').Spinner;

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

module.exports = {
  isObject,
  sleep,
  startSpinner
};

