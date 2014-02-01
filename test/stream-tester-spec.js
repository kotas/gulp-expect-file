var helper = require('./helper');
var StreamTester = require('../lib/stream-tester');
var PassThrough = require('stream').PassThrough;

describe('StreamTester', function () {

  context('with a string', function () {
    var tester, stream;

    beforeEach(function () {
      tester = new StreamTester('bar');
      stream = new PassThrough();
    });

    it('passes when a stream contains the string', function (done) {
      tester.test(stream, done);
      stream.write('foobarbaz');
      stream.end();
    });

    it('passes if the string is split into multiple chunks', function (done) {
      tester.test(stream, done);
      stream.write('fooba');
      stream.write('rbaz');
      stream.end();
    });

    it('fails if a stream not contains the string', function (done) {
      tester.test(stream, done.expectFail('not contain "bar"'));
      stream.write('babababa');
      stream.end();
    });
  });

});
