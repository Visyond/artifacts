// Generated by CoffeeScript 1.12.1
(function() {
  var W, fs, node;

  W = require('when');

  node = require('when/node');

  fs = require('fs');


  /**
   * Reads a source map's sources and inlines them in the `sourcesContents` key,
   * returning the full map.
   *
   * @param  {Object} map - source map v3
   * @return {Promise} a promise for the sourcemap updated with contents
   */

  exports.inline_sources = function(map) {
    if (map.sourcesContent) {
      return W.resolve(map);
    }
    return W.map(map.sources, function(source) {
      return node.call(fs.readFile.bind(fs), source, 'utf8');
    }).then(function(contents) {
      map.sourcesContent = contents;
      return map;
    })["catch"](function() {
      return map;
    });
  };

}).call(this);
