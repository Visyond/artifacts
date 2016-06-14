/**
    @module plugins/containment
    @author Ger Hobbelt <ger@hobbelt.com>
 */
'use strict';

var logger = require('jsdoc/util/logger');

var nestingLevel = 0;

exports.defineTags = function(dictionary) {
    dictionary.defineTag('{', {
        mustHaveValue: false,
        canHaveValue: true,
        canHaveType: false,
        canHaveName: false,
        onTagged: function(doclet, tag) {
            // console.log("STARTREGION: ", arguments);
            doclet.startRegion = tag;
            // hack to make it get through in unpatched JSDoc
            // doclet.name = doclet.name || '~~~startregion~~~';
            doclet.kind = doclet.kind || '~~~regionmarker~~~';

            ++nestingLevel;
            doclet.regionNestingLevel = nestingLevel;
            doclet.regionMarkStart = true;

            // Do *not() push this one immediately as we want JSDoc to merge this one with the
            // next function / namespace / ... into a single doclet!
            //
            //     doclet.pushImmediately = true;

            // try {
            //     throw new Error("kaboom!");
            // } catch (ex) {
            //     console.log("stack: ", ex.stack);
            // }
        }
    });
    dictionary.defineTag('}', {
        mustHaveValue: false,
        canHaveValue: true,
        canHaveType: false,
        canHaveName: false,
        onTagged: function(doclet, tag) {
            // console.log("ENDREGION: ", arguments);
            doclet.endRegion = tag;
            // hack to make it get through in unpatched JSDoc
            // doclet.name = doclet.name || '~~~endregion~~~';
            doclet.kind = doclet.kind || '~~~regionmarker~~~';

            // Push this doclet *immediately*: it stands on its own and will be filtered out
            // once the entire parse process (and our own doclet stream postprocessing) is done.
            doclet.pushImmediately = true;

            nestingLevel--;
            doclet.regionNestingLevel = nestingLevel;
            doclet.regionMarkEnd = true;

            // try {
            //     throw new Error("kaboom!");
            // } catch (ex) {
            //     console.log("stack: ", ex.stack);
            // }
        }
    });
};

