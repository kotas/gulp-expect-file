var temp = require('temp');
var path = require('path');
var streamArray = require('stream-array');
var stripAnsi = require('strip-ansi');
var captureConsole = require('capture-console');
var Vinyl = require('vinyl');
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
    contents = Buffer.from(contents);
  }
  if (contents instanceof Array) {
    contents = streamArray(contents);
  }
  return new Vinyl({
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

    var file = new Vinyl({
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


var capturedLog;
var expectedPatterns;

module.exports.withCapture = function (callback) {
  return function (done) {
    capturedLog = '';
    expectedPatterns = [];

    captureConsole.startIntercept(process.stdout, function (stdout) {
      capturedLog += stripAnsi(stdout);
    });

    try {
      callback(function (err) {
        captureConsole.stopIntercept(process.stdout);
        if (err) return done(err);

        expectedPatterns.forEach(function (pattern) {
          capturedLog.should.match(pattern);
        });

        done();
      });
    } catch (e) {
      captureConsole.stopIntercept(process.stdout);
      throw e;
    }
  };
};

module.exports.expectLog = function (pattern) {
  expectedPatterns.push(pattern);
};
