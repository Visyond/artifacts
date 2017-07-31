// Generated by CoffeeScript 1.12.5
(function() {
  var Adapter, TypeScript, W,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Adapter = require('../../adapter_base');

  W = require('when');

  TypeScript = (function(superClass) {
    var compile;

    extend(TypeScript, superClass);

    function TypeScript() {
      return TypeScript.__super__.constructor.apply(this, arguments);
    }

    TypeScript.prototype.name = 'typescript';

    TypeScript.prototype.engineName = 'typescript-compiler';

    TypeScript.prototype.supportedEngines = ['typescript-compiler'];

    TypeScript.prototype.extensions = ['ts'];

    TypeScript.prototype.output = 'js';

    TypeScript.prototype.isolated = true;

    TypeScript.prototype._render = function(str, options) {
      var throwOnError;
      throwOnError = function(err) {
        throw err;
      };
      return compile((function(_this) {
        return function() {
          return _this.engine.compileString(str, void 0, options, throwOnError);
        };
      })(this));
    };

    compile = function(fn) {
      var err, res;
      try {
        res = fn();
      } catch (error) {
        err = error;
        return W.reject(err);
      }
      return W.resolve({
        result: res
      });
    };

    return TypeScript;

  })(Adapter);

  module.exports = TypeScript;

}).call(this);