exports.handlers = {
    /**
        Support `@{` and `@}` tags: everything within these two will be assigned a member of the
        given document node (namespace, class, ...) if they aren't already.
     */
    newDoclet: function(e) {
        // console.log("DOCLET: ", arguments);
        var tags = e.doclet.tags,
            tag,
            value;

        // any user-defined tags in this doclet?
        if (typeof tags !== 'undefined') {
            // only interested in the @source tags
            tags = tags.filter(function($) {
                return $.title === '{' || $.title === '}';
            });

            if (tags.length) {
                // console.log("region markers: ", tags);

                // // take the first one
                // tag = tags[0];

                // e.doclet.meta = e.doclet.meta || {};
                // e.doclet.meta.filename = value.filename || '';
                // e.doclet.meta.lineno = value.lineno || '';
            }
        }
    },

    fileComplete: function(e) {
        // console.log("fileComplete: ", arguments);
    },

    parseComplete: function(e) {
        console.log("parseComplete: ", JSON.stringify(arguments, null, 2));
        var doclets = e.doclets;
        var sourcefile;
        var i, len, doclet, range;
        var stack = [];

        // first link region end markers to their matching region start markers.
        // 
        // complain loudly when there are holes and/or unmatched markers.
        for (i = 0, len = doclets.length; i < len; i++) {
            doclet = doclets[i];
            // close previous topmost region. 
            // 
            // Both `@}` and `@{` CANNOT exist in a single doclet as that would cause the start/end
            // linkup code in here to become more complicated, so we reject that situation.
            // 
            // A future addition considered for this plugin is the `@{}` tag which
            // then should signal the parser that everything with the next code brace/brackets level
            // is a region and the comment writer doesn't want to bother with replicating that
            // knowledge in the comments. This should cover AMD/UMD/CommonJS and other kinds of
            // 'code wrappers' pretty nicely in a 'shorthand' sort of way; until we introduce that
            // token is added to this plugin, we only have `@{` to start a region, then some code
            // chunks and probably some more comment doclets in there, terminated by a separate
            // comment (= doclet) which terminates that region: `@}`.
            // 
            // Hence there's only one way to use these correctly together in a single comment/doclet:
            // first close the old region, then go and open a new one.
            // 
            // Example:
            // 
            // ```
            // /*
            //  * @}
            //  *
            //  * And 'nother fresh region to hang the next set of functions, etc. under...
            //  * bla bla bla
            //  *
            //  * @class MrFusspot
            //  * @{
            //  */
            // var MrFusspot = (function (){
            //   return {
            //     /**
            //      * walk the darn dog.
            //      *
            //      * @member
            //      * @public
            //      * Thanks to `@{`...`@}` this member should be auto-memberof-ed to `MrFusspot`
            //      * despite the slightly odd way of coding this class.
            //      */
            //     TakesWalkies: function (poopoo) { ... }
            //   };
            // )();
            // ```
            // 
            if (doclet.regionMarkEnd) {
                if (doclet.regionMarkStart) {
                    console.error("both @{ and @} CANNOT co-exist in a single doclet comment. Failure at " + doclet.meta.lineno + " in " + doclet.meta.path);
                if (doclet.regionNestingLevel <= 0) {
                    console.error("unmatched @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + ": missing matching @{");
                } else if (doclet.matchingRegionStartMarker) {
                    console.error("INTERNAL ERROR? @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + " has already been linked up to a previous start marker!?");
                } else if (stack[doclet.regionNestingLevel]) {
                    // double-linked start to end and vice versa
                    doclet.matchingRegionStartMarker = stack[doclet.regionNestingLevel];
                    stack[doclet.regionNestingLevel].matchingRegionEndMarker = doclet;

                    // now nuke the tracking slot so we cannot link the start marker to a later erroneously unmatched end marker at the same level:
                    stack[doclet.regionNestingLevel] = undefined;
                } else {
                    console.error("unmatched @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + ": no matching @{ found");
                }
            } 
            // start a new (sub)region
            if (doclet.regionMarkStart) {
                if (doclet.regionNestingLevel <= 0) {
                    console.error("cannot match corrupted @{ ... @} range start/end tag sequences due to previous error in @{ ... @} matching before line " + doclet.meta.lineno + " in " + doclet.meta.path);
                } else if (doclet.matchingRegionEndMarker) {
                    console.error("INTERNAL ERROR? @} range start tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + " has already been linked up to a PREVIOUS end marker!?");
                } else if (stack[doclet.regionNestingLevel]) {
                    console.error("unmatched @{ range end tag at line " + stack[doclet.regionNestingLevel].meta.lineno + " in " + stack[doclet.regionNestingLevel].meta.path + ": no matching @} found");
                } else {
                    stack[doclet.regionNestingLevel] = doclet;
                }
            }
        }

        // last check before we go and do something useful: any lingering start markers are dangling:
        for (i = 0, len = stack.length; i < len; i++) {
            if (stack[i]) {
                console.error("unmatched @{ range start tag at line " + stack[i].meta.lineno + " in " + stack[i].meta.path + ": no matching @} found");
            }
        }

        // now postprocess all doclets between a set of region markers:
        var region;
        for (i = 0, len = doclets.length; i < len; i++) {
            doclet = doclets[i];
            if (doclet.regionMarkStart) {
                region = stack[doclet.regionNestingLevel] = doclet;

                x    




                if (doclet.regionNestingLevel <= 0) {
                    console.error("unmatched @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + ": missing matching @{");
                } else if (doclet.matchingRegionStartMarker) {
                    console.error("INTERNAL ERROR? @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + " has already been linked up to a previous start marker!?");
                } else if (stack[doclet.regionNestingLevel]) {
                    doclet.matchingRegionStartMarker = stack[doclet.regionNestingLevel];
                    stack[doclet.regionNestingLevel].matchingRegionEndMarker = doclet;
                    // now nuke the tracking slot so we cannot link the start marker to a later erroneously unmatched end marker at the same level:
                    stack[doclet.regionNestingLevel] = undefined;
                } else {
                    console.error("unmatched @} range end tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + ": no matching @{ found");
                }
            } 
            // start a new (sub)region
            if (doclet.regionMarkStart) {
                if (doclet.regionNestingLevel <= 0) {
                    console.error("cannot match corrupted @{ ... @} range start/end tag sequences due to previous error in @{ ... @} matching before line " + doclet.meta.lineno + " in " + doclet.meta.path);
                } else if (doclet.matchingRegionEndMarker) {
                    console.error("INTERNAL ERROR? @} range start tag at line " + doclet.meta.lineno + " in " + doclet.meta.path + " has already been linked up to a PREVIOUS end marker!?");
                } else if (stack[doclet.regionNestingLevel]) {
                    console.error("unmatched @{ range end tag at line " + stack[doclet.regionNestingLevel].meta.lineno + " in " + stack[doclet.regionNestingLevel].meta.path + ": no matching @} found");
                } else {
                    stack[doclet.regionNestingLevel] = doclet;
                }
            }
        }


            // hook 'member-of-anonymous' doclets up to the topmost region level:
            if () 
        }
    }
};
