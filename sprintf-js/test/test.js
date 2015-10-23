var assert = require("assert"),
    sprintfjs = require("../src/sprintf.js"),
    sprintf = sprintfjs.sprintf,
    vsprintf = sprintfjs.vsprintf;

describe("sprintfjs", function() {
    var pi = 3.141592653589793;

    it("should return formated strings for simple placeholders", function() {
        assert.equal("%", sprintf("%%"));
        assert.equal("10", sprintf("%b", 2));
        assert.equal("A", sprintf("%c", 65));
        assert.equal("2", sprintf("%d", 2));
        assert.equal("2", sprintf("%i", 2));
        assert.equal("2", sprintf("%d", "2"));
        assert.equal("2", sprintf("%i", "2"));
        assert.equal('{"foo":"bar"}', sprintf("%j", {foo: "bar"}));
        assert.equal('["foo","bar"]', sprintf("%j", ["foo", "bar"]));
        assert.equal("2e+0", sprintf("%e", 2));
        assert.equal("2", sprintf("%u", 2));
        assert.equal("2", sprintf("%u", "2"));
        assert.equal("4294967294", sprintf("%u", -2));
        assert.equal("2.2", sprintf("%f", 2.2));
        assert.equal("3.141592653589793", sprintf("%g", pi));
        assert.equal("10", sprintf("%o", 8));
        assert.equal("%s", sprintf("%s", "%s"));
        assert.equal("ff", sprintf("%x", 255));
        assert.equal("FF", sprintf("%X", 255));
        assert.equal("Polly wants a cracker", sprintf("%2$s %3$s a %1$s", "cracker", "Polly", "wants"));
        assert.equal("Hello world!", sprintf("Hello %(who)s!", {"who": "world"}));
        assert.throws(function FUT_1() {
            sprintf("I don't have alphanumberic char after closing %(what)!", {"what": "brace"});
        }, SyntaxError);
    });

    it("should return formated strings for complex placeholders", function() {
        // sign
        assert.equal("2", sprintf("%d", 2));
        assert.equal("-2", sprintf("%d", -2));
        assert.equal("+2", sprintf("%+d", 2));
        assert.equal("-2", sprintf("%+d", -2));
        assert.equal("2", sprintf("%i", 2));
        assert.equal("-2", sprintf("%i", -2));
        assert.equal("+2", sprintf("%+i", 2));
        assert.equal("-2", sprintf("%+i", -2));
        assert.equal("2.2", sprintf("%f", 2.2));
        assert.equal("-2.2", sprintf("%f", -2.2));
        assert.equal("+2.2", sprintf("%+f", 2.2));
        assert.equal("-2.2", sprintf("%+f", -2.2));
        assert.equal("-2.3", sprintf("%+.1f", -2.34));
        assert.equal("-0.0", sprintf("%+.1f", -0.01));
        assert.equal("3.14159", sprintf("%.6g", pi));
        assert.equal("3.14", sprintf("%.3g", pi));
        assert.equal("3", sprintf("%.1g", pi));
        assert.equal("-000000123", sprintf("%+010d", -123));
        assert.equal("______-123", sprintf("%+'_10d", -123));
        assert.equal("-234.34 123.2", sprintf("%f %f", -234.34, 123.2));

        // padding
        assert.equal("-0002", sprintf("%05d", -2));
        assert.equal("-0002", sprintf("%05i", -2));
        assert.equal("12345", sprintf("%03d", 12345));
        assert.equal("12345", sprintf("%03i", 12345));
        assert.equal("12345", sprintf("%03u", 12345));
        assert.equal("    <", sprintf("%5s", "<"));
        assert.equal("0000<", sprintf("%05s", "<"));
        assert.equal("____<", sprintf("%'_5s", "<"));
        assert.equal(">    ", sprintf("%-5s", ">"));
        assert.equal(">0000", sprintf("%0-5s", ">"));
        assert.equal(">____", sprintf("%'_-5s", ">"));
        assert.equal("xxxxxx", sprintf("%5s", "xxxxxx"));
        assert.equal("1234", sprintf("%02u", 1234));
        assert.equal(" -10.235", sprintf("%8.3f", -10.23456));
        assert.equal("-12.34 xxx", sprintf("%f %s", -12.34, "xxx"));
        assert.equal('{\n  "foo": "bar"\n}', sprintf("%2j", {foo: "bar"}));
        assert.equal('[\n  "foo",\n  "bar"\n]', sprintf("%2j", ["foo", "bar"]));

        // precision
        assert.equal("2.3", sprintf("%.1f", 2.345));
        assert.equal("xxxxx", sprintf("%5.5s", "xxxxxx"));
        assert.equal("    x", sprintf("%5.1s", "xxxxxx"));
    });

    it("should return formatted strings for callbacks", function() {
        assert.equal("foobar", sprintf("%s", function() { return "foobar"; }));
        assert.equal(Date.now(), sprintf("%s", Date.now)); // should pass...
    });
});




