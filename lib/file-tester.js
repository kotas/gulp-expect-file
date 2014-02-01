'use strict';

var StringTester = require('./string-tester');
var StreamTester = require('./stream-tester');
var Minimatch = require('minimatch').Minimatch;
var async = require('async');

module.exports = FileTester;

function FileTester(expectation) {
  this.rules = [];
  this.parseExpectation(expectation);
}

FileTester.prototype.parseExpectation = function (expectation) {
  if (expectation instanceof Array) {
    expectation.forEach(this.parseExpectation.bind(this));
    return;
  }

  switch (typeof expectation) {
    case 'string':
      this.rules.push({ path: new Minimatch(expectation) });
      break;
    case 'function':
      this.rules.push({ contents: assertion(expectation) });
      break;
    case 'object':
      var _this = this;
      Object.keys(expectation).forEach(function (pattern) {
        if (typeof expectation[pattern] === 'boolean') {
          _this.rules.push({ path: new Minimatch(pattern), expected: expectation[pattern] });
        } else {
          var contentsTester = _this.createContentsTester(expectation[pattern]);
          _this.rules.push({ path: new Minimatch(pattern), contents: contentsTester });
        }
      });
      break;
    default:
      throw new Error('Unknown expectation type');
  }
};

FileTester.prototype.createContentsTester = function (expectation) {
  var stringTester = new StringTester(expectation);
  var streamTester = new StreamTester(stringTester);
  return function (file, callback) {
    if (file.isNull()) {
      callback(new Error('The file is not read'));
    } else if (file.isStream()) {
      streamTester(file.contents, callback);
    } else if (file.isBuffer()) {
      stringTester(file.contents.toString(), callback);
    }
  };
};

FileTester.prototype.test = function (file, callback) {
  var matched = false;
  async.eachSeries(this.rules, function (rule, next) {
    if (rule.path && !rule.path.match(file.relative)) {
      return next(null);
    }

    matched = true;

    if (rule.expected === false) {
      return next(new Error('should not exist'));
    }

    if (rule.contents) {
      rule.contents(file, next);
    } else {
      next(null);
    }
  }, function (err) {
    if (!err && !matched) {
      err = new Error('is not expected');
    }
    callback(err);
  });
};
