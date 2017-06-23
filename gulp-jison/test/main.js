var should = require('should');
var rawJison = require('jison-gho');
var Generator = rawJison.Generator;
var gulpJison = require('../');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var lexParser = require('lex-parser');
var ebnfParser = require('ebnf-parser');

require('mocha');
var assert = require('assert');



var createVirtualFile = function (filename, contents) {
    return new gutil.File({
        path: path.join(__dirname, 'fixtures', filename),
        base: path.join(__dirname, 'fixtures'),
        cwd: process.cwd(),
        contents: new Buffer(contents)
    });
};

describe('gulp-jison', function() {
    it('should output the same parser as jison', function (done) {
        var filepath = 'test/fixtures/calculator.jison';
        var text = fs.readFileSync(filepath, 'utf-8');
        var expected = rawJison.Generator(text.toString()).generate();

        gulpJison()
            .on('error', done)
            .on('data', function(data) {
                data.contents.toString().should.equal(expected);
                done();
            })
            .write(createVirtualFile('calculator.jison', text));
    });

    it('should work with options', function (done) {
        var options = {
            type: 'slr',
            moduleType: 'amd',
            moduleName: 'jsoncheck',
            lexfile: 'test/fixtures/calculator.jisonlex'
        };

        var filepath = 'test/fixtures/calculator.jison';
        var grammarText = fs.readFileSync(filepath, 'utf-8');
        assert(grammarText, 'jison file should load');

        var grammar = ebnfParser.parse(grammarText);
        assert(grammar, 'jison grammar should compile');
        if (options.lexfile) {
            var lexerText = fs.readFileSync(options.lexfile, 'utf-8');
            assert(lexerText, 'jison lexer spec should load');
            grammar.lex = lexParser.parse(lexerText);
            assert(grammar.lex, 'jison lexer spec should compile');
        } else {
            var lexerText = null;
        }
        var expected = rawJison.Parser(grammarText, lexerText, options).generate();

        gulpJison(options)
            .on('error', done)
            .on('data', function(data) {
                data.contents.toString().should.equal(expected);
                done();
            })
            .write(createVirtualFile('calculator.jison', new Buffer(grammarText)));
    });

    it('should work with json', function (done) {
        var options = {type: 'slr', moduleType: 'amd', moduleName: 'jsoncheck'};

        var filepath = 'test/fixtures/calculator.jison';
        var text = fs.readFileSync(filepath);
        var expected = rawJison.Generator(text.toString(), options).generate();

        // Generate JSON grammar from Jison grammar.
        var json = JSON.stringify(ebnfParser.parse(text.toString()));

        gulpJison(options)
            .on('error', done)
            .on('data', function(data) {
                data.contents.toString().should.equal(expected);
                done();
            })
            .write(createVirtualFile('calculator.json', new Buffer(json)));
    });
});
