'use strict';

var FileTester = require('./lib/file-tester');
var gutil = require('gulp-util');
var through = require('through2');
var xtend = require('xtend');
var color = gutil.colors;

module.exports = function (options, expectation) {
  if (!expectation) {
    expectation = options;
    options = {};
  }
  if (!expectation) {
    throw new gutil.PluginError('gulp-expect-file', 'Expectation required');
  }

  options = xtend({
    reportUnexpected: true,
    reportMissing: true,
    errorOnFailure: true,
    silent: false,
    verbose: false
  }, options || {});

  try {
    var fileTester = new FileTester(expectation);
  } catch (e) {
    throw new gutil.PluginError('gulp-expect-file', e.message || e);
  }

  var numTests = 0, numPasses = 0, numFailures = 0;

  function eachFile(file, encoding, done) {
    numTests++;

    // To fix relative path to be based on cwd (where gulpfile.js exists)
    file.base = file.cwd;

    var _this = this;
    fileTester.test(file, function (err) {
      if (err && err.message === 'unexpected' && !options.reportUnexpected) {
        err = null;
      }
      if (err) {
        numFailures++;
        reportFailure(file, err, emitError.bind(_this));
      } else {
        numPasses++;
        reportPassing(file);
      }
      _this.push(file);
      done();
    });
  }

  function endStream(done) {
    if (options.reportMissing) {
      numTests++;

      var unusedRules = fileTester.getUnusedRules();
      if (unusedRules.length === 0) {
        numPasses++;
      } else {
        numFailures++;
        reportMissing(unusedRules, emitError.bind(this));
      }
    }

    reportSummary();
    numTests = numPasses = numFailures = 0;
    done();
  }


  function emitError(message) {
    if (options.errorOnFailure) {
      this.emit('error', new gutil.PluginError('gulp-expect-file', message));
    }
  };

  function reportFailure(file, err, emitter) {
    options.silent || gutil.log(
      color.red("\u2717 FAIL:"),
      color.magenta(file.relative),
      (err.message || err)
    );
    emitter('Expectation failed: ' + file.relative + ' ' + (err.message || err));
  }

  function reportPassing(file) {
    if (options.verbose && !options.silent) {
      gutil.log(
        color.green("\u2713 PASS:"),
        color.magenta(file.relative)
      );
    }
  }

  function reportMissing(rules, emitter) {
    var missings = rules.map(function (r) { return r.toString() }).join(', ');
    if (!options.silent) {
      gutil.log(
        color.red("\u2717 FAIL:"),
        'Missing',
        color.cyan(rules.length),
        'expected files:',
        color.magenta(missings)
      );
    }
    emitter('Missing ' + rules.length + ' expected files: ' + missings);
  }

  function reportSummary() {
    options.silent || gutil.log(
      'Tested',
      color.cyan(numTests), 'tests,',
      color.cyan(numPasses), 'passes,',
      color.cyan(numFailures), 'failures:',
      (numFailures > 0 ? color.bgRed.white('FAIL') : color.green('PASS'))
    );
  }

  return through.obj(eachFile, endStream);
};
