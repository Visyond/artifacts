/**
    @overview Output a 'RAW' JSDoc data JSON and perform some preliminary analysis on the 
    gathered data: undocumented functions, etc.

    @version 0.0.2
    @example
        ./jsdoc scratch/jsdoc_test.js -t templates/raw -d doc-diag 
 */
'use strict';

var doop = require('jsdoc/util/doop');
var env = require('jsdoc/env');
var fs = require('jsdoc/fs');
var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');
var xml = require('js2xmlparser');

var htmlsafe = helper.htmlsafe;
//var linkto = helper.linkto;            // protect ourselves from accidentally using this one directly without any tweaking...
var resolveAuthorLinks = helper.resolveAuthorLinks;
var scopeToPunc = helper.scopeToPunc;
var hasOwnProp = Object.prototype.hasOwnProperty;

var data;
var view;
var summary;


const linkToOptions = {
    outputAsJSON: true
};

var outdir = path.normalize(env.opts.destination);

function extend(dst /* , src... */) {
    dst = dst || {};
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < args.length; i++) {
        var src = args[i];
        if (src) {
            for (var key in src) {
                dst[key] = src[key];
            }
        }
    }
    return dst;
}

function renderView(template, data) {
    //return view.render(template, data);
    return data;
}

function resolveLinksHelper(html) {
    var rv, count, iv;

    switch (typeof html) {
    case "string":
        iv = helper.resolveLinks(html, linkToOptions);
        if (iv === html) {
            // don't include this bugger in the HTMLized copy as there's really nothing to HTMLize here...
            return null;
        }
        return iv;

    case "object":
        rv = null;
        count = 0;
        if (Array.isArray(html)) {
            rv = [];
            for (var i = 0, len = html.length; i < len; i++) {
                iv = resolveLinksHelper(html[i]);
                if (iv !== null) {
                    count++;
                    rv[i] = iv;
                }
            }
        } else if (html) {
            rv = {};
            for (var key in html) {
                iv = resolveLinksHelper(html[key]);
                if (iv !== null) {
                    count++;
                    rv[key] = iv;
                }
            }
        }
        // don't include this bugger in the HTMLized copy as there's really nothing to HTMLize here...
        if (count === 0) {
            return null;
        }
        return rv;

    default:
        // don't include this bugger in the HTMLized copy as there's really nothing to HTMLize here...
        return null;
    }
}

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial, options) {
    return helper.toTutorial(tutorial, null, { 
        tag: 'em', 
        classname: 'disabled', 
        prefix: 'Tutorial: ' 
    }, options);
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet, null, linkToOptions);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet);

    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function getSignatureAttributes(item) {
    var attributes = [];

    if (item.optional) {
        attributes.push('opt');
    }

    if (item.nullable === true) {
        attributes.push('nullable');
    }
    else if (item.nullable === false) {
        attributes.push('non-null');
    }

    return attributes;
}

function updateItemName(item) {
    var attributes = getSignatureAttributes(item);
    var itemName = item.name || '';
    return extend({}, item, {
        itemName: itemName,
        isVariable: item.variable,
        signatureAttributes: attributes
    });
}

