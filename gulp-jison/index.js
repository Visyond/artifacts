var through = require('through2');
var gutil = require('gulp-util');
var objectAssign = require('object-assign');
var PluginError = gutil.PluginError;
var rawJison = require('jison-gho');
var Generator = rawJison.Generator;

var ebnfParser = require('ebnf-parser');
var lexParser  = require('lex-parser');
var fs = require('fs');

const PLUGIN_NAME = 'gulp-jison';

var assert = require('assert');

assert(rawJison);
assert(rawJison.defaultJisonOptions);
assert(Generator);

module.exports = function gulp_jison(options) {
    options = options || {};

    // always produce a working function
    function mkF(f, default_f) {
        if (typeof f !== 'function') {
            return default_f;
        }
        return f;
    }

    return through.obj(function (file, enc, callback) {
        if (file.isNull()) {
            callback(null, file);
            return;
        }

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported'));
            callback();
            return;
        }

        if (file.isBuffer()) {
            var fileOpts = objectAssign({}, rawJison.defaultJisonOptions, options);
            
            // special callbacks:
            var preprocessor = mkF(fileOpts.preprocessor, function (file, content, options) {
                return content;
            });
            var postprocessor = mkF(fileOpts.postprocessor, function (file, content, options) {
                return content;
            });
            var customizer = mkF(fileOpts.customizer, function (file, options) {
                // console.log("jison file: ", file, options);
            });
            
            // do not pollute the Jison environment with our own options:
            delete fileOpts.preprocessor;
            delete fileOpts.postprocessor;
            delete fileOpts.customizer;

            try {
                customizer(file, fileOpts);
                var source_contents = file.contents.toString();
                source_contents = preprocessor(file, source_contents, fileOpts);

                try {
                    // Will throw an error if the input is not JSON.
                    var json_input = JSON.parse(source_contents);

                    source_contents = json_input;
                } catch (err) {
                    // JSON parsing failed, must be a Jison grammar.
                }

                var lex_source_contents = null;
                if (options.lexfile) {
                    var lexfile = fs.readFileSync(options.lexfile, 'utf-8');

                    try {
                        // Will throw an error if the input is not JSON.
                        var json_input = JSON.parse(source_contents);

                        lex_source_contents = json_input;
                    } catch (err) {
                        // JSON parsing failed, must be a Jison lexer spec.
                    }
                    lex_source_contents = lexfile;
                }

                var gen = Generator(source_contents, lex_source_contents, fileOpts);
                var dest_contents = gen.generate();

                dest_contents = postprocessor(file, dest_contents, fileOpts);
                file.contents = new Buffer(dest_contents);
                
                file.path = gutil.replaceExtension(file.path, ".js");
                this.push(file);
            } catch (error) {
                // Tweak the exception message to include the jison source file/path:
                // make it clear which of possibly many jison input files caused the exception.
                error.message += '\n        (in source file: "' + file.relative + '")';

                this.emit('error', new PluginError(PLUGIN_NAME, error));
            }
            callback();
        }
    });
};
