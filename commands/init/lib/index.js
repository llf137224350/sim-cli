'use strict';
const Command = require('@sim-cli/command');
const log = require('@sim-cli/log');

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
  exec() {

  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;

