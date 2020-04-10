"use strict";

const ValidatorJS = require("validatorjs");

/**
 * Create Company Validator
 */
class Validator {
  /**
   * Rules
   */
  rules = {};

  /**
   * Error Messages
   */
  messages = {};

  /**
   * Validated fields' object
   */
  validated = {};
  /**
   * Object to be validated
   */
  data = {};
  /**
   * Validator
   */
  validator;

  isValidated = false;
  
  /**
   * Constructor
   * @param {*} req
   */
  constructor(req) {
    this.data = req.body;
  }

  /**
   * Check if the validator fails
   */
  fails() {
    if(!this.isValidated) {
      this.initialize();
    }
    return this.validator.fails();
  }

  /**
   * Check if the validator passes
   */
  passes() {
    if(!this.isValidated) {
      this.initialize();
    }
    return this.validator.passes();
  }

  errors() {
    return this.validator.errors;
  }

  /**
   * Get only the validated content
   */
  initialize(getNull = false) {
    this.validator = new ValidatorJS(this.data, this.rules, this.messages);
    for (const rule in this.rules) {
      if (this.data[rule] == undefined) {
        if (getNull) {
          this.validated[rule] = null;
        }
      } else {
        this.validated[rule] = this.data[rule];
      }
    }
    this.isValidated = true;
    return this;
  }
}

module.exports = Validator;
