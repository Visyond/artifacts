
/* description: Parses end executes mathematical expressions. */

/* operator associations and precedence */

%{
        // WARNING: using relative paths in require() statements here is pretty darn dangerous as this file
        // will generally be compiled to JS in another directory, which would thus alter the '.' relative
        // path position.
        //
        // Ditto for tricks such as `__dirname + 'my-path'` as, again, `__dirname` would be determined
        // by the time when this grammar file has already been compiled into a JS file elsewhere in
        // the filesystem.
        //
        // We check the 'actual path' by running `require(__dirname + '/fixtures/includetest.js')`,
        // have it fail and then check what the proper relative path prefix SHOULD have been:
        // enable the first `require()` statement to start this process; then adjust the second
        // statement to make that one load the proper file.
        
        // var ast = require(__dirname + '/fixtures/includetest.js');  
        // --> Error: Cannot find module 'W:\Users\Ger\Projects\sites\library.visyond.gov\80\lib\tooling\gulp-jison\node_modules\jison-gho\lib/fixtures/includetest.js'
        
        // hence: `../../../test/` as path prefix:
        var ast = require('../../../test/fixtures/includetest.js');
%}

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%right '%'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { typeof console !== 'undefined' ? console.log($1) : print($1);
          return $1; }
    ;

e
    : e '+' e
        {$$ = $1+$3;}
    | e '-' e
        {$$ = $1-$3;}
    | e '*' e
        {$$ = $1*$3;}
    | e '/' e
        {$$ = $1/$3;}
    | e '^' e
        {$$ = Math.pow($1, $3);}
    | e '!'
        {{
          $$ = (function fact (n) { return n==0 ? 1 : fact(n-1) * n })($1);
        }}
    | e '%'
        {$$ = $1/100;}
    | '-' e %prec UMINUS
        {$$ = -$2;}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = Number(yytext);}
    | E
        {$$ = Math.E;}
    | PI
        {$$ = Math.PI;}
    ;

%%
