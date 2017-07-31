var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var lodash = require('lodash');

const PLUGIN_NAME = 'gulp-callback';

// options:
// - `once` (boolean) : invoke the `transformFunction` only once at the start.
//
// Note:
//
// The `callback` function passed to `transformFunction(chunk, encoding, callback)` as an argument
// extends the regular `through2` interface for this by offering a third argument `doNotCopy` (boolean)
// which the userland code may use to signal that the default `gulp-callback` action (copying the
// processed chunk verbatim) is to be skipped.
module.exports = function (transformFunction, flushFunction, options) {

    if (!transformFunction && !flushFunction) {
        throw new PluginError(PLUGIN_NAME, 'You have specified neither a valid transformFunction callback function nor a valid flushFunction callback function');
    }

    // `transformFunction` is optional
    if (transformFunction && typeof transformFunction !== 'function') {
        throw new PluginError(PLUGIN_NAME, 'transformFunction callback is not a function');
    }

    // `flushFunction` is optional
    if (flushFunction && typeof flushFunction !== 'function') {
        if (!options && typeof flushFunction === 'object') {
            options = flushFunction;
            flushFunction = null;
        } else if (options) {
            throw new PluginError(PLUGIN_NAME, 'flushFunction callback is not a function');
        }
    }

    // `options` is optional
    if (options && typeof options !== 'object') {
        throw new PluginError(PLUGIN_NAME, 'options is not an options object');
    }

    options = lodash.defaults(options || {}, {
        once: false
    });
    var fireOnce = false;
    var streamOptions = options.streamOptions = lodash.defaults(options.streamOptions || {}, {
        // See for what's inside here: https://github.com/rvagg/through2#api
        objectMode: true
    });

    return through(streamOptions, function (file, enc, callback) {
        var self = this;

        // Pass file through if:
        // - file has no contents
        // - file is a directory
        if (file.isNull() || file.isDirectory()) {
            this.push(file);
            return callback();
        }

        // We dont do streams (yet)
        if (file.isStream()) {
            return this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }

        // This extends the `callback` function interface compared to
        // https://github.com/rvagg/through2#transformfunction
        //
        // See also the note further above where this gulp plugin's options
        // are described.
        var transformСallback = function (error, newFile, append) {
            if (options.once) {
                fireOnce = true;
            }

            if (!error) {
                if (newFile) {
                    self.push(newFile);

                    if (append) {
                        self.push(file);
                    }

                    callback();
                } else {
                    callback(null, file);
                }
            } else {
                return self.emit('error', new PluginError(PLUGIN_NAME, error));
            }
        };

        if (!fireOnce && transformFunction) {
            transformFunction.call(this, file, enc, transformСallback, options);
        } else {
            callback(null, file);
        }
    }, function (callback) {
        if (flushFunction) {
            flushFunction.call(this, callback, options);
        } else {
            callback();
        }
    });
};

