// This is your Editor pane. Write your JavaScript here and 
// use the command line to execute commands
"use strict"

class Red {
  rules = {};
  constructor() {
      console.log(this.getRules());
  }
  getRules() {
    return this.rules;
  }
}

class Green extends Red {
  rules = {
    blue: "yellow"
  };
}

const purple = new Green();

console.log(purple.getRules());