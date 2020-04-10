"use strict";

const Validator = require('../validator');

module.exports = class LoginValidator extends Validator {
  /**
   * Rules
   */
  rules = {
    username: 'required_without:email',
    email: 'required_without:username|email',
    password: 'required|string',
  };
}
