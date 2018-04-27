// Generated by CoffeeScript 1.7.0
(function() {
  var Adapter, Mustache, W, fs, path, util,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Adapter = require('../adapter_base');

  W = require('when');

  util = require('util');

  fs = require('fs');

  path = require('path');

  Mustache = (function(_super) {
    var compile;

    __extends(Mustache, _super);

    function Mustache() {
      return Mustache.__super__.constructor.apply(this, arguments);
    }

    Mustache.prototype.name = 'mustache';

    Mustache.prototype.extensions = ['mustache', 'hogan'];

    Mustache.prototype.output = 'html';

    Mustache.prototype.supportedEngines = ['hogan.js'];

    Mustache.prototype._render = function(str, options) {
      return compile((function(_this) {
        return function() {
          return _this.engine.compile(str, options).render(options, options.partials);
        };
      })(this));
    };

    Mustache.prototype._compile = function(str, options) {
      return compile((function(_this) {
        return function() {
          return _this.engine.compile(str, options);
        };
      })(this));
    };

    Mustache.prototype._compileClient = function(str, options) {
      options.asString = true;
      return this._compile(str, options).then(function(o) {
        return {
          result: "new Hogan.Template(" + (o.result.toString()) + ");"
        };
      });
    };

    Mustache.prototype.clientHelpers = function() {
      var runtime_path, version;
      version = require(path.join(this.engine.__accord_path, 'package')).version;
      runtime_path = path.join(this.engine.__accord_path, "web/builds/" + version + "/hogan-" + version + ".min.js");
      return fs.readFileSync(runtime_path, 'utf8');
    };

    compile = function(fn) {
      var err, res;
      try {
        res = fn();
      } catch (_error) {
        err = _error;
        return W.reject(err);
      }
      return W.resolve({
        result: res
      });
    };

    return Mustache;

  })(Adapter);

  module.exports = Mustache;

}).call(this);
