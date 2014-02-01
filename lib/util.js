'use strict';

module.exports.wrapAssertion = function (func, errorMessage) {
  if (func.length >= 2) {
    return func;
  }

  if (!errorMessage) {
    errorMessage = 'failed assertion' + (func.name ? ' on ' + func.name : '');
  }
  return function (target, callback) {
    try {
      var result = func(target);
    } catch (e) {
      callback(e);
      return;
    }

    if (result === false || result instanceof Error) {
      callback(result || new Error(errorMessage));
    } else {
      callback(null);
    }
  };
};
