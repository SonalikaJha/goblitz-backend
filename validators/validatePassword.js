"use strict";

const Validator = require('./validator');

module.exports = class ValidatePassword extends Validator {
  /**
   * Rules
   */
  rules = {
    password: 'required',
    token: 'required|string'
  };
}
