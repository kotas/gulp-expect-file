var gutil = require('gulp-util');
var temp = require('temp');
var path = require('path');
var es = require('event-stream');
var ExpectationError = require('../lib/errors').ExpectationError;

module.exports.should = require('should');

Function.prototype.expectFail = function (expectedError) {
  var _this = this;
  return function (err) {
    if (err) {
      if (!(err instanceof ExpectationError)) {
        return _this(err);
      }

      if (expectedError) {
        try {
          var message = err.message;
          if (typeof expectedError === 'string') {
            message.should.equal(expectedError);
          } else if (typeof expectedError === 'function') {
            expectedError(err);
          } else if (expectedError instanceof RegExp) {
            message.should.match(expectedError);
          }
        } catch (e) {
          _this(e);
          return;
        }
      }
      _this();
    } else {
      _this(new Error('Expectation should fail'));
    }
  };
};

module.exports.createFile = function (relpath, contents) {
  if (typeof contents === 'string') {
    contents = new Buffer(contents);
  }
  if (contents instanceof Array) {
    contents = es.readArray(contents);
  }
  return new gutil.File({
    cwd: '/test/',
    base: '/test/',
    path: '/test/' + relpath,
    contents: contents ? contents : null
  });
};

module.exports.createTemporaryFile = function (callback) {
  temp.track();
  temp.open('gulp-expect-file', function (err, info) {
    if (err) return callback(err, null);

    var file = new gutil.File({
      cwd: path.dirname(info.path),
      base: path.dirname(info.path),
      path: info.path,
      contents: null
    });
    file.cleanup = function () {
      temp.cleanup();
    };

    callback(null, file);
  });
};

gutil.log.capture = function () {
  if (gutil.log.captured) return;

  var logs = '';
  var expectedPatterns = [];

  var original = gutil.log;
  gutil.log = function () {
    var args = Array.prototype.slice.call(arguments);
    var log = args.map(function (arg) { return arg.toString() }).join(' ');
    log = gutil.colors.stripColor(log);
    logs += log + '\n';
    return this;
  };
  gutil.log.captured = true;
  gutil.log.restore = function () {
    gutil.log = original;

    expectedPatterns.forEach(function (pattern) {
      logs.should.match(pattern);
    });
  };
  gutil.log.expect = function (pattern) {
    expectedPatterns.push(pattern);
  };
};
