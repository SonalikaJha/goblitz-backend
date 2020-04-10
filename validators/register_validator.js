"use strict";

const Validator = require('./validator');

module.exports = class RegisterValidator extends Validator {
  /**
   * Rules
   */
  rules = {
    username: 'required|regex:/(^([a-zA-Z0-9\\._!@#$&]+)(\\d+)?$)/|max:100',
    email: 'required|email',
    name: 'required|string',
    password: 'required',
    dob: 'required|date',
    country: 'required|string'
  };
}
