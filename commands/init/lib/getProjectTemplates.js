const request = require('@sim-cli/request');
module.exports = function () {
  return request({
    url: '/project/template',
    method: 'GET'
  })
}
