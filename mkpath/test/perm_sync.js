/* Tests borrowed from substack's node-mkdirp
 * https://github.com/substack/node-mkdirp */

var mkpath = require('../');
var fs = require('fs');
var test = require('tap').test;

test('sync perm', function (t) {
    t.plan(2);
    var file = '/tmp/' + (Math.random() * (1<<30)).toString(16) + '.json';
    
    mkpath.sync(file, 0755);
    fs.stat(file, function (err, stat) {
        if (err) t.fail(err)
        else {
            t.equal(stat.mode & 0777, 0755);
            t.ok(stat.isDirectory(), 'target not a directory');
            t.end();
        }
    })
});

test('sync root perm', function (t) {
    t.plan(1);
    
    var file = '/tmp';
    mkpath.sync(file, 0755);
    fs.stat(file, function (err, stat) {
        if (err) t.fail(err)
        else {
            t.ok(stat.isDirectory(), 'target not a directory');
            t.end();
        }
    })
});

