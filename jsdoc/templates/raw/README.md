OVERVIEW
========

JSDoc 3 RAW is an experimental / diagnostic template which produces all data produced by JSDoc3 in JSON, together with some preliminary diagnostics reporting regarding documentation coverage, i.e. which functions, classes, etc. in your source code are or are not documented yet, so that you can find out:

- iff JSDoc3 discovered all your current doc comments yet (the default and haruki templates can silently ignore some stuff, or so it may seem),

- what JSDoc3 believes about the various doc comments it has found in conjunction with the source code itself: which functions, properties, variables, classes, etc. it discovered in your code but hasn't linked to any documentation bits yet.


Note: `@link`s will appear in the output untransformed, there is no way to know at this stage what the file layout of your output will eventually be. It is assumed that whatever process emits the final output file/s will transform `@link` tags at that point.


### Why name it `RAW`?

This template acts a lot like 'camera RAW' output from cameras, where tools such as Photoshop provide special tools for processing 'RAW format' image files so users can extract and use the maximum amount of image data/information gathered by the camera when you took the shot: extra color depth per pixel, etc. which would not be available in the regular image file formats.

This template serves exactly the same purpose: we produce a 'RAW' from the JSDoc process so that you can use it to *maximum effect*; this contrasts with the other templates (default & haruki) which restrict the amount of accessible data and thus limit your options in working with the JSDoc3-gathered 'image' of your source code. 



USAGE
=====

    ./jsdoc myscript.js -t templates/raw -d console

The results of this command will appear in `stdout` and can be piped into other tools for further processing.

When you specify a name or path as destination, it will be assumed to be a directory *unless* you have included the `.json` extension in which case the destination path will be treated as the destination file name.

When the destination file name is not provided, the file name will be constructed from the first source file's name, without the file name extension, after sorting the source file list alphabetically, appended by `.jsdoc-RAW.json`. 

Hence

    ./jsdoc src/myscript.js -t templates/raw -d doc-diag

will save the 'RAW' JSDoc data image to the file at `doc-diag/myscript.jsdoc-RAW.json`. 



MORE
=====

If you are interested in RAW, you are encouraged to discuss your questions or ideas on the JSDoc-Users mailing list and fork/contribute to this project.

For more information contact Michael Mathews at <micmath+haruki@gmail.com>.