function addParamAttributes(params) {
    return params.filter(function(param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item && item.type && item.type.names) {
        item.type.names.forEach(function(name) {
            types.push( linktoBasic(name, htmlsafe(name), linkToOptions) );
        });
    }

    return types;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = extend(f.signature, {
        params: params
    });
}

function addSignatureReturns(f) {
    var attribs = [];
    var returnTypes = [];

    // jam all the return-type attributes into an array. this could create odd results (for example,
    // if there are both nullable and non-nullable return types), but let's assume that most people
    // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
    if (f.returns) {
        f.returns.forEach(function(item) {
            helper.getAttribs(item).forEach(function(attrib) {
                if (attribs.indexOf(attrib) === -1) {
                    attribs.push(attrib);
                }
            });
        });
    }

    if (f.returns) {
        returnTypes = f.returns;
    }

    f.signature = extend(f.signature, {
        attribs: attribs,
        returnTypes: returnTypes
    });
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = extend(f.signature, {
        signatureTypes: types
    });
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);

    f.attribs = attribs;
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function(file) {
        files[file].shortened = files[file].resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }

    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function generate(type, longname, title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks === false ? false : true;

    var docData = {
        //env: env,
        title: title,
        docs: docs
    };

    var outpath = path.join(outdir, filename),
        html = renderView('container.tmpl', docData);

    if (resolveLinks) {
        html = resolveLinksHelper(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    summary.push({
        type: type,
        name: title, 
        longname: longname,
        data: docs, 
        filename: filename,
        outpath: outpath,
        resolveLinks: resolveLinks,
        html: html
    });
}

function generateSourceFiles(sourceFiles, encoding) {
    encoding = encoding || 'utf8';
    Object.keys(sourceFiles).forEach(function(file) {
        var source;
        // links are keyed to the shortened path in each doclet's `meta.shortpath` property
        var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
        helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        try {
            source = {
                kind: 'source',
                code: fs.readFileSync(sourceFiles[file].resolved, encoding),
                encoding: encoding,
                file: file,
                shortened: sourceFiles[file].shortened,
                sourceOutfile: sourceOutfile
            };
        }
        catch (e) {
            logger.error('Error while generating source file %s: %s', file, e.message);
        }

        generate('Source', null, sourceFiles[file].shortened, [source], sourceOutfile,
            false);
    });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbols[symbol.longname] || [];
        symbols[symbol.longname].push(symbol);
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.modules = symbols[module.longname]
                // Dot not only show symbols that have a description. Do not make an exception for classes, because
                // we want to show every signature heading no matter what.
                .map(function(symbol) {
                    symbol.willBeListed = !!(symbol.description || symbol.kind === 'class');

                    symbol = doop(symbol);

                    if (symbol.kind === 'class' || symbol.kind === 'function') {
                        symbol.cleanName = symbol.name.replace('module:', '');
                    }

                    return symbol;
                });
        }
    });
}

/**
 * Generate a part of the global navigation list.
 *
 * @param  {[type]} items       [description]
 * @param  {[type]} itemHeading [description]
 * @param  {[type]} itemsSeen   [description]
 * @param  {Function} linktoFn    expected prototype: `function (longName, name, options)`
 *
 * @return {Array|Null}         [description]
 */
function buildMemberNav(items, itemHeading, itemsSeen, linktoFn) {
    var nav;

    if (items.length) {
        var itemsNav = [];

        items.forEach(function(item) {
            if ( !hasOwnProp.call(item, 'longname') ) {
                itemsNav.push(linktoFn('', item.name, linkToOptions));
            }
            else if ( !hasOwnProp.call(itemsSeen, item.longname) ) {
                var displayName;
                if (env.conf.templates.default.useLongnameInNav) {
                    displayName = item.longname;
                } else {
                    displayName = item.name;
                }
                itemsNav.push(linktoFn(item.longname, displayName.replace(/\b(module|event):/g, ''), linkToOptions));

                itemsSeen[item.longname] = true;
            }
        });

        if (itemsNav.length > 0) {
            nav = {
                heading: itemHeading,
                list: itemsNav
            };
        }
    }

    return nav;
}

function linktoBasic(longName, name, options) {
    return helper.linkto(longName, name, null, null, options);
}

function linktoTutorial(longName, name, options) {
    return tutoriallink(name, options);
}

function linktoExternal(longName, name, options) {
    return linktoBasic(longName, name.replace(/(^"|"$)/g, ''), options);
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
    var nav = {}; // '<h2><a href="index.html">Home</a></h2>';
    var seen = {};
    var seenTutorials = {};

    nav.modules = buildMemberNav(members.modules, 'Modules', {}, linktoBasic);
    nav.externals = buildMemberNav(members.externals, 'Externals', seen, linktoExternal);
    nav.classes = buildMemberNav(members.classes, 'Classes', seen, linktoBasic);
    nav.events = buildMemberNav(members.events, 'Events', seen, linktoBasic);
    nav.namespaces = buildMemberNav(members.namespaces, 'Namespaces', seen, linktoBasic);
    nav.mixins = buildMemberNav(members.mixins, 'Mixins', seen, linktoBasic);
    nav.tutorials = buildMemberNav(members.tutorials, 'Tutorials', seenTutorials, linktoTutorial);
    nav.interfaces = buildMemberNav(members.interfaces, 'Interfaces', seen, linktoBasic);

    if (members.globals.length) {
        var globalNav = [];

        members.globals.forEach(function(g) {
            if ( g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname) ) {
                globalNav.push(linktoBasic(g.longname, g.name, linkToOptions));
            }
            seen[g.longname] = true;
        });

        if (!globalNav) {
            // turn the heading into a link so you can actually get to the global page
            nav.globals = linktoBasic('global', 'Global', linkToOptions);
        }
        else {
            nav.globals = {
                heading: "Global",
                list: globalNav
            };
        }
    }

    return nav;
}

