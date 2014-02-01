'use strict';

var async = require('async');

module.exports = StringTester;

function StringTester(expectation) {
  this.tester = this.parseExpectation(expectation);
}

StringTester.prototype.test = function (target, callback) {
  this.tester(target, callback);
};

StringTester.prototype.parseExpectation = function (expectation) {
  if (expectation instanceof Array) {
    var expectations = expectation.map(this.parseExpectation.bind(this));
    return function (target, callback) {
      async.applyEachSeries(expectations, target, callback);
    };
  }

  if (typeof expectation === 'function') {
    return wrap(expectation);
  }

  if (typeof expectation === 'string') {
    return wrap(
      function (target) { return target.indexOf(expectation) >= 0; },
      'not contain ' + JSON.stringify(expectation)
    );
  }
  if (expectation instanceof RegExp) {
    return wrap(
      function (target) { return expectation.test(target); },
      'not match against ' + expectation.toString()
    );
  }

  throw new Error('Unknown expectation type');
};

function wrap(func, errorMessage) {
  if (func.length >= 2) {
    return func;
  }

  if (!errorMessage) {
    errorMessage = 'failed assertion' + (func.name ? ' on ' + func.name : '');
  }
  return function (target, callback) {
    try {
      var result = func(target);
    } catch (e) {
      callback(e);
      return;
    }

    if (result === false || result instanceof Error) {
      callback(result || new Error(errorMessage));
    } else {
      callback(null);
    }
  };
}
