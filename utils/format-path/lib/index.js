'use strict';
const path = require('path');
module.exports = function formatPath(path) {
  if (path && typeof path === 'string') {
    const sep = path.sep;
    if (sep === '/') { // mac 或者 linux
      return path;
    } else { // windows
      return path.replace(/\\/g, '/');
    }
  }
  return path;
};
