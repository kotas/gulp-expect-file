var helper = require('./helper');
var createFile = helper.createFile;
var FileTester = require('../lib/file-tester');
var gutil = require('gulp-util');

describe('FileTester', function () {

  context('with a file name string', function () {
    var tester = new FileTester('foo.txt');

    it('should pass if has the same file name', function (done) {
      var file = createFile('foo.txt');
      tester.test(file, done);
    });

    it('should fail if has the different file name', function (done) {
      var file = createFile('foo.txt.gz');
      tester.test(file, done.expectFail('unexpected'));
    });
  });

  context('with a glob pattern string', function () {
    var tester = new FileTester('**/*.txt');

    it('should pass if matching the pattern', function (done) {
      var file = createFile('foo/bar/baz.txt');
      tester.test(file, done);
    });

    it('should fail if not matching the pattern', function (done) {
      var file = createFile('foo/bar/baz.txt.gz');
      tester.test(file, done.expectFail('unexpected'));
    });
  });

  context('with an array of patterns', function () {
    var tester = new FileTester(['foo.txt', '*.js']);

    it('should pass if the file name is in the array', function (done) {
      var file = createFile('foo.txt');
      tester.test(file, done);
    });

    it('should pass if the file name matches some glob in the array', function (done) {
      var file = createFile('bar.js');
      tester.test(file, done);
    });

    it('should fail if not in the array', function (done) {
      var file = createFile('bar.txt');
      tester.test(file, done.expectFail('unexpected'));
    });
  });

  context('with a hash of file name key and true', function () {
    var tester = new FileTester({
      'foo.txt': true,
      '*.js': true
    });

    it('should pass if exists in the hash', function (done) {
      var file = createFile('foo.txt');
      tester.test(file, done);
    });

    it('should pass if the file name matches some glob pattern in the hash', function (done) {
      var file = createFile('foo.js');
      tester.test(file, done);
    });

    it('should fail if not exists in the hash', function (done) {
      var file = createFile('baz.txt');
      tester.test(file, done.expectFail('unexpected'));
    });
  });

  context('with a hash of expected contents', function () {
    var tester = new FileTester({
      'foo.txt': 'world',
      'bar.txt': /^hello/i,
    });

    context('when contents is Buffer', function () {
      it('should pass if expected substring is in the contents', function (done) {
        var file = createFile('foo.txt', 'Hello, world!');
        tester.test(file, done);
      });

      it('should pass if expected RegExp pattern matches the contents', function (done) {
        var file = createFile('bar.txt', 'Hello, world!');
        tester.test(file, done);
      });

      it('should fail if expected substring not in the contents', function (done) {
        var file = createFile('foo.txt', 'Hello, earth!');
        tester.test(file, done.expectFail('not containing "world"'));
      });

      it('should fail if expected RegExp pattern not matches the contents', function (done) {
        var file = createFile('bar.txt', 'Bye, world!');
        tester.test(file, done.expectFail('not matching /^hello/i'));
      });
    });

    context('when contents is Stream', function () {
      it('should pass if expected substring is in the contents', function (done) {
        var file = createFile('foo.txt', ['Hel', 'lo, ', 'wor', 'ld!']);
        tester.test(file, done);
      });

      it('should pass if expected RegExp pattern matches the contents', function (done) {
        var file = createFile('bar.txt', ['Hel', 'lo, ', 'wor', 'ld!']);
        tester.test(file, done);
      });

      it('should fail if expected substring not in the contents', function (done) {
        var file = createFile('foo.txt', ['Hel', 'lo, ', 'ear', 'th!']);
        tester.test(file, done.expectFail('not containing "world"'));
      });

      it('should fail if expected RegExp pattern not matches the contents', function (done) {
        var file = createFile('bar.txt', ['Bye', ', ', 'wor', 'ld!']);
        tester.test(file, done.expectFail('not matching /^hello/i'));
      });
    });

    context('when contents is null', function () {
      it('should fail', function (done) {
        var file = createFile('foo.txt');
        tester.test(file, done.expectFail('not read'));
      });
    });
  });

  context('with checking real file', function () {
    var tempFile, tester;

    before(function (done) {
      helper.createTemporaryFile(function (err, file) {
        if (err) return done(err);
        tempFile = file;
        done();
      });
    });

    after(function () {
      tempFile && tempFile.cleanup();
      tempFile = null;
    });

    it('should pass if the file exists', function (done) {
      var tester = new FileTester(tempFile.relative, { checkRealFile: true });
      tester.test(tempFile, done);
    });

    it('should fail if the file not exists', function (done) {
      var tester = new FileTester('notexists.txt', { checkRealFile: true });
      var file = createFile('nonexists.txt');
      tester.test(file, done.expectFail('not on filesystem'));
    });
  });

});