/**
 * Spit out the *complete* source/documentation info tree produced by the JSDoc core.
 * 
 * The tree is augmented with the derived info bits gathered by internal cross-referencing, etc.
 * as is done by the `default` template: all info is presented in *raw* form so you will be
 * able to use this info in any way you want. 
 *
 * ## Strike 1
 * 
 * **_Nothing_ got filtered/removed!** 
 *
 * ## Strike 2
 * 
 * We expect your subsequent process to pick and take what it wants/needs. The output is **not
 * intended for human consumption** but is meant to serve as a *maximum power* data feed for
 * subsequent tools in your documentation chain.
 *
 * ## Strike 3 -- and you're *it*
 * 
 * You have been warned. The output *will* include JSDoc internals which will remain *undocumented*.
 * 
 * You, the receiver, are an experienced engineer who does not panic when faced with a bit
 * of RTFC when things become hairy.
 *
 * Enjoy the **full** power of JSDoc!
 *
 * @param  {TAFFY} taffyData    See <http://taffydb.com/>.
 * @param  {object} opts        options coming in
 * @param  {Tutorial} tutorials Optional tutorials
 *
 * @return {object}             All the raw and augmented data in one big tree, 
 *                              ready to be dumped to JSON file
 *
 * ## Internal Developer Note
 *
 * This code may look a little crumpled at places: keep in mind that this codebase has the
 * *implicit* intent to **stay as close as possible to the `default` template codebase so that
 * we can track/sync the changes/upgrades of that official *primary* postprocessor/template**.
 *
 * The benefit of this implicit software editing goal being that we make it *easier* for ourselves
 * to keep track of the internal upgrades and intermediate storage data changes as those will
 * be reflected in the primary template: staying close to that codebase allows us to perform
 * quick check-and-update actions for this template, using tools such as Beyond Compare to
 * perform fast visual comparisons and apply manual patches.
 *
 * **TL;DR**: DO NOT REFACTOR because you think that 'improves' the template code. Stay close
 * to the `default` template code as much as possible so that tools like Beyond Compare(tm)
 * can provide optimal help in your compare,match & mix software update/improvement work. 
 */
