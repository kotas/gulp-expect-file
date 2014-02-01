var helper = require('./helper');
var createFile = helper.createFile;
var expect = require('../index');
var gutil = require('gulp-util');

function testStream(stream, callback) {
  var pipedFiles = [];
  var error = null;
  stream.on('data', function (file) {
    pipedFiles.push(file);
  });
  stream.on('error', function (err) {
    error = err;
  });
  stream.on('end', function () {
    callback(error, pipedFiles);
  });
  return stream;
}

describe('gulp-expect-file', function () {

  beforeEach(function () {
    gutil.log.capture();
  });

  afterEach(function () {
    gutil.log.restore();
  });

  context('with file names', function () {
    it('tests all files are expected', function (done) {
      gutil.log.expect(/PASS/);
      var stream = expect(['foo.txt', 'bar.txt']);
      testStream(stream, function (error, files) {
        if (error) return done(error);
        files.should.have.length(2);
        done();
      });
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    });
  });

  context('with contents matcher', function () {
    it('tests file contents matches expectation', function (done) {
      gutil.log.expect(/PASS/);
      var stream = expect({
        'foo.txt': 'world',
        'bar.txt': /^hello/i,
      });
      testStream(stream, done);
      stream.write(createFile('foo.txt', 'Hello, world!'));
      stream.write(createFile('bar.txt', 'Hello, earth!'));
      stream.end();
    });

    it('fails if file contents not matching expectation', function (done) {
      gutil.log.expect(/FAIL: foo\.txt is not containing "world"/);
      var stream = expect({ 'foo.txt': 'world' });
      testStream(stream, done);
      stream.write(createFile('foo.txt', 'Hello, earth!'));
      stream.end();
    });
  });

  context('with { reportUnexpected: true }', function () {
    it('should report unexpected files', function (done) {
      gutil.log.expect(/FAIL: bar\.txt is unexpected/);
      var stream = expect({ reportUnexpected: true }, 'foo.txt');
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    });
  });

  context('with { reportUnexpected: false }', function () {
    it('should not report unexpected files', function (done) {
      gutil.log.expect(/PASS/);
      var stream = expect({ reportUnexpected: false }, 'foo.txt');
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    });
  });

  context('with { reportMissing: true }', function () {
    it('should report missing files', function (done) {
      gutil.log.expect(/FAIL: Missing 1 expected files: bar\.txt/);
      var stream = expect({ reportMissing: true }, ['foo.txt', 'bar.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    });
  });

  context('with { reportMissing: false }', function () {
    it('should not report missing files', function (done) {
      gutil.log.expect(/PASS/);
      var stream = expect({ reportMissing: false }, ['foo.txt', 'bar.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    });
  });

  context('with { errorOnFailure: true }', function () {
    it('should emit error event if expectation failed', function (done) {
      var stream = expect({ errorOnFailure: true }, { 'foo.txt': 'world' });
      testStream(stream, function (err) {
        err.should.be.instanceof(gutil.PluginError);
        err.message.should.equal('Failed 1 expectations');
        done();
      });
      stream.write(createFile('foo.txt', 'Hello, earth!'));
      stream.end();
    });
  });

  context('with { silent: true }', function () {
    it('should not write any logs', function (done) {
      gutil.log.expect(/^$/);
      var stream = expect({ silent: true }, ['foo.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    });
  });

  context('with { verbose: true }', function () {
    it('should also report passings', function (done) {
      gutil.log.expect(/PASS: foo\.txt/);
      var stream = expect({ verbose: true }, ['foo.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    });
  });

});
