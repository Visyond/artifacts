[XRegExp](http://xregexp.com/) 3.1.2-8
======================================

XRegExp provides augmented (and extensible) JavaScript regular expressions. You get new modern syntax and flags beyond what browsers support natively. XRegExp is also a regex utility belt with tools to make your client-side grepping and parsing easier, while freeing you from worrying about pesky aspects of JavaScript regexes like cross-browser inconsistencies or manually manipulating `lastIndex`.

XRegExp supports all native ES6 regular expression syntax. It supports Internet Explorer 5.5+, Firefox 1.5+, Chrome, Safari 3+, and Opera 11+. You can also use it with Node.js or as a RequireJS module.

## Performance

XRegExp regexes compile to native `RegExp` objects, and therefore perform just as fast as native regular expressions. There is a tiny extra cost when compiling a pattern for the first time.

## Usage examples

```js
// Using named capture and flag x (free-spacing and line comments)
var date = XRegExp('(?<year>  [0-9]{4} ) -?  # year  \n\
                    (?<month> [0-9]{2} ) -?  # month \n\
                    (?<day>   [0-9]{2} )     # day     'x');

// XRegExp.exec gives you named backreferences on the match result
var match = XRegExp.exec('2015-02-22  date);
match.year; // -> '2015'

// It also includes optional pos and sticky arguments
var pos = 3;
var result = [];
while (match = XRegExp.exec('<1><2><3><4>5<6>  /<(\d+)>/, pos, 'sticky')) {
    result.push(match[1]);
    pos = match.index + match[0].length;
}
// result -> ['2  '3  '4']

// XRegExp.replace allows named backreferences in replacements
XRegExp.replace('2015-02-22  date, '${month}/${day}/${year}');
// -> '02/22/2015'
XRegExp.replace('2015-02-22  date, function(match) {
    return match.month + '/' + match.day + '/' + match.year;
});
// -> '02/22/2015'

// In fact, XRegExps compile to RegExps and work perfectly with native methods
date.test('2015-02-22');
// -> true

// The only caveat is that named captures must be referenced using numbered
// backreferences if used with native methods
'2015-02-22'.replace(date, '$2/$3/$1');
// -> '02/22/2015'

// Extract every other digit from a string using XRegExp.forEach
var evens = [];
XRegExp.forEach('1a2345  /\d/, function(match, i) {
    if (i % 2) evens.push(+match[0]);
});
// evens -> [2, 4]

// Get numbers within <b> tags using XRegExp.matchChain
XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>  [
    XRegExp('(?is)<b>.*?</b>'),
    /\d+/
]);
// -> ['2  '4  '56']

// You can also pass forward and return specific backreferences
var html = '<a href="http://xregexp.com/">XRegExp</a>' +
           '<a href="http://www.google.com/">Google</a>';
XRegExp.matchChain(html, [
    {regex: /<a href="([^"]+)">/i, backref: 1},
    {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
]);
// -> ['xregexp.com  'www.google.com']

// Merge strings and regexes into a single pattern with updated backreferences
XRegExp.union(['a+b*c  /(dog)\1/, /(cat)\1/], 'i');
// -> /a\+b\*c|(dog)\1|(cat)\2/i
```

These examples give the flavor of what's possible, but XRegExp has more syntax, flags, methods, options, and browser fixes that aren't shown here. You can even augment XRegExp's regular expression syntax with addons (see below) or write your own. See [xregexp.com](http://xregexp.com/) for details.

## Addons

You can either load addons individually, or bundle all addons with XRegExp by loading `xregexp-all.js`.

### Unicode

If not using `xregexp-all.js`, first include the Unicode Base script and then one or more of the addons for Unicode blocks, categories, properties, or scripts.

Then you can do this:

```js
// Test the Unicode category L (Letter)
var unicodeWord = XRegExp('^\\pL+$');
unicodeWord.test('Русский'); // -> true
unicodeWord.test('日本語'); // -> true
unicodeWord.test('العربية'); // -> true

// Test some Unicode scripts
XRegExp('^\\p{Hiragana}+$').test('ひらがな'); // -> true
XRegExp('^[\\p{Latin}\\p{Common}]+$').test('Über Café.'); // -> true
```

By default, `\p{…}` and `\P{…}` support the Basic Multilingual Plane (i.e. code points up to `U+FFFF`). You can opt-in to full 21-bit Unicode support (with code points up to `U+10FFFF`) on a per-regex basis by using flag `A`. In XRegExp, this is called *astral mode*. You can automatically add flag `A` for all new regexes by running `XRegExp.install('astral')`. When in astral mode, `\p{…}` and `\P{…}` always match a full code point rather than a code unit, using surrogate pairs for code points above `U+FFFF`.

```js
// Using flag A to match astral code points
XRegExp('^\\pS$').test('💩'); // -> false
XRegExp('^\\pS$  'A').test('💩'); // -> true
XRegExp('(?A)^\\pS$').test('💩'); // -> true
// Using surrogate pair U+D83D U+DCA9 to represent U+1F4A9 (pile of poo)
XRegExp('(?A)^\\pS$').test('\uD83D\uDCA9'); // -> true

// Implicit flag A
XRegExp.install('astral');
XRegExp('^\\pS$').test('💩'); // -> true
```

Opting in to astral mode disables the use of `\p{…}` and `\P{…}` within character classes. In astral mode, use e.g. `(\pL|[0-9_])+` instead of `[\pL0-9_]+`.

XRegExp uses Unicode 8.0.0.

### XRegExp.build

Build regular expressions using named subpatterns, for readability and pattern reuse:

```js
var time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $  {
    hours: XRegExp.build('{{h12}} : | {{h24}}  {
        h12: /1[0-2]|0?[1-9]/,
        h24: /2[0-3]|[01][0-9]/
    }),
    minutes: /^[0-5][0-9]$/
});

time.test('10:59'); // -> true
XRegExp.exec('10:59  time).minutes; // -> '59'
```

Named subpatterns can be provided as strings or regex objects. A leading `^` and trailing unescaped `$` are stripped from subpatterns if both are present, which allows embedding independently-useful anchored patterns. `{{…}}` tokens can be quantified as a single unit. Any backreferences in the outer pattern or provided subpatterns are automatically renumbered to work correctly within the larger combined pattern. The syntax `({{name}})` works as shorthand for named capture via `(?<name>{{name}})`. Named subpatterns cannot be embedded within character classes.

See also: *[Creating Grammatical Regexes Using XRegExp.build](http://blog.stevenlevithan.com/archives/grammatical-patterns-xregexp-build)*.

### XRegExp.matchRecursive

Match recursive constructs using XRegExp pattern strings as left and right delimiters:

```js
var str = '(t((e))s)t()(ing)';
XRegExp.matchRecursive(str, '\\(  '\\)  'g');
// -> ['t((e))s  '  'ing']

// Extended information mode with valueNames
str = 'Here is <div> <div>an</div></div> example';
XRegExp.matchRecursive(str, '<div\\s*>  '</div>  'gi  {
    valueNames: ['between  'left  'match  'right']
});
 -> [
{- between  value: 'Here is         start: 0,  end: 8},
{- left     value: '<div>           start: 8,  end: 13},
{- match    value: ' <div>an</div>  start: 13, end: 27},
{- right    value: '</div>          start: 27, end: 33},
{- between  value: ' example        start: 33, end: 41}
] */

// Omitting unneeded parts with null valueNames, and using escapeChar
str = '...{1}.\\{{function(x,y){return {y:x}}}';
XRegExp.matchRecursive(str, '{  '}  'g  {
    valueNames: ['literal  null, 'value  null],
    escapeChar: '\\'
});
 -> [
{- literal  value: '...   start: 0, end: 3},
{- value    value: '1     start: 4, end: 5},
{- literal  value: '.\\{  start: 6, end: 9},
{- value    value: 'function(x,y){return {y:x}}  start: 10, end: 37}
] */

// Sticky mode via flag y
str = '<1><<<2>>><3>4<5>';
XRegExp.matchRecursive(str, '<  '>  'gy');
// -> ['1  '<<2>>  '3']
```

`XRegExp.matchRecursive` throws an error if it scans past an unbalanced delimiter in the target string.

## Installation and usage

In browsers (bundle XRegExp with all of its addons):

```html
<script src="xregexp-all.js"></script>
```

Using [npm](https://www.npmjs.com/):

```bash
npm install xregexp
```

In [Node.js](http://nodejs.org/):

```js
var XRegExp = require('xregexp');
```

In an AMD loader like [RequireJS](http://requirejs.org/):

```js
require({paths: {xregexp: 'xregexp-all'}}, ['xregexp'], function(XRegExp) {
    console.log(XRegExp.version);
});
```

## About

XRegExp copyright 2007-2016 by [Steven Levithan](http://stevenlevithan.com/).

Unicode range generators by [Mathias Bynens](http://mathiasbynens.be/), and adapted from his [unicode-data](https://github.com/mathiasbynens/unicode-data) project. Uses [Jasmine](http://jasmine.github.io/) for unit tests, and [Benchmark.js](http://benchmarkjs.com) for performance tests. `XRegExp.build` inspired by [RegExp.create](http://lea.verou.me/2011/03/create-complex-regexps-more-easily/) by [Lea Verou](http://lea.verou.me/). `XRegExp.union` inspired by [Ruby](http://www.ruby-lang.org/). XRegExp's syntax extensions and flags come from [Perl](http://www.perl.org/), [.NET](http://www.microsoft.com/net), etc.

All code, including addons, tools, and tests, is released under the terms of the [MIT License](http://mit-license.org/).

Fork me to show support, fix, and extend.




# APIs

## Private stuff



// Check for ES6 `u` flag support
var hasNativeU = hasNativeFlag('u');
// Check for ES6 `y` flag support
var hasNativeY = hasNativeFlag('y');
// Tracker for known flags, including addon flags
var registeredFlags = {
    g: true,
    i: true,
    m: true,
    u: hasNativeU,
    y: hasNativeY
};










Enables or disables native method overrides.
 *
@private
@param {Boolean} on `true` to enable; `false` to disable.

function setNatives(on) {
    RegExp.prototype.exec = (on ? fixed : nativ).exec;
    RegExp.prototype.test = (on ? fixed : nativ).test;
    String.prototype.match = (on ? fixed : nativ).match;
    String.prototype.replace = (on ? fixed : nativ).replace;
    String.prototype.split = (on ? fixed : nativ).split;





## XRegExp(pattern, flags) constructor

Creates an extended regular expression object for matching text with a pattern. Differs from a
native regular expression in that additional syntax and flags are supported. The returned object
is in fact a native `RegExp` and works with all native methods.

`pattern`
: {String|RegExp} Regex pattern string, or an existing regex object to copy.

`flags`
: {String} (optional) Any combination of flags.

  Native flags:

    <li>`g` - global
    <li>`i` - ignore case
    <li>`m` - multiline anchors
    <li>`u` - unicode (ES6)
    <li>`y` - sticky (Firefox 3+, ES6)

  Additional XRegExp flags:

    <li>`n` - explicit capture
    <li>`s` - dot matches all (aka singleline)
    <li>`x` - free-spacing and line comments (aka extended)
    <li>`A` - astral (requires the Unicode Base addon)

  Flags cannot be provided when constructing one `RegExp` from another.

Returns {RegExp} Extended regular expression object.

> `RegExp` is part of the XRegExp prototype chain (`XRegExp.prototype = new RegExp()`).

### Example

```
// With named capture and flag x
XRegExp('(?<year>  [0-9]{4} ) -?  # year  \n\
         (?<month> [0-9]{2} ) -?  # month \n\
         (?<day>   [0-9]{2} )     # day     'x');

// Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
// syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
// have fresh `lastIndex` properties (set to zero).
XRegExp(/regex/);
```



## XRegExp.version

The XRegExp version number as a string containing three dot-separated parts. For example,
'2.0.0-beta-3'.



## XRegExp: Public methods


### XRegExp._hasNativeFlag(flag)

> Intentionally undocumented; used in tests and addons

Check if the regex flag is supported natively in your environment.

Returns {Boolean}.

> Developer Note:
>
> Can't check based on the presence of properties/getters since browsers might support such
> properties even when they don't support the corresponding flag in regex construction (tested
> in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
> throws an error)


### XRegExp._dec(hex)

> Intentionally undocumented; used in tests and addons

Converts hexadecimal to decimal.

`hex`
: {String}

Returns {Number}



### XRegExp._hex(dec)

> Intentionally undocumented; used in tests and addons

Converts decimal to hexadecimal.

`dec`
: {Number|String}

Returns {String}



### XRegExp._pad4(str)

> Intentionally undocumented; used in tests and addons

Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.

`str`
: {String}

Returns {String}








## XRegExp.addToken(regex, handler, options)

Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
create XRegExp addons. If more than one token can match the same string, the last added wins.

`regex`
: {RegExp} Regex object that matches the new token.

`handler`
: {Function} Function that returns a new pattern string (using native regex syntax)
  to replace the matched token within all future XRegExp regexes. Has access to persistent
  properties of the regex being built, through `this`. Invoked with three arguments:

  <li>The match array, with named backreference properties.
  <li>The regex scope where the match was found: 'default' or 'class'.
  <li>The flags used by the regex, including any flags in a leading mode modifier.

  The handler function becomes part of the XRegExp construction process, so be careful not to
  construct XRegExps within the function or you will trigger infinite recursion.

`options`
: {Object} (optional) Options object with optional properties:

  <li>`scope` {String} Scope where the token applies: 'default  'class  or 'all'.
  <li>`flag` {String} Single-character flag that triggers the token. This also registers the
    flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
  <li>`optionalFlags` {String} Any custom flags checked for within the token `handler` that are
    not required to trigger the token. This registers the flags, to prevent XRegExp from
    throwing an 'unknown flag' error when any of the flags are used.
  <li>`reparse` {Boolean} Whether the `handler` function's output should not be treated as
    final, and instead be reparseable by other tokens (including the current token). Allows
    token chaining or deferring.
  <li>`leadChar` {String} Single character that occurs at the beginning of any successful match
    of the token (not always applicable). This doesn't change the behavior of the token unless
    you provide an erroneous value. However, providing it can increase the token's performance
    since the token can be skipped at any positions where this character doesn't appear.

### Examples

```
// Basic usage: Add \a for the ALERT control code
XRegExp.addToken(
  /\\a/,
  function() {return '\\x07';},
  {scope: 'all'}
);
XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true

// Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
// Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
// character classes only)
XRegExp.addToken(
  /([?*+]|{\d+(?:,\d*)?})(\??)/,
  function(match) {return match[1] + (match[2] ? '' : '?');},
  {flag: 'U'}
);
XRegExp('a+  'U').exec('aaa')[0]; // -> 'a'
XRegExp('a+?  'U').exec('aaa')[0]; // -> 'aaa'
```




## XRegExp.cache(pattern, flags)

Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
the same pattern and flag combination, the cached copy of the regex is returned.

`pattern`
: {String} Regex pattern string.

`flags`
: {String} (optional) Any combination of XRegExp flags.

Returns {RegExp} Cached XRegExp object.

### Example

```
while (match = XRegExp.cache('.  'gs').exec(str)) {
  // The regex is compiled once only
}
```



## XRegExp.cache.flush(cacheName)

> Intentionally undocumented; used in tests



## XRegExp.escape(str)

Escapes any regular expression metacharacters, for use when matching literal strings. The result
can safely be used at any point within a regex that uses any flags.

`str`
: {String} String to escape.

Returns {String} String with regex metacharacters escaped.

### Example

```
XRegExp.escape('Escaped? <.>');
// -> 'Escaped\?\ <\.>'
```




## XRegExp.exec = function(str, regex, pos, sticky) {

Executes a regex search in a specified string. Returns a match array or `null`. If the provided
regex uses named capture, named backreference properties are included on the match array.
Optional `pos` and `sticky` arguments specify the search start position, and whether the match
must start at the specified position only. The `lastIndex` property of the provided regex is not
used, but is updated for compatibility. Also fixes browser bugs compared to the native
`RegExp.prototype.exec` and can be used reliably cross-browser.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {RegExp} regex Regex to search with.
@param {Number} [pos=0] Zero-based index at which to start the search.
@param {Boolean|String} [sticky=false] Whether the match must start at the specified position
  only. The string `'sticky'` is accepted as an alternative to `true`.
@returns {Array} Match array with named backreference properties, or `null`.
@example
 *
// Basic use, with named backreference
var match = XRegExp.exec('U+2620  XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
match.hex; // -> '2620'
 *
// With pos and sticky, in a loop
var pos = 2, result = [], match;
while (match = XRegExp.exec('<1><2><3><4>5<6>  /<(\d)>/, pos, 'sticky')) {
  result.push(match[1]);
  pos = match.index + match[0].length;
}
// result -> ['2  '3  '4']

XRegExp.exec = function(str, regex, pos, sticky) {



## XRegExp.forEach = function(str, regex, callback) {

Executes a provided function once per regex match. Searches always start at the beginning of the
string and continue until the end, regardless of the state of the regex's `global` property and
initial `lastIndex`.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {RegExp} regex Regex to search with.
@param {Function} callback Function to execute for each match. Invoked with four arguments:
  <li>The match array, with named backreference properties.
  <li>The zero-based match index.
  <li>The string being traversed.
  <li>The regex object being used to traverse the string.
@example
 *
// Extracts every other digit from a string
var evens = [];
XRegExp.forEach('1a2345  /\d/, function(match, i) {
  if (i % 2) evens.push(+match[0]);
});
// evens -> [2, 4]

XRegExp.forEach = function(str, regex, callback) {



## XRegExp.globalize = function(regex) {

Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
`XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
regexes are not recompiled using XRegExp syntax.
 *
@memberOf XRegExp
@param {RegExp} regex Regex to globalize.
@returns {RegExp} Copy of the provided regex with flag `g` added.
@example
 *
var globalCopy = XRegExp.globalize(/regex/);
globalCopy.global; // -> true

XRegExp.globalize = function(regex) {



## XRegExp.install = function(options) {

Installs optional features according to the specified options. Can be undone using
`XRegExp.uninstall`.

`options`
: {Object|String} Options object or string.

### feature: astral

Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
the Unicode Base addon is not available, since flag A is registered by that addon.

`astral`
: {Boolean} `true` to enable; `false` to disable.

### feature: natives

Native methods to use and restore ('native' is an ES3 reserved keyword).

These native methods are overridden:

- exec: RegExp.prototype.exec,
- test: RegExp.prototype.test,
- match: String.prototype.match,
- replace: String.prototype.replace,
- split: String.prototype.split

### Examples

```js
// With an options object
XRegExp.install({
  // Enables support for astral code points in Unicode addons (implicitly sets flag A)
  astral: true,

  // DEPRECATED: Overrides native regex methods with fixed/extended versions
  natives: true
});

// With an options string
XRegExp.install('astral natives');
```







## XRegExp.isInstalled = function(feature) {

Checks whether an individual optional feature is installed.

@param {String} feature Name of the feature to check. One of:
  <li>`astral`
  <li>`natives`
@returns {Boolean} Whether the feature is installed.
@example
 *
XRegExp.isInstalled('astral');

XRegExp.isInstalled = function(feature) {



## XRegExp.isRegExp = function(value) {

Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
created in another frame, when `instanceof` and `constructor` checks would fail.
 *
@memberOf XRegExp
@param {*} value Object to check.
@returns {Boolean} Whether the object is a `RegExp` object.
@example
 *
XRegExp.isRegExp('string'); // -> false
XRegExp.isRegExp(/regex/i); // -> true
XRegExp.isRegExp(RegExp('^  'm')); // -> true
XRegExp.isRegExp(XRegExp('(?s).')); // -> true

XRegExp.isRegExp = function(value) {



## XRegExp.match = function(str, regex, scope) {

Returns the first matched string, or in global mode, an array containing all matched strings.
This is essentially a more convenient re-implementation of `String.prototype.match` that gives
the result types you actually want (string instead of `exec`-style array in match-first mode,
and an empty array instead of `null` when no matches are found in match-all mode). It also lets
you override flag g and ignore `lastIndex`, and fixes browser bugs.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {RegExp} regex Regex to search with.
@param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
  return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
  `scope` is 'all'.
@returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
  mode: Array of all matched strings, or an empty array.
@example
 *
// Match first
XRegExp.match('abc  /\w/); // -> 'a'
XRegExp.match('abc  /\w/g, 'one'); // -> 'a'
XRegExp.match('abc  /x/g, 'one'); // -> null
 *
// Match all
XRegExp.match('abc  /\w/g); // -> ['a  'b  'c']
XRegExp.match('abc  /\w/, 'all'); // -> ['a  'b  'c']
XRegExp.match('abc  /x/, 'all'); // -> []

XRegExp.match = function(str, regex, scope) {



## XRegExp.matchChain = function(str, chain) {

Retrieves the matches from searching a string using a chain of regexes that successively search
within previous matches. The provided `chain` array can contain regexes and or objects with
`regex` and `backref` properties. When a backreference is specified, the named or numbered
backreference is passed forward to the next regex or returned.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {Array} chain Regexes that each search for matches within preceding results.
@returns {Array} Matches by the last regex in the chain, or an empty array.
@example
 *
// Basic usage; matches numbers within <b> tags
XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>  [
  XRegExp('(?is)<b>.*?</b>'),
  /\d+/
]);
// -> ['2  '4  '56']
 *
// Passing forward and returning specific backreferences
html = '<a href="http://xregexp.com/api/">XRegExp</a>\
        <a href="http://www.google.com/">Google</a>';
XRegExp.matchChain(html, [
  {regex: /<a href="([^"]+)">/i, backref: 1},
  {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
]);
// -> ['xregexp.com  'www.google.com']

XRegExp.matchChain = function(str, chain) {



## XRegExp.replace = function(str, search, replacement, scope) {

Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
or regex, and the replacement can be a string or a function to be called for each match. To
perform a global search and replace, use the optional `scope` argument or include flag g if using
a regex. Replacement strings can use `${n}` for named and numbered backreferences. Replacement
functions can use named backreferences via `arguments[0].name`. Also fixes browser bugs compared
to the native `String.prototype.replace` and can be used reliably cross-browser.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {RegExp|String} search Search pattern to be replaced.
@param {String|Function} replacement Replacement string or a function invoked to create it.
  Replacement strings can include special replacement syntax:
    <li>$$ - Inserts a literal $ character.
    <li>$&, $0 - Inserts the matched substring.
    <li>$` - Inserts the string that precedes the matched substring (left context).
    <li>$' - Inserts the string that follows the matched substring (right context).
    <li>$n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
      backreference n/nn.
    <li>${n} - Where n is a name or any number of digits that reference an existent capturing
      group, inserts backreference n.
  Replacement functions are invoked with three or more arguments:
    <li>The matched substring (corresponds to $& above). Named backreferences are accessible as
      properties of this first argument.
    <li>0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
    <li>The zero-based index of the match within the total search string.
    <li>The total string being searched.
@param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
  explicitly specified and using a regex with flag g, `scope` is 'all'.
@returns {String} New string with one or all matches replaced.
@example
 *
// Regex search, using named backreferences in replacement string
var name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
XRegExp.replace('John Smith  name, '${last}, ${first}');
// -> 'Smith, John'
 *
// Regex search, using named backreferences in replacement function
XRegExp.replace('John Smith  name, function(match) {
  return match.last +   ' + match.first;
});
// -> 'Smith, John'
 *
// String search, with replace-all
XRegExp.replace('RegExp builds RegExps  'RegExp  'XRegExp  'all');
// -> 'XRegExp builds XRegExps'

XRegExp.replace = function(str, search, replacement, scope) {



## XRegExp.replaceEach = function(str, replacements) {

Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
array of replacement details. Later replacements operate on the output of earlier replacements.
Replacement details are accepted as an array with a regex or string to search for, the
replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
replacement text syntax, which supports named backreference properties via `${name}`.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {Array} replacements Array of replacement detail arrays.
@returns {String} New string with all replacements.
@example
 *
str = XRegExp.replaceEach(str, [
  [XRegExp('(?<name>a)'), 'z${name}'],
  [/b/gi, 'y'],
  [/c/g, 'x  'one'], // scope 'one' overrides /g
  [/d/, 'w  'all'],  // scope 'all' overrides lack of /g
  ['e  'v  'all'],  // scope 'all' allows replace-all for strings
  [/f/g, function($0) {
    return $0.toUpperCase();
  }]
]);

XRegExp.replaceEach = function(str, replacements) {



## XRegExp.split = function(str, separator, limit) {

Splits a string into an array of strings using a regex or string separator. Matches of the
separator are not included in the result array. However, if `separator` is a regex that contains
capturing groups, backreferences are spliced into the result each time `separator` is matched.
Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
cross-browser.
 *
@memberOf XRegExp
@param {String} str String to split.
@param {RegExp|String} separator Regex or string to use for separating the string.
@param {Number} [limit] Maximum number of items to include in the result array.
@returns {Array} Array of substrings.
@example
 *
// Basic use
XRegExp.split('a b c  ' ');
// -> ['a  'b  'c']
 *
// With limit
XRegExp.split('a b c  '   2);
// -> ['a  'b']
 *
// Backreferences in result array
XRegExp.split('..word1..  /([a-z]+)(\d+)/i);
// -> ['..  'word  '1  '..']

XRegExp.split = function(str, separator, limit) {



## XRegExp.test = function(str, regex, pos, sticky) {

Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
`sticky` arguments specify the search start position, and whether the match must start at the
specified position only. The `lastIndex` property of the provided regex is not used, but is
updated for compatibility. Also fixes browser bugs compared to the native
`RegExp.prototype.test` and can be used reliably cross-browser.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {RegExp} regex Regex to search with.
@param {Number} [pos=0] Zero-based index at which to start the search.
@param {Boolean|String} [sticky=false] Whether the match must start at the specified position
  only. The string `'sticky'` is accepted as an alternative to `true`.
@returns {Boolean} Whether the regex matched the provided value.
@example
 *
// Basic use
XRegExp.test('abc  /c/); // -> true
 *
// With pos and sticky
XRegExp.test('abc  /c/, 0, 'sticky'); // -> false
XRegExp.test('abc  /c/, 2, 'sticky'); // -> true

XRegExp.test = function(str, regex, pos, sticky) {



## XRegExp.uninstall = function(options) {

Uninstalls optional features according to the specified options. All optional features start out
uninstalled, so this is used to undo the actions of `XRegExp.install`.
 *
@memberOf XRegExp
@param {Object|String} options Options object or string.
@example
 *
// With an options object
XRegExp.uninstall({
  // Disables support for astral code points in Unicode addons
  astral: true,
 *
  // DEPRECATED: Restores native regex methods
  natives: true
});
 *
// With an options string
XRegExp.uninstall('astral natives');

XRegExp.uninstall = function(options) {



## XRegExp.join = function(patterns, separator, flags) {

Returns an XRegExp object that is the concatenation of the given patterns. Patterns can be provided as
regex objects or strings. Metacharacters are escaped in patterns provided as strings.
Backreferences in provided regex objects are automatically renumbered to work correctly within
the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
`flags` argument.
 *
@memberOf XRegExp
@param {Array} patterns Regexes and strings to combine.
@param {String|RegExp} separator Regex or string to use as the joining separator.
@param {String} [flags] Any combination of XRegExp flags.
@returns {RegExp} Union of the provided regexes and strings.
@example
 *
XRegExp.join(['a+b*c  /(dogs)\1/, /(cats)\1/], 'i');
// -> /a\+b\*c(dogs)\1(cats)\2/i

XRegExp.join = function(patterns, separator, flags) {



## XRegExp.union = function(patterns, flags) {

Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
regex objects or strings. Metacharacters are escaped in patterns provided as strings.
Backreferences in provided regex objects are automatically renumbered to work correctly within
the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
`flags` argument.
 *
@memberOf XRegExp
@param {Array} patterns Regexes and strings to combine.
@param {String} [flags] Any combination of XRegExp flags.
@returns {RegExp} Union of the provided regexes and strings.
@example
 *
XRegExp.union(['a+b*c  /(dogs)\1/, /(cats)\1/], 'i');
// -> /a\+b\*c|(dogs)\1|(cats)\2/i

XRegExp.union = function(patterns, flags) {



## Fixed/extended native methods

Calling `XRegExp.install('natives')` uses this to
override the native methods.


### RegExp.exec = function(str) {

Adds named capture support (with backreferences returned as `result.name`), and fixes browser
bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
override the native method. Use via `XRegExp.exec` without overriding natives.
 *
@private
@param {String} str String to search.
@returns {Array} Match array with named backreference properties, or `null`.

fixed.exec = function(str) {



### RegExp.test = function(str) {

Fixes browser bugs in the native `RegExp.prototype.test`. Calling `XRegExp.install('natives')`
uses this to override the native method.
 *
@private
@param {String} str String to search.
@returns {Boolean} Whether the regex matched the provided value.

fixed.test = function(str) {



### String.match = function(regex) {

Adds named capture support (with backreferences returned as `result.name`), and fixes browser
bugs in the native `String.prototype.match`. Calling `XRegExp.install('natives')` uses this to
override the native method.
 *
@private
@param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
@returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
  the result of calling `regex.exec(this)`.

fixed.match = function(regex) {



### String.replace = function(search, replacement) {

Adds support for `${n}` tokens for named and numbered backreferences in replacement text, and
provides named backreferences to replacement functions as `arguments[0].name`. Also fixes browser
bugs in replacement text syntax when performing a replacement using a nonregex search value, and
the value of a replacement regex's `lastIndex` property during replacement iterations and upon
completion. Calling `XRegExp.install('natives')` uses this to override the native method. Note
that this doesn't support SpiderMonkey's proprietary third (`flags`) argument. Use via
`XRegExp.replace` without overriding natives.
 *
@private
@param {RegExp|String} search Search pattern to be replaced.
@param {String|Function} replacement Replacement string or a function invoked to create it.
@returns {String} New string with one or all matches replaced.

fixed.replace = function(search, replacement) {


### String.split = function(separator, limit) {

Fixes browser bugs in the native `String.prototype.split`. Calling `XRegExp.install('natives')`
uses this to override the native method. Use via `XRegExp.split` without overriding natives.
 *
@private
@param {RegExp|String} separator Regex or string to use for separating the string.
@param {Number} [limit] Maximum number of items to include in the result array.
@returns {Array} Array of substrings.

fixed.split = function(separator, limit) {


## Enhanced regex support features


### Letter Escapes are errors (unless...)

Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
consistency and to reserve their syntax, but lets them be superseded by addons.

XRegExp.addToken(
    /\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/,


### Unicode code point escapes (with curly braces)

Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
if you use the same in a character class.

XRegExp.addToken(
    /\\u{([\dA-Fa-f]+)}/,


### Empty character class

Empty character class: `[]` or `[^]`. This fixes a critical cross-browser syntax inconsistency.
Unless this is standardized (per the ES spec), regex syntax can't be accurately parsed because
character class endings can't be determined.

XRegExp.addToken(
    /\[(\^?)\]/,


### Regex comment pattern

Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
free-spacing mode (flag x).

XRegExp.addToken(
    /\(\?#[^)]*\)/,


### Free-spacing mode a.k.a. extended mode regexes

Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.

XRegExp.addToken(
    /\s+|#[^\n]*\n?/,


### Dotall mode a.k.a. ingleline mode (`s` flag)

Dot, in dotall mode (aka singleline mode, flag s) only.

XRegExp.addToken(
    /\./,
    function() {
        return '[\\s\\S]';
    },
    {
        flag: 's
        leadChar: '.'
    }
);


### Named backreference

Named backreference: `\k<name>`. Backreference names can use the characters A-Z, a-z, 0-9, _,
and $ only. Also allows numbered backreferences as `\k<n>`.

XRegExp.addToken(
    /\\k<([\w$]+)>/,


### Numbered backreference

Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.

XRegExp.addToken(
    /\\(\d+)/,



### Named capture group

Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
`(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
Python-style named capture as octals.

XRegExp.addToken(
    /\(\?P?<([\w$]+)>/,


### Capture group & explicit capture mode (`n` flag)

Capturing group; match the opening parenthesis only. Required for support of named capturing
groups. Also adds explicit capture mode (flag n).

XRegExp.addToken(
    /\((?!\?)/,
    {
        optionalFlags: 'n
        leadChar: '('
    }




## XRegExp.build = function(pattern, subs, flags) {

Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in
the outer pattern and provided subpatterns are automatically renumbered to work correctly.
Native flags used by provided subpatterns are ignored in favor of the `flags` argument.
 *
@memberOf XRegExp
@param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
  `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
  character classes.
@param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
  leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
@param {String} [flags] Any combination of XRegExp flags.
@returns {RegExp} Regex with interpolated subpatterns.
@example
 *
var time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $  {
  hours: XRegExp.build('{{h12}} : | {{h24}}  {
    h12: /1[0-2]|0?[1-9]/,
    h24: /2[0-3]|[01][0-9]/
  }, 'x'),
  minutes: /^[0-5][0-9]$/
});
time.test('10:59'); // -> true
XRegExp.exec('10:59  time).minutes; // -> '59'

XRegExp.build = function(pattern, subs, flags) {




## XRegExp.matchRecursive = function(str, left, right, flags, options) {

Returns an array of match strings between outermost left and right delimiters, or an array of
objects with detailed match parts and position data. An error is thrown if delimiters are
unbalanced within the data.
 *
@memberOf XRegExp
@param {String} str String to search.
@param {String} left Left delimiter as an XRegExp pattern.
@param {String} right Right delimiter as an XRegExp pattern.
@param {String} [flags] Any native or XRegExp flags, used for the left and right delimiters.
@param {Object} [options] Lets you specify `valueNames` and `escapeChar` options.
@returns {Array} Array of matches, or an empty array.
@example
 *
// Basic usage
var str = '(t((e))s)t()(ing)';
XRegExp.matchRecursive(str, '\\(  '\\)  'g');
// -> ['t((e))s  '  'ing']
 *
// Extended information mode with valueNames
str = 'Here is <div> <div>an</div></div> example';
XRegExp.matchRecursive(str, '<div\\s*>  '</div>  'gi  {
  valueNames: ['between  'left  'match  'right']
});
// -> [
// {- between  value: 'Here is         start: 0,  end: 8},
// {- left     value: '<div>           start: 8,  end: 13},
// {- match    value: ' <div>an</div>  start: 13, end: 27},
// {- right    value: '</div>          start: 27, end: 33},
// {- between  value: ' example        start: 33, end: 41}
// ]
 *
// Omitting unneeded parts with null valueNames, and using escapeChar
str = '...{1}.\\{{function(x,y){return {y:x}}}';
XRegExp.matchRecursive(str, '{  '}  'g  {
  valueNames: ['literal  null, 'value  null],
  escapeChar: '\\'
});
// -> [
// {- literal  value: '...   start: 0, end: 3},
// {- value    value: '1     start: 4, end: 5},
// {- literal  value: '.\\{  start: 6, end: 9},
// {- value    value: 'function(x,y){return {y:x}}  start: 10, end: 37}
// ]
 *
// Sticky mode via flag y
str = '<1><<<2>>><3>4<5>';
XRegExp.matchRecursive(str, '<  '>  'gy');
// -> ['1  '<<2>>  '3']

XRegExp.matchRecursive = function(str, left, right, flags, options) {




### Unicode matching (`\p{..}`, `\P{..}`, `\p{^..}`, `\pC`) & astral mode (`A` flag)

Adds base support for Unicode matching:
- Adds syntax `\p{..}` for matching Unicode tokens. Tokens can be inverted using `\P{..}` or
  `\p{^..}`. Token names ignore case, spaces, hyphens, and underscores. You can omit the
  braces for token names that are a single letter (e.g. `\pL` or `PL`).
- Adds flag A (astral), which enables 21-bit Unicode support.
- Adds the `XRegExp.addUnicodeData` method used by other addons to provide character data.
 *
Unicode Base relies on externally provided Unicode character data. Official addons are
available to provide data for Unicode categories, scripts, blocks, and properties.
 *
@requires XRegExp





Add Unicode token syntax: `\p{..}`, `\P{..}`, `\p{^..}`, `\pC`. Also add astral mode (flag A).

XRegExp.addToken(


Adds to the list of Unicode tokens that XRegExp regexes can match via `\p` or `\P`.
 *
@memberOf XRegExp
@param {Array} data Objects with named character ranges. Each object may have properties
  `name`, `alias`, `isBmpLast`, `inverseOf`, `bmp`, and `astral`. All but `name` are
  optional, although one of `bmp` or `astral` is required (unless `inverseOf` is set). If
  `astral` is absent, the `bmp` data is used for BMP and astral modes. If `bmp` is absent,
  the name errors in BMP mode but works in astral mode. If both `bmp` and `astral` are
  provided, the `bmp` data only is used in BMP mode, and the combination of `bmp` and
  `astral` data is used in astral mode. `isBmpLast` is needed when a token matches orphan
  high surrogates *and* uses surrogate pairs to match astral code points. The `bmp` and
  `astral` data should be a combination of literal characters and `\xHH` or `\uHHHH` escape
  sequences, with hyphens to create ranges. Any regex metacharacters in the data should be
  escaped, apart from range-creating hyphens. The `astral` data can additionally use
  character classes and alternation, and should use surrogate pairs to represent astral code
  points. `inverseOf` can be used to avoid duplicating character data if a Unicode token is
  defined as the exact inverse of another token.
@example
 *
// Basic use
XRegExp.addUnicodeData([{
  - XDigit
  alias: 'Hexadecimal
  bmp: '0-9A-Fa-f'
}]);
XRegExp('\\p{XDigit}:\\p{Hexadecimal}+').test('0:3D'); // -> true

XRegExp.addUnicodeData = function(data) {




## XRegExp._getUnicodeProperty = function(name) {

@ignore
 *
Return a reference to the internal Unicode definition structure for the given Unicode Property
if the given name is a legal Unicode Property for use in XRegExp `\p` or `\P` regex constructs.
 *
@memberOf XRegExp
@param {String} name Name by which the Unicode Property may be recognized (case-insensitive),
  e.g. `'N'` or `'Number'`.

  The given name is matched against all registered Unicode Properties and Property Aliases.
 *
@return {Object} Reference to definition structure when the name matches a Unicode Property;
`false` when the name does not match *any* Unicode Property or Property Alias.
 *
@note
For more info on Unicode Properties, see also http://unicode.org/reports/tr18/#Categories.
 *
@note
This method is *not* part of the officially documented and published API and is meant 'for
advanced use only' where userland code wishes to re-use the (large) internal Unicode
structures set up by XRegExp as a single point of Unicode 'knowledge' in the application.
 *
See some example usage of this functionality, used as a boolean check if the given name
is legal and to obtain internal structural data:
- `function prepareMacros(...)` in https://github.com/GerHobbelt/jison-lex/blob/master/regexp-lexer.js#L885
- `function generateRegexesInitTableCode(...)` in https://github.com/GerHobbelt/jison-lex/blob/master/regexp-lexer.js#L1999
 *
Note that the second function in the example (`function generateRegexesInitTableCode(...)`)
uses a approach without using this API to obtain a Unicode range spanning regex for use in environments
which do not support XRegExp by simply expanding the XRegExp instance to a String through
the `map()` mapping action and subsequent `join()`.

XRegExp._getUnicodeProperty = function(name) {
// Generates a token lookup name: lowercase, with hyphens, spaces, and underscores removed
function normalize(name) {
    return name.replace(/[- _]+/g, '').toLowerCase();
}






## Unicode Blocks, Categories, Properties and Scripts

Adds support for all Unicode blocks. Block names use the prefix 'In'. E.g.,
`\p{InBasicLatin}`. Token names are case insensitive, and any spaces, hyphens, and
underscores are ignored.
 *
Uses Unicode 8.0.0.
 *
@requires XRegExp, Unicode Base


- InAegean_Numbers
- InAhom
- InAlchemical_Symbols
- InAlphabetic_Presentation_Forms
- InAnatolian_Hieroglyphs
- InAncient_Greek_Musical_Notation
- InAncient_Greek_Numbers
- InAncient_Symbols
- InArabic
- InArabic_Extended_A
- InArabic_Mathematical_Alphabetic_Symbols
- InArabic_Presentation_Forms_A
- InArabic_Presentation_Forms_B
- InArabic_Supplement
- InArmenian
- InArrows
- InAvestan
- InBalinese
- InBamum
- InBamum_Supplement
- InBasic_Latin
- InBassa_Vah
- InBatak
- InBengali
- InBlock_Elements
- InBopomofo
- InBopomofo_Extended
- InBox_Drawing
- InBrahmi
- InBraille_Patterns
- InBuginese
- InBuhid
- InByzantine_Musical_Symbols
- InCarian
- InCaucasian_Albanian
- InChakma
- InCham
- InCherokee
- InCherokee_Supplement
- InCJK_Compatibility
- InCJK_Compatibility_Forms
- InCJK_Compatibility_Ideographs
- InCJK_Compatibility_Ideographs_Supplement
- InCJK_Radicals_Supplement
- InCJK_Strokes
- InCJK_Symbols_and_Punctuation
- InCJK_Unified_Ideographs
- InCJK_Unified_Ideographs_Extension_A
- InCJK_Unified_Ideographs_Extension_B
- InCJK_Unified_Ideographs_Extension_C
- InCJK_Unified_Ideographs_Extension_D
- InCJK_Unified_Ideographs_Extension_E
- InCombining_Diacritical_Marks
- InCombining_Diacritical_Marks_Extended
- InCombining_Diacritical_Marks_for_Symbols
- InCombining_Diacritical_Marks_Supplement
- InCombining_Half_Marks
- InCommon_Indic_Number_Forms
- InControl_Pictures
- InCoptic
- InCoptic_Epact_Numbers
- InCounting_Rod_Numerals
- InCuneiform
- InCuneiform_Numbers_and_Punctuation
- InCurrency_Symbols
- InCypriot_Syllabary
- InCyrillic
- InCyrillic_Extended_A
- InCyrillic_Extended_B
- InCyrillic_Supplement
- InDeseret
- InDevanagari
- InDevanagari_Extended
- InDingbats
- InDomino_Tiles
- InDuployan
- InEarly_Dynastic_Cuneiform
- InEgyptian_Hieroglyphs
- InElbasan
- InEmoticons
- InEnclosed_Alphanumeric_Supplement
- InEnclosed_Alphanumerics
- InEnclosed_CJK_Letters_and_Months
- InEnclosed_Ideographic_Supplement
- InEthiopic
- InEthiopic_Extended
- InEthiopic_Extended_A
- InEthiopic_Supplement
- InGeneral_Punctuation
- InGeometric_Shapes
- InGeometric_Shapes_Extended
- InGeorgian
- InGeorgian_Supplement
- InGlagolitic
- InGothic
- InGrantha
- InGreek_and_Coptic
- InGreek_Extended
- InGujarati
- InGurmukhi
- InHalfwidth_and_Fullwidth_Forms
- InHangul_Compatibility_Jamo
- InHangul_Jamo
- InHangul_Jamo_Extended_A
- InHangul_Jamo_Extended_B
- InHangul_Syllables
- InHanunoo
- InHatran
- InHebrew
- InHigh_Private_Use_Surrogates
- InHigh_Surrogates
- InHiragana
- InIdeographic_Description_Characters
- InImperial_Aramaic
- InInscriptional_Pahlavi
- InInscriptional_Parthian
- InIPA_Extensions
- InJavanese
- InKaithi
- InKana_Supplement
- InKanbun
- InKangxi_Radicals
- InKannada
- InKatakana
- InKatakana_Phonetic_Extensions
- InKayah_Li
- InKharoshthi
- InKhmer
- InKhmer_Symbols
- InKhojki
- InKhudawadi
- InLao
- InLatin_1_Supplement
- InLatin_Extended_A
- InLatin_Extended_Additional
- InLatin_Extended_B
- InLatin_Extended_C
- InLatin_Extended_D
- InLatin_Extended_E
- InLepcha
- InLetterlike_Symbols
- InLimbu
- InLinear_A
- InLinear_B_Ideograms
- InLinear_B_Syllabary
- InLisu
- InLow_Surrogates
- InLycian
- InLydian
- InMahajani
- InMahjong_Tiles
- InMalayalam
- InMandaic
- InManichaean
- InMathematical_Alphanumeric_Symbols
- InMathematical_Operators
- InMeetei_Mayek
- InMeetei_Mayek_Extensions
- InMende_Kikakui
- InMeroitic_Cursive
- InMeroitic_Hieroglyphs
- InMiao
- InMiscellaneous_Mathematical_Symbols_A
- InMiscellaneous_Mathematical_Symbols_B
- InMiscellaneous_Symbols
- InMiscellaneous_Symbols_and_Arrows
- InMiscellaneous_Symbols_and_Pictographs
- InMiscellaneous_Technical
- InModi
- InModifier_Tone_Letters
- InMongolian
- InMro
- InMultani
- InMusical_Symbols
- InMyanmar
- InMyanmar_Extended_A
- InMyanmar_Extended_B
- InNabataean
- InNew_Tai_Lue
- InNKo
- InNumber_Forms
- InOgham
- InOl_Chiki
- InOld_Hungarian
- InOld_Italic
- InOld_North_Arabian
- InOld_Permic
- InOld_Persian
- InOld_South_Arabian
- InOld_Turkic
- InOptical_Character_Recognition
- InOriya
- InOrnamental_Dingbats
- InOsmanya
- InPahawh_Hmong
- InPalmyrene
- InPau_Cin_Hau
- InPhags_pa
- InPhaistos_Disc
- InPhoenician
- InPhonetic_Extensions
- InPhonetic_Extensions_Supplement
- InPlaying_Cards
- InPrivate_Use_Area
- InPsalter_Pahlavi
- InRejang
- InRumi_Numeral_Symbols
- InRunic
- InSamaritan
- InSaurashtra
- InSharada
- InShavian
- InShorthand_Format_Controls
- InSiddham
- InSinhala
- InSinhala_Archaic_Numbers
- InSmall_Form_Variants
- InSora_Sompeng
- InSpacing_Modifier_Letters
- InSpecials
- InSundanese
- InSundanese_Supplement
- InSuperscripts_and_Subscripts
- InSupplemental_Arrows_A
- InSupplemental_Arrows_B
- InSupplemental_Arrows_C
- InSupplemental_Mathematical_Operators
- InSupplemental_Punctuation
- InSupplemental_Symbols_and_Pictographs
- InSupplementary_Private_Use_Area_A
- InSupplementary_Private_Use_Area_B
- InSutton_SignWriting
- InSyloti_Nagri
- InSyriac
- InTagalog
- InTagbanwa
- InTags
- InTai_Le
- InTai_Tham
- InTai_Viet
- InTai_Xuan_Jing_Symbols
- InTakri
- InTamil
- InTelugu
- InThaana
- InThai
- InTibetan
- InTifinagh
- InTirhuta
- InTransport_and_Map_Symbols
- InUgaritic
- InUnified_Canadian_Aboriginal_Syllabics
- InUnified_Canadian_Aboriginal_Syllabics_Extended
- InVai
- InVariation_Selectors
- InVariation_Selectors_Supplement
- InVedic_Extensions
- InVertical_Forms
- InWarang_Citi
- InYi_Radicals
- InYi_Syllables
- InYijing_Hexagram_Symbols






Adds support for Unicode's general categories. E.g., `\p{Lu}` or `\p{Uppercase Letter}`. See
category descriptions in UAX #44 <http://unicode.org/reports/tr44/#GC_Values_Table>. Token
names are case insensitive, and any spaces, hyphens, and underscores are ignored.
 *
Uses Unicode 8.0.0.
 *
@requires XRegExp, Unicode Base




alias: 'Close_Punctuation
alias: 'Connector_Punctuation
alias: 'Control
alias: 'Currency_Symbol
alias: 'Dash_Punctuation
alias: 'Decimal_Number
alias: 'Enclosing_Mark
alias: 'Final_Punctuation
alias: 'Format
alias: 'Initial_Punctuation
alias: 'Letter
alias: 'Letter_Number
alias: 'Line_Separator
alias: 'Lowercase_Letter
alias: 'Mark
alias: 'Math_Symbol
alias: 'Modifier_Letter
alias: 'Modifier_Symbol
alias: 'Nonspacing_Mark
alias: 'Number
alias: 'Open_Punctuation
alias: 'Other
alias: 'Other_Letter
alias: 'Other_Number
alias: 'Other_Punctuation
alias: 'Other_Symbol
alias: 'Paragraph_Separator
alias: 'Private_Use
alias: 'Punctuation
alias: 'Separator
alias: 'Space_Separator
alias: 'Spacing_Mark
alias: 'Surrogate
alias: 'Symbol
alias: 'Titlecase_Letter
alias: 'Unassigned
alias: 'Uppercase_Letter
- C
- Cc
- Cf
- Cn
- Co
- Cs
- L
- Ll
- Lm
- Lo
- Lt
- Lu
- M
- Mc
- Me
- Mn
- N
- Nd
- Nl
- No
- P
- Pc
- Pd
- Pe
- Pf
- Pi
- Po
- Ps
- S
- Sc
- Sk
- Sm
- So
- Z
- Zl
- Zp
- Zs





Adds properties to meet the UTS #18 Level 1 RL1.2 requirements for Unicode regex support. See
<http://unicode.org/reports/tr18/#RL1.2>. Following are definitions of these properties from
UAX #44 <http://unicode.org/reports/tr44/>:
 *
- Alphabetic
  Characters with the Alphabetic property. Generated from: Lowercase + Uppercase + Lt + Lm +
  Lo + Nl + Other_Alphabetic.
 *
- Default_Ignorable_Code_Point
  For programmatic determination of default ignorable code points. New characters that should
  be ignored in rendering (unless explicitly supported) will be assigned in these ranges,
  permitting programs to correctly handle the default rendering of such characters when not
  otherwise supported.
 *
- Lowercase
  Characters with the Lowercase property. Generated from: Ll + Other_Lowercase.
 *
- Noncharacter_Code_Point
  Code points permanently reserved for internal use.
 *
- Uppercase
  Characters with the Uppercase property. Generated from: Lu + Other_Uppercase.
 *
- White_Space
  Spaces, separator characters and other control characters which should be treated by
  programming languages as "white space" for the purpose of parsing elements.
 *
The properties ASCII, Any, and Assigned are also included but are not defined in UAX #44. UTS
#18 RL1.2 additionally requires support for Unicode scripts and general categories. These are
included in XRegExp's Unicode Categories and Unicode Scripts addons.
 *
Token names are case insensitive, and any spaces, hyphens, and underscores are ignored.
 *
Uses Unicode 8.0.0.
 *
@requires XRegExp, Unicode Base



- Alphabetic
- Any
- ASCII
- Default_Ignorable_Code_Point
- Lowercase
- Noncharacter_Code_Point
- Uppercase
- White_Space



- Assigned     // this is defined as the inverse of Unicode category Cn (Unassigned)








Adds support for all Unicode scripts. E.g., `\p{Latin}`. Token names are case insensitive,
and any spaces, hyphens, and underscores are ignored.
 *
Uses Unicode 8.0.0.
 *
@requires XRegExp, Unicode Base

XRegExp.addUnicodeData(unicodeData);




- Ahom
- Anatolian_Hieroglyphs
- Arabic
- Armenian
- Avestan
- Balinese
- Bamum
- Bassa_Vah
- Batak
- Bengali
- Bopomofo
- Brahmi
- Braille
- Buginese
- Buhid
- Canadian_Aboriginal
- Carian
- Caucasian_Albanian
- Chakma
- Cham
- Cherokee
- Common
- Coptic
- Cuneiform
- Cypriot
- Cyrillic
- Deseret
- Devanagari
- Duployan
- Egyptian_Hieroglyphs
- Elbasan
- Ethiopic
- Georgian
- Glagolitic
- Gothic
- Grantha
- Greek
- Gujarati
- Gurmukhi
- Han
- Hangul
- Hanunoo
- Hatran
- Hebrew
- Hiragana
- Imperial_Aramaic
- Inherited
- Inscriptional_Pahlavi
- Inscriptional_Parthian
- Javanese
- Kaithi
- Kannada
- Katakana
- Kayah_Li
- Kharoshthi
- Khmer
- Khojki
- Khudawadi
- Lao
- Latin
- Lepcha
- Limbu
- Linear_A
- Linear_B
- Lisu
- Lycian
- Lydian
- Mahajani
- Malayalam
- Mandaic
- Manichaean
- Meetei_Mayek
- Mende_Kikakui
- Meroitic_Cursive
- Meroitic_Hieroglyphs
- Miao
- Modi
- Mongolian
- Mro
- Multani
- Myanmar
- Nabataean
- New_Tai_Lue
- Nko
- Ogham
- Ol_Chiki
- Old_Hungarian
- Old_Italic
- Old_North_Arabian
- Old_Permic
- Old_Persian
- Old_South_Arabian
- Old_Turkic
- Oriya
- Osmanya
- Pahawh_Hmong
- Palmyrene
- Pau_Cin_Hau
- Phags_Pa
- Phoenician
- Psalter_Pahlavi
- Rejang
- Runic
- Samaritan
- Saurashtra
- Sharada
- Shavian
- Siddham
- SignWriting
- Sinhala
- Sora_Sompeng
- Sundanese
- Syloti_Nagri
- Syriac
- Tagalog
- Tagbanwa
- Tai_Le
- Tai_Tham
- Tai_Viet
- Takri
- Tamil
- Telugu
- Thaana
- Thai
- Tibetan
- Tifinagh
- Tirhuta
- Ugaritic
- Vai
- Warang_Citi
- Yi



