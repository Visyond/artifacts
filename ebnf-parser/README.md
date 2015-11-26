# ebnf-parser

A parser for BNF and EBNF grammars used by jison.


## install

    npm install ebnf-parser


## build

To build the parser yourself, clone the git repo then run:

    make

This will generate `parser.js`, which is required by `ebnf-parser.js`.


## usage

The parser translates a string grammar or JSON grammar into a JSON grammar that jison can use (ENBF is transformed into BNF).

    var ebnfParser = require('ebnf-parser');

    // parse a bnf or ebnf string grammar
    ebnfParser.parse("%start ... %");

    // transform an ebnf JSON gramamr
    ebnfParser.transform({"ebnf": ...});


## example grammar

The parser can parse its own BNF grammar, shown below:

```
%start spec

/* grammar for parsing jison grammar files */

%{
var transform = require('./ebnf-transform').transform;
var ebnf = false;
%}

%%

spec
    : declaration_list '%%' grammar optional_end_block EOF
        {
            $$ = $declaration_list;
            if ($optional_end_block && $optional_end_block.trim() !== '') {
                yy.addDeclaration($$, { include: $optional_end_block });
            }
            return extend($$, $grammar);
        }
    ;

optional_end_block
    :
    | '%%' extra_parser_module_code 
        { $$ = $extra_parser_module_code; }
    ;

optional_action_header_block
    :
        { $$ = {}; }
    | optional_action_header_block ACTION
        {
            $$ = $optional_action_header_block;
            yy.addDeclaration($$, { actionInclude: $ACTION });
        }
    | optional_action_header_block include_macro_code
        {
            $$ = $optional_action_header_block;
            yy.addDeclaration($$, { actionInclude: $include_macro_code });
        }
    ;

declaration_list
    : declaration_list declaration
        { $$ = $declaration_list; yy.addDeclaration($$, $declaration); }
    |
        { $$ = {}; }
    ;

declaration
    : START id
        { $$ = {start: $id}; }
    | LEX_BLOCK
        { $$ = {lex: $LEX_BLOCK}; }
    | operator
        { $$ = {operator: $operator}; }
    | TOKEN full_token_definitions
        { $$ = {token_list: $full_token_definitions}; }
    | ACTION
        { $$ = {include: $ACTION}; }
    | include_macro_code
        { $$ = {include: $include_macro_code}; }
    | parse_param
        { $$ = {parseParam: $parse_param}; }
    | parser_type
        { $$ = {parserType: $parser_type}; }
    | options
        { $$ = {options: $options}; }
    ;

options
    : OPTIONS token_list
        { $$ = $token_list; }
    ;

parse_param
    : PARSE_PARAM token_list
        { $$ = $token_list; }
    ;

parser_type
    : PARSER_TYPE symbol
        { $$ = $symbol; }
    ;
    
operator
    : associativity token_list
        { $$ = [$associativity]; $$.push.apply($$, $token_list); }
    ;

associativity
    : LEFT
        { $$ = 'left'; }
    | RIGHT
        { $$ = 'right'; }
    | NONASSOC
        { $$ = 'nonassoc'; }
    ;

token_list
    : token_list symbol
        { $$ = $token_list; $$.push($symbol); }
    | symbol
        { $$ = [$symbol]; }
    ;

full_token_definitions
    : full_token_definitions full_token_definition
        { $$ = $full_token_definitions; $$.push($full_token_definition); }
    | full_token_definition
        { $$ = [$full_token_definition]; }
    ;

// As per http://www.gnu.org/software/bison/manual/html_node/Token-Decl.html
full_token_definition
    : optional_token_type id optional_token_value optional_token_description
        {
            $$ = {id: $id};
            if ($optional_token_type) {
                $$.type = $optional_token_type;
            }
            if ($optional_token_value) {
                $$.value = $optional_token_value;
            }
            if ($optional_token_description) {
                $$.description = $optional_token_description;
            }
        }
    ;

optional_token_type
    : /* epsilon */
        { $$ = false; }
    | TOKEN_TYPE
    ;

optional_token_value
    : /* epsilon */
        { $$ = false; }
    | INTEGER
    ;

optional_token_description
    : /* epsilon */
        { $$ = false; }
    | STRING
    ;

id_list
    : id_list id
        { $$ = $id_list; $$.push($id); }
    | id
        { $$ = [$id]; }
    ;

token_id
    : TOKEN_TYPE id
        { $$ = $id; }
    | id
        { $$ = $id; }
    ;

grammar
    : optional_action_header_block production_list
        {
            $$ = $optional_action_header_block;
            $$.grammar = $production_list;
        }
    ;

production_list
    : production_list production
        {
            $$ = $production_list;
            if ($production[0] in $$) {
                $$[$production[0]] = $$[$production[0]].concat($production[1]);
            } else {
                $$[$production[0]] = $production[1];
            }
        }
    | production
        { $$ = {}; $$[$production[0]] = $production[1]; }
    ;

production
    : id ':' handle_list ';'
        {$$ = [$id, $handle_list];}
    ;

handle_list
    : handle_list '|' handle_action
        {
            $$ = $handle_list;
            $$.push($handle_action);
        }
    | handle_action
        {
            $$ = [$handle_action];
        }
    ;

handle_action
    : handle prec action
        {
            $$ = [($handle.length ? $handle.join(' ') : '')];
            if ($action) {
                $$.push($action);
            }
            if ($prec) {
                $$.push($prec);
            }
            if ($$.length === 1) {
                $$ = $$[0];
            }
        }
    ;

handle
    : handle expression_suffix
        {
            $$ = $handle;
            $$.push($expression_suffix);
        }
    |
        {
            $$ = [];
        }
    ;

handle_sublist
    : handle_sublist '|' handle
        {
            $$ = $handle_sublist;
            $$.push($handle.join(' '));
        }
    | handle
        {
            $$ = [$handle.join(' ')];
        }
    ;

expression_suffix
    : expression suffix ALIAS
        {
            $$ = $expression + $suffix + "[" + $ALIAS + "]";
        }
    | expression suffix
        {
            $$ = $expression + $suffix;
        }
    ;

expression
    : ID
        {
            $$ = $ID;
        }
    | STRING
        {
            $$ = ebnf ? "'" + $STRING + "'" : $STRING;
        }
    | '(' handle_sublist ')'
        {
            $$ = '(' + $handle_sublist.join(' | ') + ')';
        }
    ;

suffix
    : /* epsilon */
        { $$ = ''; }
    | '*'
    | '?'
    | '+'
    ;

prec
    : PREC symbol
        {
            $$ = { prec: $symbol };
        }
    |
        {
            $$ = null;
        }
    ;

symbol
    : id
        { $$ = $id; }
    | STRING
        { $$ = $STRING; }
    ;

id
    : ID
        { $$ = $ID; }
    ;

action
    : '{' action_body '}'
        { $$ = $action_body; }
    | ACTION
        { $$ = $ACTION; }
    | include_macro_code
        { $$ = $include_macro_code; }
    | ARROW_ACTION
        { $$ = '$$ =' + $ARROW_ACTION + ';'; }
    |
        { $$ = ''; }
    ;

action_body
    :
        { $$ = ''; }
    | action_comments_body
        { $$ = $action_comments_body; }
    | action_body '{' action_body '}' action_comments_body
        { $$ = $1 + $2 + $3 + $4 + $5; }
    | action_body '{' action_body '}'
        { $$ = $1 + $2 + $3 + $4; }
    ;

action_comments_body
    : ACTION_BODY
        { $$ = $ACTION_BODY; }
    | action_comments_body ACTION_BODY
        { $$ = $action_comments_body + $ACTION_BODY; }
    ;

extra_parser_module_code
    : optional_module_code_chunk
        { $$ = $optional_module_code_chunk; }
    | optional_module_code_chunk include_macro_code extra_parser_module_code
        { $$ = $optional_module_code_chunk + $include_macro_code + $extra_parser_module_code; }
    ;

include_macro_code
    : INCLUDE PATH
        { 
            var fs = require('fs');
            var fileContent = fs.readFileSync($PATH, { encoding: 'utf-8' });
            // And no, we don't support nested '%include':
            $$ = '\n// Included by Jison: ' + $PATH + ':\n\n' + fileContent + '\n\n// End Of Include by Jison: ' + $PATH + '\n\n';
        }
    | INCLUDE error
        { 
            console.error("%include MUST be followed by a valid file path"); 
        }
    ;

module_code_chunk
    : CODE
        { $$ = $CODE; }
    | module_code_chunk CODE
        { $$ = $module_code_chunk + $CODE; }
    ;

optional_module_code_chunk
    : module_code_chunk
        { $$ = $module_code_chunk; }
    | /* nil */
        { $$ = ''; }
    ;

%%

// transform ebnf to bnf if necessary
function extend(json, grammar) {
    json.bnf = ebnf ? transform(grammar.grammar) : grammar.grammar;
    if (grammar.actionInclude) {
        json.actionInclude = grammar.actionInclude;
    }
    return json;
}
```


## license

MIT
