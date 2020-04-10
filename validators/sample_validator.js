"use strict";

const Validator = require('./validator');

module.exports = class SampleValidator extends Validator {
  /**
   * Rules
   */
  rules = {
    name: 'required|string',
  };
}
