'use strict';

var FileTester = require('./lib/file-tester');
var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (expectation) {
  if (!expectation) {
    throw new gutil.PluginError('gulp-test-file', 'Expectation required');
  }

  try {
    var fileTester = new FileTester(expectation);
  } catch (e) {
    throw new gutil.PluginError('gulp-test-file', e.message || e);
  }

  return through.obj(function (file, encoding, done) {
    // To fix relative path to be based on cwd (where gulpfile.js exists)
    file.base = file.cwd;

    var _this = this;
    fileTester.test(file, function (err) {
      if (err) {
        var message = 'Expectation error: ' + file.relative + ' ' + (err.message || err);
        _this.emit('error', new gutil.PluginError('gulp-test-file', message));
      }
      _this.push(file);
      done();
    });
  });
};