var regurgitate = exports.regurgitate = function(taffyData, opts, tutorials) {
    data = taffyData;

    var conf = env.conf.templates || {};
    conf.raw = conf.raw || {};

    var templatePath = path.normalize(opts.template);
    view = new template.Template( path.join(templatePath, 'tmpl') );

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    view.layout = conf.raw.layoutFile ?
        path.getResourcePath(path.dirname(conf.raw.layoutFile),
            path.basename(conf.raw.layoutFile) ) :
        'layout.tmpl';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data, {
        keepUndocumented: true,
        keepMarkedAsIgnore: true,
        keepMembersOfAnonymous: true,
        keepAllAccessLevels: true,
        //keepEveryone: true
    });
    //data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];
    data().each(function(doclet) {
         doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    });

    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join( outdir, packageInfo.name, (packageInfo.version || '') );
    }

    // RAW template does not need to copy any template-specific static files to the output
    if (0) {
        fs.mkPath(outdir);

        // copy the template's static files to outdir
        var fromDir = path.join(templatePath, 'static');
        var staticFiles = fs.ls(fromDir, 3);

        staticFiles.forEach(function(fileName) {
            var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
            fs.mkPath(toDir);
            fs.copyFileSync(fileName, toDir);
        });

        // copy user-specified static files to outdir
        var staticFilePaths;
        var staticFileFilter;
        var staticFileScanner;
        if (conf.raw.staticFiles) {
            // The canonical property name is `include`. We accept `paths` for backwards compatibility
            // with a bug in JSDoc 3.2.x.
            staticFilePaths = conf.raw.staticFiles.include ||
                conf.raw.staticFiles.paths ||
                [];
            staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.raw.staticFiles);
            staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

            staticFilePaths.forEach(function(filePath) {
                var extraStaticFiles;

                filePath = path.resolve(env.pwd, filePath);
                extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

                extraStaticFiles.forEach(function(fileName) {
                    var sourcePath = fs.toDir(filePath);
                    var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                    fs.mkPath(toDir);
                    fs.copyFileSync(fileName, toDir);
                });
            });
        }
    }
    
    if (sourceFilePaths.length) {
        sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );
    }
    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // output pretty-printed source files by default
    var outputSourceFiles = conf.raw && conf.raw.outputSourceFiles !== false ? true :
        false;

    // add template helpers
    view.find = find;
    view.linkto = linktoBasic;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;
    view.outputSourceFiles = outputSourceFiles;

    // once for all
    var nav = view.nav = buildNav(members);
    attachModuleSymbols( find({ longname: {left: 'module:'} }), members.modules );

    // generate the pretty-printed source files first so other pages can link to them
    if (outputSourceFiles) {
        generateSourceFiles(sourceFiles, opts.encoding);
    }

    if (members.globals.length) { generate('Global', null, 'Global', [{kind: 'globalobj'}], globalUrl); }

    // index page displays information from package.json and lists files
    var files = find({kind: 'file'}),
        packages = find({kind: 'package'});

    generate('Home', null, 'Home',
        packages.concat(
            [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}]
        ).concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);
    var interfaces = taffy(members.interfaces);

    Object.keys(helper.longnameToUrl).forEach(function(longname) {
        var myModules = helper.find(modules, {longname: longname});
        if (myModules.length) {
            generate('Module', longname, myModules[0].name, myModules, helper.longnameToUrl[longname]);
        }

        var myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length) {
            generate('Class', longname, myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
        }

        var myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length) {
            generate('Namespace', longname, myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
        }

        var myMixins = helper.find(mixins, {longname: longname});
        if (myMixins.length) {
            generate('Mixin', longname, myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
        }

        var myExternals = helper.find(externals, {longname: longname});
        if (myExternals.length) {
            generate('External', longname, myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
        }

        var myInterfaces = helper.find(interfaces, {longname: longname});
        if (myInterfaces.length) {
            generate('Interface', longname, myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
        }
    });

    var tut_docs = [];

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(type, level, title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };

        var tutorialPath = path.join(outdir, filename),
            html = renderView('tutorial.tmpl', tutorialData);

        // yes, you can use {@link} in tutorials too!
        html = resolveLinksHelper(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        tut_docs.push({
            type: type,
            level: level,
            title: title,
            tutorial: tutorial,
            data: tutorialData,
            html: html,
            path: tutorialPath
        });
    }

    var raw_docs = data().get(); // <-- an array of Doclet objects


    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node, level) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial', level, child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child, level + 1);
        });
    }
    saveChildren(tutorials, 1);

    var outputDir = path.normalize(opts.destination);

    var root = {
        summary: summary,
        raw_docs: raw_docs,
        tut_docs: tut_docs,
        members: members,
        files: files,
        packages: packages,
        nav: nav,
        conf: conf,
        JSDocEnvironment: env,
        scopeToPunctuationLUT: helper.scopeToPunc,
        longnameToUrlLUT: helper.longnameToUrl,
        containersLUT: helper.containers,
        templatePath: templatePath,
        indexUrl: indexUrl,
        globalUrl: globalUrl,
        sourceFiles: sourceFiles,
        sourceFilePaths: sourceFilePaths,
        packageInfo: packageInfo,
        outdir: outdir,
        outputDir: outputDir
    };

    return root;
};


/**
 * @param {TAFFY} taffyData See <http://taffydb.com/>.
 * @param {object} opts
 * @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    summary = [];

    // collect the whole shebang and then some...
    var root = regurgitate(taffyData, opts, tutorials);

    // ...and then go and dump it into a file or output it on the `stdout` pipe/console.
    if (opts.destination === 'console') {
        console.log( JSON.stringify(root, null, 4) );
    }
    else {
        var outputFormat = opts.query && opts.query.format === 'xml' ? 'xml' : 'json';
        var outputDir = root.outputDir;

        fs.mkPath(outputDir);

        fs.writeFileSync(path.join(outputDir, "JSDoc.RAW" + "." + outputFormat),
                outputFormat === 'json' ? JSON.stringify(root, null, 4) :  xml('jsdoc', root),
                'utf8');
    }
};