/*
TODO:

integrate...





test('Basic Behaviors', function(){
	var s = sprintf, v = vsprintf;

	equal(s('%7.3f', 123.456), '123.456');
	equal(s('%7.3f', 12.46000), ' 12.460');
	equal(s('%7.3f', 3.4), '  3.400');

	var n =  43951789;
	var u = -43951789;
	var c = 65;
	var d = 123.45678901234567890123456789;

	equal(s('%b', n), '10100111101010011010101101', 'binary representation');
	equal(s('%c', c), 'A', 'print the ascii character');
	equal(s('%+d', n), '+43951789', 'standard integer representation');
	equal(s('%d', u), '-43951789', 'standard integer representation');
	equal(s('%.10e', d), '1.2345678901e+2', 'scientific notation')
	equal(s('%u', n), '43951789', 'unsigned integer representation of a positive integer');
	equal(s('%u', u), '4251015507', 'unsigned integer representation of a negative integer');
	equal(s('%-10.2f', d), '123.46    ', 'floating point representation1');
	equal(s('%+.4f', -123.456000), '-123.4560');
	equal(s('%010.10f', d), '123.4567890123', 'floating point representation2');
	equal(s('%o', n), '247523255', 'octal representation');
	equal(s('%100.10s', 'Ala-bala-portocala'), '                                                                                          Ala-bala-p', 'string representation');
	equal(s('%x', n), '29ea6ad', 'hexadecimal representation (lower-case)');
	equal(s('%X', n), '29EA6AD', 'hexadecimal representation (upper-case)');
});

test('Argument Swapping', function(){
	var s = sprintf, v = vsprintf;

	equal(s('Hello %1$s', 'Dolly'), 'Hello Dolly');
	equal(s('%4$s, %3$s, %1$s, %2$s', 'c', 'd', 'b', 'a'), 'a, b, c, d');
	equal(v('The first 4 letters of the english alphabet are: %4$s, %3$s, %1$s and %2$s', ['c', 'd', 'b', 'a']), 'The first 4 letters of the english alphabet are: a, b, c and d');
});

test('Replace String', function(){
	var s = sprintf, v = vsprintf;

	equal(s('foo%1dbar', 3), 'foo3bar');
	equal(s('foo%02dbar', 3), 'foo03bar');
	equal(s('foo%02dbar', 42), 'foo42bar');
	equal(s('foo%dbar', 123), 'foo123bar');

	equal(s('%2s', 'a').length, ' a'.length);
	equal(s('%2s', 'aa').length, 'aa'.length);
	equal(s('%4s', 'a').length, '   a'.length);

	equal(s('%2$s %3$s a %1$s', 'cracker', 'Polly', 'wants'), 'Polly wants a cracker');
});

test('Plus Zero', function(){
	var s = sprintf, v = vsprintf;

	equal(s('%+d', 0), '+0');
});

test('Padding Specifier', function(){
	var s = sprintf, v = vsprintf;

	equal(s('%07d', -314), '000-314');
	equal(s('%+\'_10d', -123), '______-123');
});


test('Named Arguments', function(){
	var s = sprintf, v = vsprintf;

	equal(s('Hello %(name_1)s, %(name_2)s and %(name_3)s', {name_1: "Molly", name_2: "Dolly", name_3: "Polly"}), 'Hello Molly, Dolly and Polly');

	var foo = {
		users: [
			{
				user: {
					name: [
						null,
						["Dolly"]
					]
				}
			}
		]
	};

	equal(s('Hello %(users[0].user.name[1][0])s', foo), 'Hello Dolly');
	equal(s('Hello %(users[0].user.name[0])s', foo), 'Hello null');

	var user = {
		name: 'Dolly'
	};
	equal(s('Hello %(name)s', user), 'Hello Dolly');
	
	var users = [
		{name: 'Dolly'},
		{name: 'Molly'},
		{name: 'Polly'}
	];
	equal(s('Hello %(users[0].name)s, %(users[1].name)s and %(users[2].name)s', {users: users}), 'Hello Dolly, Molly and Polly');
});

*/

