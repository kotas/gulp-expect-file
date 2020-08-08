var helper = require('./helper');
var createFile = helper.createFile;
var withCapture = helper.withCapture;
var expectLog = helper.expectLog;
var expect = require('../index');

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

  context('with file names', function () {
    it('tests all files are expected', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect(['foo.txt', 'bar.txt']);
      testStream(stream, function (error, files) {
        if (error) return done(error);
        files.should.have.length(2);
        done();
      });
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    }));
  });

  context('with contents matcher', function () {
    it('tests file contents matches expectation', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect({
        'foo.txt': 'world',
        'bar.txt': /^hello/i,
      });
      testStream(stream, done);
      stream.write(createFile('foo.txt', 'Hello, world!'));
      stream.write(createFile('bar.txt', 'Hello, earth!'));
      stream.end();
    }));

    it('fails if file contents not matching expectation', withCapture(function (done) {
      expectLog(/FAIL: foo\.txt is not containing "world"/);
      var stream = expect({ 'foo.txt': 'world' });
      testStream(stream, done);
      stream.write(createFile('foo.txt', 'Hello, earth!'));
      stream.end();
    }));
  });

  context('with empty array', function () {
    it('tests no files in stream', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect([]);
      testStream(stream, done);
      stream.end();
    }));

    it('fails if any file is in stream', withCapture(function (done) {
      expectLog(/FAIL: foo\.txt is unexpected/);
      var stream = expect([]);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    }));
  });

  context('with { reportUnexpected: true }', function () {
    it('should report unexpected files', withCapture(function (done) {
      expectLog(/FAIL: bar\.txt is unexpected/);
      var stream = expect({ reportUnexpected: true }, 'foo.txt');
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    }));
  });

  context('with { reportUnexpected: false }', function () {
    it('should not report unexpected files', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect({ reportUnexpected: false }, 'foo.txt');
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.write(createFile('bar.txt'));
      stream.end();
    }));
  });

  context('with { reportMissing: true }', function () {
    it('should report missing files', withCapture(function (done) {
      expectLog(/FAIL: Missing 1 expected files: bar\.txt/);
      var stream = expect({ reportMissing: true }, ['foo.txt', 'bar.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    }));
  });

  context('with { reportMissing: false }', function () {
    it('should not report missing files', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect({ reportMissing: false }, ['foo.txt', 'bar.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    }));
  });

  context('with { errorOnFailure: true }', function () {
    it('should emit error event if expectation failed', withCapture(function (done) {
      expectLog(/FAIL/);
      var stream = expect({ errorOnFailure: true }, { 'foo.txt': 'world' });
      testStream(stream, function (err) {
        err.message.should.equal('gulp-expect-file: Failed 1 expectations');
        done();
      });
      stream.write(createFile('foo.txt', 'Hello, earth!'));
      stream.end();
    }));
  });

  context('with { silent: true }', function () {
    it('should not write any logs', withCapture(function (done) {
      expectLog(/^$/);
      var stream = expect({ silent: true }, ['foo.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    }));
  });

  context('with { verbose: true }', function () {
    it('should also report passings', withCapture(function (done) {
      expectLog(/PASS: foo\.txt/);
      var stream = expect({ verbose: true }, ['foo.txt']);
      testStream(stream, done);
      stream.write(createFile('foo.txt'));
      stream.end();
    }));
  });

  describe('.real', function () {
    var tempFile;

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

    it('tests if the files exists on file system', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect.real([tempFile.relative]);
      testStream(stream, done);
      stream.write(tempFile);
      stream.end();
    }));

    it('should report if the file does not exists', withCapture(function (done) {
      expectLog(/FAIL: nonexists\.txt is not on filesystem/);
      var stream = expect.real(['nonexists.txt']);
      testStream(stream, done);
      stream.write(createFile('nonexists.txt'));
      stream.end();
    }));

    it('passes with no files', withCapture(function (done) {
      expectLog(/PASS/);
      var stream = expect.real([]);
      testStream(stream, done);
      stream.end();
    }));
  });

});
