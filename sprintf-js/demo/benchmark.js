//var sprintf = require("../").sprintf;
var lib = require("../src/sprintf");
var sprintf = lib.sprintf;
var vsprintf = lib.vsprintf;
var qprintf = require("qprintf").sprintf;

var x = null;

var tests = [
    {format: "%8d", value: 12345},
    {format: "%08d", value: 12345},
    {format: "%2d", value: 12345},
    {format: "%8s", value: "abcde"},
    {format: "%+010d", value: 12345},
];

console.log(sprintf("%34s | %34s", "sprintf", "qprintf"));
for (var testIndex in tests) {
    var fmt = tests[testIndex].format;
    var val = tests[testIndex].value;
    var report_line = [];
    try {
        var t1 = Date.now();
        for (var i = 0; i < 100000; i++) {
            x = sprintf(fmt, val);
            // and test with cache killer:
            if (0) {
                sprintf.cache = {};
            }
        }
        var ms = Date.now() - t1;
        report_line.push(sprintf(" %5d ms  %8s", ms, fmt), x);
    } catch (ex) {
        ms = '---';
        x = ex;
        report_line.push(sprintf(" %5s     %8s", ms, fmt), x);
    }

    // other library:
    fmt = tests[testIndex].format;
    val = tests[testIndex].value;
    try {
        t1 = Date.now();
        for (i = 0; i < 100000; i++) {
            x = qprintf(fmt, val);
        }
        ms = Date.now() - t1;
        report_line.push(sprintf(" %5d ms  %8s", ms, fmt), x);
    } catch (ex) {
        ms = '---';
        x = ex;
        report_line.push(sprintf(" %5s     %8s", ms, fmt), x);
    }
    
    console.log(vsprintf("%s  %13s | %s  %13s", report_line));
}
