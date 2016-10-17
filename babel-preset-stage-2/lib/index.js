"use strict";

exports.__esModule = true;

var _babelPresetStage = require("babel-preset-stage-3");

var _babelPresetStage2 = _interopRequireDefault(_babelPresetStage);

var _babelPluginTransformClassProperties = require("babel-plugin-transform-class-properties");

var _babelPluginTransformClassProperties2 = _interopRequireDefault(_babelPluginTransformClassProperties);

var _babelPluginTransformDecorators = require("babel-plugin-transform-decorators");

var _babelPluginTransformDecorators2 = _interopRequireDefault(_babelPluginTransformDecorators);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  presets: [_babelPresetStage2.default],
  plugins: [_babelPluginTransformClassProperties2.default, _babelPluginTransformDecorators2.default]
};
module.exports = exports["default"];