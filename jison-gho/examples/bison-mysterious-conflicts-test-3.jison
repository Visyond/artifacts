/*
 * From the bison docs @ http://www.gnu.org/software/bison/manual/html_node/Mysterious-Conflicts.html#Mysterious-Conflicts: 
 * 
 * >
 * > 5.7 Mysterious Conflicts
 * > 
 * > Sometimes reduce/reduce conflicts can occur that don’t look warranted. Here is an example:
 * > 
 * > ``` 
 * > %%
 * > def: param_spec return_spec ',';
 * > param_spec:
 * >   type
 * > | name_list ':' type
 * > ;
 * > return_spec:
 * >   type
 * > | name ':' type
 * > ;
 * > type: "id";
 * > 
 * > name: "id";
 * > name_list:
 * >   name
 * > | name ',' name_list
 * > ;
 * > ``` 
 * >  
 * > It would seem that this grammar can be parsed with only a single token of lookahead: 
 * > when a param_spec is being read, an "id" is a name if a comma or colon follows, 
 * > or a type if another "id" follows. In other words, this grammar is LR(1).
 * > 
 * > However, for historical reasons, Bison cannot by default handle all LR(1) grammars. 
 * > In this grammar, two contexts, that after an "id" at the beginning of a param_spec 
 * > and likewise at the beginning of a return_spec, are similar enough that Bison 
 * > assumes they are the same. They appear similar because the same set of rules 
 * > would be active—the rule for reducing to a name and that for reducing to a type. 
 * > Bison is unable to determine at that stage of processing that the rules would 
 * > require different lookahead tokens in the two contexts, so it makes a single 
 * > parser state for them both. Combining the two contexts causes a conflict later. 
 * > In parser terminology, this occurrence means that the grammar is not LALR(1).
 * > 
 * > For many practical grammars (specifically those that fall into the non-LR(1) 
 * > class), the limitations of LALR(1) result in difficulties beyond just mysterious 
 * > reduce/reduce conflicts. The best way to fix all these problems is to select 
 * > a different parser table construction algorithm. Either IELR(1) or canonical 
 * > LR(1) would suffice, but the former is more efficient and easier to debug 
 * > during development. See LR Table Construction, for details. (Bison’s IELR(1) 
 * > and canonical LR(1) implementations are experimental. More user feedback will 
 * > help to stabilize them.)
 * > 
 * > If you instead wish to work around LALR(1)’s limitations, you can often 
 * > fix a mysterious conflict by identifying the two parser states that are being 
 * > confused, and adding something to make them look distinct. In the above example, 
 * > adding one rule to return_spec as follows makes the problem go away:
 * > 
 * > ``` 
 * > …
 * > return_spec:
 * >   type
 * > | name ':' type
 * > | "id" "bogus"       // This rule is never used.  
 * > ;
 * > ``` 
 * > 
 * > This corrects the problem because it introduces the possibility of an 
 * > additional active rule in the context after the "id" at the beginning of 
 * > return_spec. This rule is not active in the corresponding context in a 
 * > param_spec, so the two contexts receive distinct parser states. As long as 
 * > the token "bogus" is never generated by yylex, the added rule cannot alter 
 * > the way actual input is parsed.
 * > 
 * > In this particular example, there is another way to solve the problem: 
 * > rewrite the rule for return_spec to use "id" directly instead of via name. 
 * > This also causes the two confusing contexts to have different sets of active 
 * > rules, because the one for return_spec activates the altered rule for 
 * > return_spec rather than the one for name.
 * > 
 * > ``` 
 * > param_spec:
 * >   type
 * > | name_list ':' type
 * > ;
 * > return_spec:
 * >   type
 * > | "id" ':' type
 * > ;
 * > ``` 
 * >  
 * > For a more detailed exposition of LALR(1) parsers and parser generators, see DeRemer 1982.
 * >
 */


%options module-name=bison_bugger


%lex

%options ranges

%%

\s+                   /* skip whitespace */
[a-z]                 return 'ID';
';'                   return ';';
':'                   return ':';
','                   return ',';
'+'                   return '+';
'-'                   return '-';
'='                   return '=';
.                     return 'ERROR';

/lex




%token ID

%%

def: 
      param_spec return_spec ','
    ;

param_spec:
      type
    | name_list ':' type
    ;

return_spec:
      type
    | ID ':' type
    ;

type: ID
    ;

name: ID
    ;

name_list:
      name
    | name ',' name_list
    ;

%%

// feature of the GH fork: specify your own main.
//
// compile with
// 
//      jison -o test.js --main that/will/be/me.jison
//
// then run
//
//      node ./test.js
//
// to see the output.

var assert = require("assert");

parser.main = function () {
    var rv = parser.parse('a+b');
    console.log("test #1: 'a+b' ==> ", rv, parser.yy);
    assert.equal(rv, '+aDabX:a');

    rv = parser.parse('a-b');
    console.log("test #2: 'a-b' ==> ", rv);
    assert.equal(rv, 'XE');

    console.log("\nAnd now the failing inputs: even these deliver a result:\n");

    // set up an aborting error handler which does not throw an exception
    // but returns a special parse 'result' instead:
    var errmsg = null;
    var errReturnValue = '@@@';
    parser.yy.parseError = function (msg, hash) {
        errmsg = msg;
        return errReturnValue + (hash.parser ? hash.value_stack.slice(0, hash.stack_pointer).join('.') : '???');
    };

    rv = parser.parse('aa');
    console.log("test #3: 'aa' ==> ", rv);
    assert.equal(rv, '@@@.T.a');

    rv = parser.parse('a');
    console.log("test #4: 'a' ==> ", rv);
    assert.equal(rv, '@@@.a');

    rv = parser.parse(';');
    console.log("test #5: ';' ==> ", rv);
    assert.equal(rv, '@@@');

    rv = parser.parse('?');
    console.log("test #6: '?' ==> ", rv);
    assert.equal(rv, '@@@');

    rv = parser.parse('a?');
    console.log("test #7: 'a?' ==> ", rv);
    assert.equal(rv, '@@@.a');

    // if you get past the assert(), you're good.
    console.log("tested OK");
};

