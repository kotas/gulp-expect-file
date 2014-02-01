var helper = require('./helper');
var StringTester = require('../lib/string-tester');

describe('StringTester', function () {

  context('with a string', function () {
    var tester = new StringTester('foo');

    it('should pass if containing the string as substring', function (done) {
      tester.test('foobarbaz', done);
    });

    it('should fail if not containing the string', function (done) {
      tester.test('fofofofo', done.expectFail('not contain "foo"'));
    });
  });

  context('with a RegExp pattern', function () {
    var tester = new StringTester(/^foo/);

    it('should pass if matching the pattern', function (done) {
      tester.test('foobarbaz', done);
    });

    it('should fail if not matching the pattern', function (done) {
      tester.test('bazbarfoo', done.expectFail('not match against /^foo/'));
    });
  });

  context('with a synchronous function', function () {
    var tester = new StringTester(function isFoo(s) { return s === 'foo'; });

    it('should pass if the function returns true', function (done) {
      tester.test('foo', done);
    });

    it('should fail if function returns false', function (done) {
      tester.test('foobar', done.expectFail('failed assertion on isFoo'));
    });
  });

  context('with an asynchronous function', function () {
    var tester = new StringTester(function checkFoo(s, callback) {
      if (s === 'foo') {
        callback();
      } else {
        callback(new Error('not foo'));
      }
    });

    it('should pass if the function called back without errors', function (done) {
      tester.test('foo', done);
    });

    it('should fail if the function called back with errors', function (done) {
      tester.test('foobar', done.expectFail('not foo'));
    });
  });

  context('with an array of strings', function () {
    var tester = new StringTester(['foo', 'baz']);

    it('should pass if containing all of them as substring', function (done) {
      tester.test('foobarbaz', done);
    });

    it('should fail if not containing some of them', function (done) {
      tester.test('foobar', done.expectFail('not contain "baz"'));
    });
  });

  context('with an array of RegExp patterns', function () {
    var tester = new StringTester([/^foo/, /baz$/]);

    it('should pass if matching all of them', function (done) {
      tester.test('foobarbaz', done);
    });

    it('should fail if not matching some of them', function (done) {
      tester.test('foobazbar', done.expectFail('not match against /baz$/'));
    });
  });

});
