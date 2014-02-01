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

  context('with file names', function () {

    it('tests all files are expected', function (done) {
      gutil.log.capture(function (next) {
        var stream = expect(['foo.txt', 'bar.txt']);
        testStream(stream, function (error, files) {
          if (error) return next(error);
          files.should.have.length(2);
          next();
        });
        stream.write(createFile('foo.txt'));
        stream.write(createFile('bar.txt'));
        stream.end();
      }, done);
    });

    it('fails if some expected files are missing', function (done) {
      gutil.log.capture(function (next) {
        var stream = expect(['foo.txt', 'bar.txt']);
        testStream(stream, next);
        stream.write(createFile('foo.txt'));
        stream.end();
      }, done.expectFail('Missing 1 expected files: bar.txt'));
    });

    it('fails if not expected file is in the stream', function (done) {
      gutil.log.capture(function (next) {
        var stream = expect(['foo.txt']);
        testStream(stream, next);
        stream.write(createFile('foo.txt'));
        stream.write(createFile('bar.txt'));
        stream.end();
      }, done.expectFail(/bar\.txt unexpected/));
    });

  });

  context('with contents matcher', function () {

    it('tests file contents matches expectation', function (done) {
      gutil.log.capture(function (next) {
        var stream = expect({
          'foo.txt': 'world',
          'bar.txt': /^hello/i,
        });
        testStream(stream, next);
        stream.write(createFile('foo.txt', 'Hello, world!'));
        stream.write(createFile('bar.txt', 'Hello, earth!'));
        stream.end();
      }, done);
    });

    it('fails if file contents not matching expectation', function (done) {
      gutil.log.capture(function (next) {
        var stream = expect({ 'foo.txt': 'world' });
        testStream(stream, next);
        stream.write(createFile('foo.txt', 'Hello, earth!'));
        stream.end();
      }, done.expectFail(/foo\.txt not contain "world"/));
    });

  });

});
