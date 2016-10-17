// TODO real tests
var assert = require("assert");
var json2jison = require('./json2jison');
var grammar = "%% foo : bar { return true; } ;";
var json = {
  "bnf": {
    "foo": [
      [
        "bar",
        " return true; "
      ]
    ]
  }
};

var rv = json2jison.convert(json);
assert.equal(rv.trim().replace(/\s+/g, ' '), grammar.replace(/\s+/g, ' '));
