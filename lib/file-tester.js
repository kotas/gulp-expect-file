'use strict';

var StringTester = require('./string-tester');
var StreamTester = require('./stream-tester');
var Minimatch = require('minimatch').Minimatch;
var util = require('./util');
var async = require('async');
var path = require('path');

module.exports = FileTester;

function FileTester(expectation) {
  this.rules = this.parseExpectation(expectation);
}

FileTester.prototype.parseExpectation = function (expectation) {
  if (expectation instanceof Array) {
    var nested = expectation.map(this.parseExpectation.bind(this));
    return Array.prototype.concat.apply([], nested);
  }
  switch (typeof expectation) {
    case 'string':
      return [new Rule(expectation)];
    case 'function':
      return [new Rule(null, expectation)];
    case 'object':
      return Object.keys(expectation).map(function (path) {
        return new Rule(path, expectation[path] === true ? null : expectation[path]);
      });
    default:
      throw new Error('Unknown expectation type');
  }
};

FileTester.prototype.test = function (file, callback) {
  var matchedAny = false;
  async.eachSeries(this.rules, function (rule, next) {
    if (!rule.matchFilePath(file.relative)) {
      return next(null);
    }
    matchedAny = true;
    rule.testFile(file, next);
  }, function (err) {
    if (!err && !matchedAny) {
      err = new Error('unexpected');
    }
    callback(err);
  });
};

FileTester.prototype.getUnusedRules = function () {
  return this.rules.filter(function (rule) { return !rule.isUsed() });
};


function Rule(path, tester) {
  this.path = path;
  this.minimatch = path ? new Minimatch(path) : null;
  this.tester = tester ? Rule.wrapTester(tester) : null;
  this.used = false;
}

Rule.prototype.matchFilePath = function (path) {
  if (this.minimatch) {
    return this.minimatch.match(path);
  } else {
    return true;
  }
};

Rule.prototype.testFile = function (file, callback) {
  this.used = true;
  if (this.tester) {
    this.tester(file, callback);
  } else {
    callback(null);
  }
};

Rule.prototype.isUsed = function () {
  return this.used;
};

Rule.prototype.toString = function () {
  return this.path || '(custom)';
};

Rule.wrapTester = function (tester) {
  if (typeof tester === 'function') {
    return util.wrapAssertion(tester);
  }

  var stringTester = (tester instanceof StringTester) ? tester : new StringTester(tester);
  var streamTester = new StreamTester(stringTester);
  return function (file, callback) {
    if (file.isNull()) {
      callback(new Error('The file is not read'));
    } else if (file.isStream()) {
      streamTester.test(file.contents, callback);
    } else if (file.isBuffer()) {
      stringTester.test(file.contents.toString(), callback);
    }
  };
};
