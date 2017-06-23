(function () {

// See also:
// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
// but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
// with userland code which might access the derived class in a 'classic' way.
function JisonParserError(msg, hash) {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonParserError'
    });

    if (msg == null) msg = '???';

    Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: msg
    });

    this.hash = hash;

    var stacktrace;
    if (hash && hash.exception instanceof Error) {
        var ex2 = hash.exception;
        this.message = ex2.message || msg;
        stacktrace = ex2.stack;
    }
    if (!stacktrace) {
        if (Error.hasOwnProperty('captureStackTrace')) { // V8
            Error.captureStackTrace(this, this.constructor);
        } else {
            stacktrace = (new Error(msg)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }
}

if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(JisonParserError.prototype, Error.prototype);
} else {
    JisonParserError.prototype = Object.create(Error.prototype);
}
JisonParserError.prototype.constructor = JisonParserError;
JisonParserError.prototype.name = 'JisonParserError';




// helper: reconstruct the productions[] table
function bp(s) {
    var rv = [];
    var p = s.pop;
    var r = s.rule;
    for (var i = 0, l = p.length; i < l; i++) {
        rv.push([
            p[i],
            r[i]
        ]);
    }
    return rv;
}





// helper: reconstruct the 'goto' table
function bt(s) {
    var rv = [];
    var d = s.len;
    var y = s.symbol;
    var t = s.type;
    var a = s.state;
    var m = s.mode;
    var g = s.goto;
    for (var i = 0, l = d.length; i < l; i++) {
        var n = d[i];
        var q = {};
        for (var j = 0; j < n; j++) {
            var z = y.shift();
            switch (t.shift()) {
            case 2:
                q[z] = [
                    m.shift(),
                    g.shift()
                ];
                break;

            case 0:
                q[z] = a.shift();
                break;

            default:
                // type === 1: accept
                q[z] = [
                    3
                ];
            }
        }
        rv.push(q);
    }
    return rv;
}



// helper: runlength encoding with increment step: code, length: step (default step = 0)
// `this` references an array
function s(c, l, a) {
    a = a || 0;
    for (var i = 0; i < l; i++) {
        this.push(c);
        c += a;
    }
}

// helper: duplicate sequence from *relative* offset and length.
// `this` references an array
function c(i, l) {
    i = this.length - i;
    for (l += i; i < l; i++) {
        this.push(this[i]);
    }
}

// helper: unpack an array using helpers and data, all passed in an array argument 'a'.
function u(a) {
    var rv = [];
    for (var i = 0, l = a.length; i < l; i++) {
        var e = a[i];
        // Is this entry a helper function?
        if (typeof e === 'function') {
            i++;
            e.apply(rv, a[i]);
        } else {
            rv.push(e);
        }
    }
    return rv;
}


var parser = {
    // Code Generator Information Report
    // ---------------------------------
    //
    // Options:
    //
    //   no default action: ............... 1
    //   no try..catch: ................... false
    //   no default resolve on conflict:    false
    //   on-demand look-ahead: ............ false
    //   error recovery token skip maximum: 3
    //   debug grammar/output: ............ 0
    //   has partial LR conflict upgrade:   true
    //   rudimentary token-stack support:   false
    //   parser table compression mode: ... 2
    //   export debug tables: ............. 0
    //   export *all* tables: ............. false
    //   module type: ..................... commonjs
    //   parser engine type: .............. lalr
    //   output main() in the module: ..... false
    //
    //
    // Parser Analysis flags:
    //
    //   all actions are default: ......... true
    //   uses yyleng: ..................... false
    //   uses yylineno: ................... false
    //   uses yytext: ..................... false
    //   uses yylloc: ..................... false
    //   uses ParseError API: ............. false
    //   uses YYERROR: .................... false
    //   uses YYRECOVERING: ............... false
    //   uses YYERROK: .................... false
    //   uses YYCLEARIN: .................. false
    //   tracks rule values: .............. false
    //   assigns rule values: ............. false
    //   uses location tracking: .......... false
    //   assigns location: ................ false
    //   uses yystack: .................... false
    //   uses yysstack: ................... false
    //   uses yysp: ....................... false
    //   has error recovery: .............. true
    //
    // --------- END OF REPORT -----------

trace: function no_op_trace() { },
JisonParserError: JisonParserError,
yy: {},
options: {
  type: "lalr",
  hasPartialLrUpgradeOnConflict: true,
  errorRecoveryTokenDiscardCount: 3
},
symbols_: {
  "$accept": 0,
  "$end": 1,
  "EOF": 1,
  "ZZ": 3,
  "error": 2,
  "seq": 4
},
terminals_: {
  1: "EOF",
  2: "error",
  3: "ZZ"
},
TERROR: 2,
EOF: 1,

// internals: defined here so the object *structure* doesn't get modified by parse() et al,
// thus helping JIT compilers like Chrome V8.
originalQuoteName: null,
originalParseError: null,
cleanupAfterParse: null,
constructParseErrorInfo: null,

__reentrant_call_depth: 0,      // INTERNAL USE ONLY
__error_infos: [],              // INTERNAL USE ONLY: the set of parseErrorInfo objects created since the last cleanup

// APIs which will be set up depending on user action code analysis:
//yyRecovering: 0,
//yyErrOk: 0,
//yyClearIn: 0,

// Helper APIs
// -----------

// Helper function which can be overridden by user code later on: put suitable quotes around
// literal IDs in a description string.
quoteName: function parser_quoteName(id_str) {
    return '"' + id_str + '"';
},

// Return a more-or-less human-readable description of the given symbol, when available,
// or the symbol itself, serving as its own 'description' for lack of something better to serve up.
//
// Return NULL when the symbol is unknown to the parser.
describeSymbol: function parser_describeSymbol(symbol) {
    if (symbol !== this.EOF && this.terminal_descriptions_ && this.terminal_descriptions_[symbol]) {
        return this.terminal_descriptions_[symbol];
    }
    else if (symbol === this.EOF) {
        return 'end of input';
    }
    else if (this.terminals_[symbol]) {
        return this.quoteName(this.terminals_[symbol]);
    }
    // Otherwise... this might refer to a RULE token i.e. a non-terminal: see if we can dig that one up.
    //
    // An example of this may be where a rule's action code contains a call like this:
    //
    //      parser.describeSymbol(#$)
    //
    // to obtain a human-readable description or name of the current grammar rule. This comes handy in
    // error handling action code blocks, for example.
    var s = this.symbols_;
    for (var key in s) {
        if (s[key] === symbol) {
            return key;
        }
    }
    return null;
},

// Produce a (more or less) human-readable list of expected tokens at the point of failure.
//
// The produced list may contain token or token set descriptions instead of the tokens
// themselves to help turning this output into something that easier to read by humans
// unless `do_not_describe` parameter is set, in which case a list of the raw, *numeric*,
// expected terminals and nonterminals is produced.
//
// The returned list (array) will not contain any duplicate entries.
collect_expected_token_set: function parser_collect_expected_token_set(state, do_not_describe) {
    var TERROR = this.TERROR;
    var tokenset = [];
    var check = {};
    // Has this (error?) state been outfitted with a custom expectations description text for human consumption?
    // If so, use that one instead of the less palatable token set.
    if (!do_not_describe && this.state_descriptions_ && this.state_descriptions_[state]) {
        return [
            this.state_descriptions_[state]
        ];
    }
    for (var p in this.table[state]) {
        p = +p;
        if (p !== TERROR) {
            var d = do_not_describe ? p : this.describeSymbol(p);
            if (d && !check[d]) {
                tokenset.push(d);
                check[d] = true;        // Mark this token description as already mentioned to prevent outputting duplicate entries.
            }
        }
    }
    return tokenset;
},
productions_: bp({
  pop: u([
  s,
  [4, 3]
]),
  rule: u([
  0,
  2,
  2
])
}),
table: bt({
  len: u([
  4,
  s,
  [3, 3]
]),
  symbol: u([
  s,
  [1, 4, 1],
  c,
  [4, 3],
  c,
  [3, 6]
]),
  type: u([
  s,
  [2, 3],
  0,
  1,
  s,
  [2, 8]
]),
  state: u([
  1
]),
  mode: u([
  s,
  [2, 3],
  1,
  1,
  s,
  [2, 6]
]),
  goto: u([
  s,
  [1, 3],
  3,
  s,
  [2, 4],
  s,
  [3, 3]
])
}),
defaultActions: {
  0: 1,
  2: 2,
  3: 3
},
parseError: function parseError(str, hash, ExceptionClass) {
    if (hash.recoverable) {
        this.trace(str);
        hash.destroy();             // destroy... well, *almost*!
    } else {
        throw new ExceptionClass(str, hash);
    }
},
parse: function parse(input) {
    var self = this,
        stack = new Array(128),         // token stack: stores token which leads to state at the same index (column storage)
        sstack = new Array(128),        // state stack: stores states (column storage)



        table = this.table,
        sp = 0;                         // 'stack pointer': index into the stacks

    var recovering = 0;                 // (only used when the grammar contains error recovery rules)
    var TERROR = this.TERROR,
        EOF = this.EOF,
        ERROR_RECOVERY_TOKEN_DISCARD_COUNT = (this.options.errorRecoveryTokenDiscardCount | 0) || 3;
    var NO_ACTION = [0, table.length /* ensures that anyone using this new state will fail dramatically! */];

    //this.reductionCount = this.shiftCount = 0;

    var lexer;
    if (this.__lexer__) {
        lexer = this.__lexer__;
    } else {
        lexer = this.__lexer__ = Object.create(this.lexer);
    }

    var sharedState_yy = {
        parseError: null,
        quoteName: null,
        lexer: null,
        parser: null,
        pre_parse: null,
        post_parse: null
    };
    // copy state
    for (var k in this.yy) {
      if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
        sharedState_yy[k] = this.yy[k];
      }
    }

    sharedState_yy.lexer = lexer;
    sharedState_yy.parser = this;






    lexer.setInput(input, sharedState_yy);




    sstack[sp] = 0;
    stack[sp] = 0;
    ++sp;


    // Does the shared state override the default `parseError` that already comes with this instance?
    if (typeof sharedState_yy.parseError === 'function') {
        this.parseError = function parseErrorAlt(str, hash, ExceptionClass) {
            return sharedState_yy.parseError(str, hash, ExceptionClass);
        };
    } else {
        this.parseError = this.originalParseError;
    }

    // Does the shared state override the default `quoteName` that already comes with this instance?
    if (typeof sharedState_yy.quoteName === 'function') {
        this.quoteName = sharedState_yy.quoteName;
    } else {
        this.quoteName = this.originalQuoteName;
    }

    // set up the cleanup function; make it an API so that external code can re-use this one in case of
    // calamities or when the `%options no-try-catch` option has been specified for the grammar, in which
    // case this parse() API method doesn't come with a `finally { ... }` block any more!
    //
    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your `sharedState`, etc. references will be *wrong*!
    this.cleanupAfterParse = function parser_cleanupAfterParse(resultValue, invoke_post_methods, do_not_nuke_errorinfos) {
        var rv;

        if (invoke_post_methods) {
            if (sharedState_yy.post_parse) {
                rv = sharedState_yy.post_parse.call(this, sharedState_yy, resultValue);
                if (typeof rv !== 'undefined') resultValue = rv;
            }
            if (this.post_parse) {
                rv = this.post_parse.call(this, sharedState_yy, resultValue);
                if (typeof rv !== 'undefined') resultValue = rv;
            }
        }

        if (this.__reentrant_call_depth > 1) return resultValue;        // do not (yet) kill the sharedState when this is a reentrant run.

        // clean up the lingering lexer structures as well:
        if (lexer.cleanupAfterLex) {
            lexer.cleanupAfterLex(do_not_nuke_errorinfos);
        }

        // prevent lingering circular references from causing memory leaks:
        if (sharedState_yy) {
            sharedState_yy.parseError = undefined;
            sharedState_yy.quoteName = undefined;
            sharedState_yy.lexer = undefined;
            sharedState_yy.parser = undefined;
            if (lexer.yy === sharedState_yy) {
                lexer.yy = undefined;
            }
        }
        sharedState_yy = undefined;
        this.parseError = this.originalParseError;
        this.quoteName = this.originalQuoteName;


        // To be safe, we nuke the other internal stack columns as well...
        stack.length = 0;               // fastest way to nuke an array without overly bothering the GC
        sstack.length = 0;


        sp = 0;

        // nuke the error hash info instances created during this run.
        // Userland code must COPY any data/references
        // in the error hash instance(s) it is more permanently interested in.
        if (!do_not_nuke_errorinfos) {
            for (var i = this.__error_infos.length - 1; i >= 0; i--) {
                var el = this.__error_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_infos.length = 0;
        }

        return resultValue;
    };

    // NOTE: as this API uses parse() as a closure, it MUST be set again on every parse() invocation,
    //       or else your `lexer`, `sharedState`, etc. references will be *wrong*!
    this.constructParseErrorInfo = function parser_constructParseErrorInfo(msg, ex, expected, recoverable) {
        var pei = {
            errStr: msg,
            exception: ex,
            text: lexer.match,
            value: lexer.yytext,
            token: this.describeSymbol(symbol) || symbol,
            token_id: symbol,
            line: lexer.yylineno,

            expected: expected,
            recoverable: recoverable,
            state: state,
            action: action,
            new_state: newState,
            symbol_stack: stack,
            state_stack: sstack,


            stack_pointer: sp,
            yy: sharedState_yy,
            lexer: lexer,
            parser: this,

            // and make sure the error info doesn't stay due to potential
            // ref cycle via userland code manipulations.
            // These would otherwise all be memory leak opportunities!
            //
            // Note that only array and object references are nuked as those
            // constitute the set of elements which can produce a cyclic ref.
            // The rest of the members is kept intact as they are harmless.
            destroy: function destructParseErrorInfo() {
                // remove cyclic references added to error info:
                // info.yy = null;
                // info.lexer = null;
                // info.value = null;
                // info.value_stack = null;
                // ...
                var rec = !!this.recoverable;
                for (var key in this) {
                    if (this.hasOwnProperty(key) && typeof key === 'object') {
                        this[key] = undefined;
                    }
                }
                this.recoverable = rec;
            }
        };
        // track this instance so we can `destroy()` it once we deem it superfluous and ready for garbage collection!
        this.__error_infos.push(pei);
        return pei;
    };


    function lex() {
        var token = lexer.lex();
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        if (typeof Jison !== 'undefined' && Jison.lexDebugger) {
            var tokenName = Object.keys(self.symbols_).filter(function (x) {
                return self.symbols_[x] === token;
            });
            Jison.lexDebugger.push({
                tokenName: tokenName,
                tokenText: lexer.match,
                tokenValue: lexer.yytext
            });
        }
        return token || EOF;
    }

    function getNonTerminalFromCode(targetCode, symbols) {
        for (var key in symbols) {
            if (!symbols.hasOwnProperty(key)) {
                continue;
            }
            if (symbols[key] === targetCode) {
                return key;
            }
        }
    }


    var symbol = 0;
    var preErrorSymbol = 0;
    var lastEofErrorStateDepth = 0;
    var state, action, r, t;





    var p, len, this_production;

    var newState;
    var retval = false;


    // Return the rule stack depth where the nearest error rule can be found.
    // Return -1 when no error recovery rule was found.
    function locateNearestErrorRecoveryRule(state) {
        var stack_probe = sp - 1;
        var depth = 0;

        // try to recover from error
        for (;;) {
            // check for error recovery rule in this state

            var t = table[state][TERROR] || NO_ACTION;
            if (t[0]) {
                // We need to make sure we're not cycling forever:
                // once we hit EOF, even when we `yyerrok()` an error, we must
                // prevent the core from running forever,
                // e.g. when parent rules are still expecting certain input to
                // follow after this, for example when you handle an error inside a set
                // of braces which are matched by a parent rule in your grammar.
                //
                // Hence we require that every error handling/recovery attempt
                // *after we've hit EOF* has a diminishing state stack: this means
                // we will ultimately have unwound the state stack entirely and thus
                // terminate the parse in a controlled fashion even when we have
                // very complex error/recovery code interplay in the core + user
                // action code blocks:

                if (symbol === EOF) {
                    if (!lastEofErrorStateDepth) {
                        lastEofErrorStateDepth = sp - 1 - depth;
                    } else if (lastEofErrorStateDepth <= sp - 1 - depth) {

                        --stack_probe; // popStack(1): [symbol, action]
                        state = sstack[stack_probe];
                        ++depth;
                        continue;
                    }
                }
                return depth;
            }
            if (state === 0 /* $accept rule */ || stack_probe < 1) {

                return -1; // No suitable error recovery rule available.
            }
            --stack_probe; // popStack(1): [symbol, action]
            state = sstack[stack_probe];
            ++depth;
        }
    }


    try {
        this.__reentrant_call_depth++;

        if (this.pre_parse) {
            this.pre_parse.call(this, sharedState_yy);
        }
        if (sharedState_yy.pre_parse) {
            sharedState_yy.pre_parse.call(this, sharedState_yy);
        }

        newState = sstack[sp - 1];
        for (;;) {
            // retrieve state number from top of stack
            state = newState;               // sstack[sp - 1];

            // use default actions if available
            if (this.defaultActions[state]) {
                action = 2;
                newState = this.defaultActions[state];
            } else {
                // The single `==` condition below covers both these `===` comparisons in a single
                // operation:
                //
                //     if (symbol === null || typeof symbol === 'undefined') ...
                if (!symbol) {
                    symbol = lex();
                }
                // read action for current state and first input
                t = (table[state] && table[state][symbol]) || NO_ACTION;
                newState = t[1];
                action = t[0];




                // handle parse error
                if (!action) {
                    // first see if there's any chance at hitting an error recovery rule:
                    var error_rule_depth = locateNearestErrorRecoveryRule(state);
                    var errStr = null;
                    var errSymbolDescr = (this.describeSymbol(symbol) || symbol);
                    var expected = this.collect_expected_token_set(state);

                    if (!recovering) {
                        // Report error
                        if (typeof lexer.yylineno === 'number') {
                            errStr = 'Parse error on line ' + (lexer.yylineno + 1) + ': ';
                        } else {
                            errStr = 'Parse error: ';
                        }
                        if (lexer.showPosition) {
                            errStr += '\n' + lexer.showPosition(79 - 10, 10) + '\n';
                        }
                        if (expected.length) {
                            errStr += 'Expecting ' + expected.join(', ') + ', got unexpected ' + errSymbolDescr;
                        } else {
                            errStr += 'Unexpected ' + errSymbolDescr;
                        }
                        p = this.constructParseErrorInfo(errStr, null, expected, (error_rule_depth >= 0));
                        r = this.parseError(p.errStr, p, this.JisonParserError);


                        if (!p.recoverable) {
                            retval = r;
                            break;
                        } else {
                            // TODO: allow parseError callback to edit symbol and or state at the start of the error recovery process...
                        }
                    }



                    // just recovered from another error
                    if (recovering === ERROR_RECOVERY_TOKEN_DISCARD_COUNT && error_rule_depth >= 0) {
                        // only barf a fatal hairball when we're out of look-ahead symbols and none hit a match;
                        // this DOES discard look-ahead while recovering from an error when said look-ahead doesn't
                        // suit the error recovery rules... The error HAS been reported already so we're fine with
                        // throwing away a few items if that is what it takes to match the nearest recovery rule!
                        if (symbol === EOF || preErrorSymbol === EOF) {
                            p = this.constructParseErrorInfo((errStr || 'Parsing halted while starting to recover from another error.'), null, expected, false);
                            retval = this.parseError(p.errStr, p, this.JisonParserError);
                            break;
                        }

                        // discard current lookahead and grab another





                        symbol = lex();


                    }

                    // try to recover from error
                    if (error_rule_depth < 0) {
                        p = this.constructParseErrorInfo((errStr || 'Parsing halted. No suitable error recovery rule available.'), null, expected, false);
                        retval = this.parseError(p.errStr, p, this.JisonParserError);
                        break;
                    }
                    sp -= error_rule_depth;

                    preErrorSymbol = (symbol === TERROR ? 0 : symbol); // save the lookahead token
                    symbol = TERROR;            // insert generic error symbol as new lookahead
                    // allow N (default: 3) real symbols to be shifted before reporting a new error
                    recovering = ERROR_RECOVERY_TOKEN_DISCARD_COUNT;

                    newState = sstack[sp - 1];



                    continue;
                }


            }









            switch (action) {
            // catch misc. parse failures:
            default:
                // this shouldn't happen, unless resolve defaults are off
                if (action instanceof Array) {
                    p = this.constructParseErrorInfo(('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol), null, null, false);
                    retval = this.parseError(p.errStr, p, this.JisonParserError);
                    break;
                }
                // Another case of better safe than sorry: in case state transitions come out of another error recovery process
                // or a buggy LUT (LookUp Table):
                p = this.constructParseErrorInfo('Parsing halted. No viable error recovery approach available due to internal system failure.', null, null, false);
                retval = this.parseError(p.errStr, p, this.JisonParserError);
                break;

            // shift:
            case 1:
                //this.shiftCount++;
                stack[sp] = symbol;


                sstack[sp] = newState; // push state
                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                    Jison.parserDebugger.push({
                        action: 'shift',
                        text: lexer.yytext,
                        terminal: this.describeSymbol(symbol) || symbol,
                        terminal_id: symbol
                    });
                }
                ++sp;
                symbol = 0;
                if (!preErrorSymbol) { // normal execution / no error
                    // Pick up the lexer details for the current symbol as that one is not 'look-ahead' any more:





                    if (recovering > 0) {
                        recovering--;

                    }
                } else {
                    // error just occurred, resume old lookahead f/ before error, *unless* that drops us straight back into error mode:
                    symbol = preErrorSymbol;
                    preErrorSymbol = 0;

                    // read action for current state and first input
                    t = (table[newState] && table[newState][symbol]) || NO_ACTION;
                    if (!t[0] || symbol === TERROR) {
                        // forget about that symbol and move forward: this wasn't a 'forgot to insert' error type where
                        // (simple) stuff might have been missing before the token which caused the error we're
                        // recovering from now...
                        //
                        // Also check if the LookAhead symbol isn't the ERROR token we set as part of the error
                        // recovery, for then this we would we idling (cycling) on the error forever.
                        // Yes, this does not take into account the possibility that the *lexer* may have
                        // produced a *new* TERROR token all by itself, but that would be a very peculiar grammar!

                        symbol = 0;
                    }
                }

                continue;

            // reduce:
            case 2:
                //this.reductionCount++;
                this_production = this.productions_[newState - 1];  // `this.productions_[]` is zero-based indexed while states start from 1 upwards...
                len = this_production[1];




                // Do this to prevent nasty action block codes to *read* `$0` or `$$`
                // and *not* get `undefined` as a result for their efforts!


                // perform semantic action










                    // find the current nonterminal name (- nolan)
                    var currentNonterminalCode = this_production[0];     // WARNING: nolan's original code takes this one instead:   this.productions_[newState][0];
                    var currentNonterminal = getNonTerminalFromCode(currentNonterminalCode, this.symbols_);

                    Jison.parserDebugger.push({
                        action: 'reduce',
                        nonterminal: currentNonterminal,
                        nonterminal_id: currentNonterminalCode,
                        prereduce: prereduceValue,
                        result: r,
                        productions: debuggableProductions,
                        text: yyval.$
                    });
                }

                if (typeof r !== 'undefined') {
                    retval = r;
                    break;
                }

                // pop off stack
                sp -= len;

                // don't overwrite the `symbol` variable: use a local var to speed things up:
                var ntsymbol = this_production[0];    // push nonterminal (reduce)
                stack[sp] = ntsymbol;


                // goto new state = table[STATE][NONTERMINAL]
                newState = table[sstack[sp - 1]][ntsymbol];
                sstack[sp] = newState;
                ++sp;

                continue;

            // accept:
            case 3:
                if (typeof Jison !== 'undefined' && Jison.parserDebugger) {
                    Jison.parserDebugger.push({
                        action: 'accept',
                        text: yyval.$
                    });
                  console.log(Jison.parserDebugger[Jison.parserDebugger.length - 1]);
                }
                retval = true;





                break;
            }

            // break out of loop: we accept or fail with error
            break;
        }
    } catch (ex) {
        // report exceptions through the parseError callback too:
        p = this.constructParseErrorInfo('Parsing aborted due to exception.', ex, null, false);
        retval = this.parseError(p.errStr, p, this.JisonParserError);
    } finally {
        retval = this.cleanupAfterParse(retval, true, true);
        this.__reentrant_call_depth--;
    }

    return retval;
}
};
parser.originalParseError = parser.parseError;
parser.originalQuoteName = parser.quoteName;

/*
 * The left code produces both errors on an input of
 *
 *      yy zz yy
 *
 * while the right code syncs but does clear the error count.
 *
 *
 * Starting parse                                                          Starting parse
 * Entering state 0                                                        Entering state 0
 * Reducing via rule 1 (line 28),  -> seq                                  Reducing via rule 1 (line 28),  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 * Reading a token: yy zz yy                                               Reading a token: yy zz yy
 * Next token is 257 (YY)                                                  Next token is 257 (YY)
 * ERROR lineno(1):parse error, expecting `$' or `error' or `ZZ'.  I       ERROR lineno(1):parse error, expecting `$' or `error' or `ZZ'.  I
 * Shifting error token, Entering state 2                                  Shifting error token, Entering state 2
 * Reducing via rule 3 (line 30), seq error  -> seq                        Reducing via rule 3 (line 30), seq error  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 * Next token is 257 (YY)                                                  Next token is 257 (YY)
 * Discarding token 257 (YY).                                              Discarding token 257 (YY).
 * Shifting error token, Entering state 2                                  Shifting error token, Entering state 2
 * Reducing via rule 3 (line 30), seq error  -> seq                        Reducing via rule 3 (line 30), seq error  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 * Reading a token: Next token is 258 (ZZ)                                 Reading a token: Next token is 258 (ZZ)
 * Shifting token 258 (ZZ), Entering state 3                               Shifting token 258 (ZZ), Entering state 3
 * Reducing via rule 2 (line 29), seq ZZ  -> seq                           Reducing via rule 2 (line 29), seq ZZ  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 * Reading a token: Next token is 257 (YY)                                 Reading a token: Next token is 257 (YY)
 * ERROR lineno(1):parse error, expecting `$' or `error' or `ZZ'.  I    <
 * Shifting error token, Entering state 2                                  Shifting error token, Entering state 2
 * Reducing via rule 3 (line 30), seq error  -> seq                        Reducing via rule 3 (line 30), seq error  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 * Next token is 257 (YY)                                                  Next token is 257 (YY)
 * Discarding token 257 (YY).                                              Discarding token 257 (YY).
 * Shifting error token, Entering state 2                                  Shifting error token, Entering state 2
 * Reducing via rule 3 (line 30), seq error  -> seq                        Reducing via rule 3 (line 30), seq error  -> seq
 * state stack now 0                                                       state stack now 0
 * Entering state 1                                                        Entering state 1
 *
 */


/*
 * Continued in error-handling-and-yyerrok-part5.jison ...
 */;
/* lexer generated by jison-lex 0.3.4-166 */
/*
 * Returns a Lexer object of the following structure:
 *
 *  Lexer: {
 *    yy: {}     The so-called "shared state" or rather the *source* of it;
 *               the real "shared state" `yy` passed around to
 *               the rule actions, etc. is a derivative/copy of this one,
 *               not a direct reference!
 *  }
 *
 *  Lexer.prototype: {
 *    yy: {},
 *    EOF: 1,
 *    ERROR: 2,
 *
 *    JisonLexerError: function(msg, hash),
 *
 *    performAction: function lexer__performAction(yy, yy_, $avoiding_name_collisions, YY_START, ...),
 *               where `...` denotes the (optional) additional arguments the user passed to
 *               `lexer.lex(...)` and specified by way of `%parse-param ...` in the **parser** grammar file
 *
 *               The function parameters and `this` have the following value/meaning:
 *               - `this`    : reference to the `lexer` instance.
 *
 *               - `yy`      : a reference to the `yy` "shared state" object which was passed to the lexer
 *                             by way of the `lexer.setInput(str, yy)` API before.
 *
 *               - `yy_`     : lexer instance reference used internally.
 *
 *               - `$avoiding_name_collisions`   : index of the matched lexer rule (regex), used internally.
 *
 *               - `YY_START`: the current lexer "start condition" state.
 *
 *               - `...`     : the extra arguments you specified in the `%parse-param` statement in your
 *                             **parser** grammar definition file and which are passed to the lexer via
 *                             its `lexer.lex(...)` API.
 *
 *    parseError: function(str, hash, ExceptionClass),
 *
 *    constructLexErrorInfo: function(error_message, is_recoverable),
 *               Helper function.
 *               Produces a new errorInfo 'hash object' which can be passed into `parseError()`.
 *               See it's use in this lexer kernel in many places; example usage:
 *
 *                   var infoObj = lexer.constructParseErrorInfo('fail!', true);
 *                   var retVal = lexer.parseError(infoObj.errStr, infoObj, lexer.JisonLexerError);
 *
 *    options: { ... lexer %options ... },
 *
 *    lex: function([args...]),
 *               Produce one token of lexed input, which was passed in earlier via the `lexer.setInput()` API.
 *               You MAY use the additional `args...` parameters as per `%parse-param` spec of the **parser** grammar:
 *               these extra `args...` are passed verbatim to the lexer rules' action code.
 *
 *    cleanupAfterLex: function(do_not_nuke_errorinfos),
 *               Helper function.
 *               This helper API is invoked when the parse process has completed. This helper may
 *               be invoked by user code to ensure the internal lexer gets properly garbage collected.
 *
 *        setInput: function(input, [yy]),
 *        input: function(),
 *        unput: function(str),
 *        more: function(),
 *        reject: function(),
 *        less: function(n),
 *        pastInput: function(n),
 *        upcomingInput: function(n),
 *        showPosition: function(),
 *        test_match: function(regex_match_array, rule_index),
 *        next: function(...),
 *        lex: function(...),
 *        begin: function(condition),
 *        pushState: function(condition),
 *        popState: function(),
 *        topState: function(),
 *        _currentRules: function(),
 *        stateStackSize: function(),
 *
 *        options: { ... lexer %options ... },
 *
 *        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START, ...),
 *        rules: [...],
 *        conditions: {associative list: name ==> set},
 *  }
 *
 *
 *  token location info (`yylloc`): {
 *    first_line: n,
 *    last_line: n,
 *    first_column: n,
 *    last_column: n,
 *    range: [start_number, end_number]
 *               (where the numbers are indexes into the input string, zero-based)
 *  }
 *
 * ---
 *
 * The `parseError` function receives a 'hash' object with these members for lexer errors:
 *
 *  {
 *    text:        (matched text)
 *    token:       (the produced terminal token, if any)
 *    token_id:    (the produced terminal token numeric ID, if any)
 *    line:        (yylineno)
 *    loc:         (yylloc)
 *    recoverable: (boolean: TRUE when the parser MAY have an error recovery rule
 *                  available for this particular error)
 *    yy:          (object: the current parser internal "shared state" `yy`
 *                  as is also available in the rule actions; this can be used,
 *                  for instance, for advanced error analysis and reporting)
 *    lexer:       (reference to the current lexer instance used by the parser)
 *  }
 *
 * while `this` will reference the current lexer instance.
 *
 * When `parseError` is invoked by the lexer, the default implementation will
 * attempt to invoke `yy.parser.parseError()`; when this callback is not provided
 * it will try to invoke `yy.parseError()` instead. When that callback is also not
 * provided, a `JisonLexerError` exception will be thrown containing the error
 * message and `hash`, as constructed by the `constructLexErrorInfo()` API.
 *
 * Note that the lexer's `JisonLexerError` error class is passed via the
 * `ExceptionClass` argument, which is invoked to construct the exception
 * instance to be thrown, so technically `parseError` will throw the object
 * produced by the `new ExceptionClass(str, hash)` JavaScript expression.
 *
 * ---
 *
 * You can specify lexer options by setting / modifying the `.options` object of your Lexer instance.
 * These options are available:
 *
 * (Options are permanent.)
 *  
 *  yy: {
 *      parseError: function(str, hash, ExceptionClass)
 *                 optional: overrides the default `parseError` function.
 *  }
 *
 *  lexer.options: {
 *      pre_lex:  function()
 *                 optional: is invoked before the lexer is invoked to produce another token.
 *                 `this` refers to the Lexer object.
 *      post_lex: function(token) { return token; }
 *                 optional: is invoked when the lexer has produced a token `token`;
 *                 this function can override the returned token value by returning another.
 *                 When it does not return any (truthy) value, the lexer will return
 *                 the original `token`.
 *                 `this` refers to the Lexer object.
 *
 * WARNING: the next set of options are not meant to be changed. They echo the abilities of
 * the lexer as per when it was compiled!
 *
 *      ranges: boolean
 *                 optional: `true` ==> token location info will include a .range[] member.
 *      flex: boolean
 *                 optional: `true` ==> flex-like lexing behaviour where the rules are tested
 *                 exhaustively to find the longest match.
 *      backtrack_lexer: boolean
 *                 optional: `true` ==> lexer regexes are tested in order and for invoked;
 *                 the lexer terminates the scan when a token is returned by the action code.
 *      xregexp: boolean
 *                 optional: `true` ==> lexer rule regexes are "extended regex format" requiring the
 *                 `XRegExp` library. When this %option has not been specified at compile time, all lexer
 *                 rule regexes have been written as standard JavaScript RegExp expressions.
 *  }
 */


var lexer = (function () {
// See also:
// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript/#35881508
// but we keep the prototype.constructor and prototype.name assignment lines too for compatibility
// with userland code which might access the derived class in a 'classic' way.
function JisonLexerError(msg, hash) {
    Object.defineProperty(this, 'name', {
        enumerable: false,
        writable: false,
        value: 'JisonLexerError'
    });

    if (msg == null) msg = '???';

    Object.defineProperty(this, 'message', {
        enumerable: false,
        writable: true,
        value: msg
    });

    this.hash = hash;

    var stacktrace;
    if (hash && hash.exception instanceof Error) {
        var ex2 = hash.exception;
        this.message = ex2.message || msg;
        stacktrace = ex2.stack;
    }
    if (!stacktrace) {
        if (Error.hasOwnProperty('captureStackTrace')) { // V8
            Error.captureStackTrace(this, this.constructor);
        } else {
            stacktrace = (new Error(msg)).stack;
        }
    }
    if (stacktrace) {
        Object.defineProperty(this, 'stack', {
            enumerable: false,
            writable: false,
            value: stacktrace
        });
    }
}

if (typeof Object.setPrototypeOf === 'function') {
    Object.setPrototypeOf(JisonLexerError.prototype, Error.prototype);
} else {
    JisonLexerError.prototype = Object.create(Error.prototype);
}
JisonLexerError.prototype.constructor = JisonLexerError;
JisonLexerError.prototype.name = 'JisonLexerError';




var lexer = {
    // Code Generator Information Report
    // ---------------------------------
    //
    // Options:
    //   backtracking:        false
    //   location.ranges:     undefined
    //
    // Forwarded Parser Analysis flags:
    //   uses yyleng:         false
    //   uses yylineno:       false
    //   uses yytext:         false
    //   uses yylloc:         false
    //   uses lexer values:   false / false
    //   location tracking:   false
    //   location assignment: false
    //
    // --------- END OF REPORT -----------

    EOF: 1,
    ERROR: 2,

    // JisonLexerError: JisonLexerError,        // <-- injected by the code generator

    // options: {},                             // <-- injected by the code generator

    // yy: ...,                                 // <-- injected by setInput()

    __currentRuleSet__: null,                   // <-- internal rule set cache for the current lexer state

    __error_infos: [],                          // INTERNAL USE ONLY: the set of lexErrorInfo objects created since the last cleanup

    __decompressed: false,                      // INTERNAL USE ONLY: mark whether the lexer instance has been 'unfolded' completely and is now ready for use

    done: false,                                // INTERNAL USE ONLY
    _backtrack: false,                          // INTERNAL USE ONLY
    _input: '',                                 // INTERNAL USE ONLY
    _more: false,                               // INTERNAL USE ONLY
    _signaled_error_token: false,               // INTERNAL USE ONLY

    conditionStack: [],                         // INTERNAL USE ONLY; managed via `pushState()`, `popState()`, `topState()` and `stateStackSize()`

    match: '',                                  // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction. `match` is identical to `yytext` except that this one still contains the matched input string after `lexer.performAction()` has been invoked, where userland code MAY have changed/replaced the `yytext` value entirely!
    matched: '',                                // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks entire input which has been matched so far
    matches: false,                             // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks RE match result for last (successful) match attempt
    yytext: '',                                 // ADVANCED USE ONLY: tracks input which has been matched so far for the lexer token under construction; this value is transferred to the parser as the 'token value' when the parser consumes the lexer token produced through a call to the `lex()` API.
    offset: 0,                                  // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks the 'cursor position' in the input string, i.e. the number of characters matched so far
    yyleng: 0,                                  // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: length of matched input for the token under construction (`yytext`)
    yylineno: 0,                                // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: 'line number' at which the token under construction is located
    yylloc: null,                               // READ-ONLY EXTERNAL ACCESS - ADVANCED USE ONLY: tracks location info (lines + columns) for the token under construction

    // INTERNAL USE: construct a suitable error info hash object instance for `parseError`.
    constructLexErrorInfo: function lexer_constructLexErrorInfo(msg, recoverable) {
        var pei = {
            errStr: msg,
            recoverable: !!recoverable,
            text: this.match,           // This one MAY be empty; userland code should use the `upcomingInput` API to obtain more text which follows the 'lexer cursor position'...
            token: null,
            line: this.yylineno,
            loc: this.yylloc,
            yy: this.yy,
            lexer: this,

            // and make sure the error info doesn't stay due to potential
            // ref cycle via userland code manipulations.
            // These would otherwise all be memory leak opportunities!
            //
            // Note that only array and object references are nuked as those
            // constitute the set of elements which can produce a cyclic ref.
            // The rest of the members is kept intact as they are harmless.
            destroy: function destructLexErrorInfo() {
                // remove cyclic references added to error info:
                // info.yy = null;
                // info.lexer = null;
                // ...
                var rec = !!this.recoverable;
                for (var key in this) {
                    if (this.hasOwnProperty(key) && typeof key === 'object') {
                        this[key] = undefined;
                    }
                }
                this.recoverable = rec;
            }
        };
        // track this instance so we can `destroy()` it once we deem it superfluous and ready for garbage collection!
        this.__error_infos.push(pei);
        return pei;
    },

    parseError: function lexer_parseError(str, hash, ExceptionClass) {
        if (this.yy.parser && typeof this.yy.parser.parseError === 'function') {
            return this.yy.parser.parseError(str, hash, ExceptionClass) || this.ERROR;
        } else if (typeof this.yy.parseError === 'function') {
            return this.yy.parseError(str, hash, ExceptionClass) || this.ERROR;
        } else {
            throw new ExceptionClass(str, hash);
        }
    },

    // final cleanup function for when we have completed lexing the input;
    // make it an API so that external code can use this one once userland
    // code has decided it's time to destroy any lingering lexer error
    // hash object instances and the like: this function helps to clean
    // up these constructs, which *may* carry cyclic references which would
    // otherwise prevent the instances from being properly and timely
    // garbage-collected, i.e. this function helps prevent memory leaks!
    cleanupAfterLex: function lexer_cleanupAfterLex(do_not_nuke_errorinfos) {
        var rv;

        // prevent lingering circular references from causing memory leaks:
        this.setInput('', {});

        // nuke the error hash info instances created during this run.
        // Userland code must COPY any data/references
        // in the error hash instance(s) it is more permanently interested in.
        if (!do_not_nuke_errorinfos) {
            for (var i = this.__error_infos.length - 1; i >= 0; i--) {
                var el = this.__error_infos[i];
                if (el && typeof el.destroy === 'function') {
                    el.destroy();
                }
            }
            this.__error_infos.length = 0;
        }

        return this;
    },

    // clear the lexer token context; intended for internal use only
    clear: function lexer_clear() {
        this.yytext = '';
        this.yyleng = 0;
        this.match = '';
        this.matches = false;
        this._more = false;
        this._backtrack = false;
    },

    // resets the lexer, sets new input
    setInput: function lexer_setInput(input, yy) {
        this.yy = yy || this.yy || {};

        // also check if we've fully initialized the lexer instance,
        // including expansion work to be done to go from a loaded
        // lexer to a usable lexer:
        if (!this.__decompressed) {
          // step 1: decompress the regex list:
          var rules = this.rules;
          for (var i = 0, len = rules.length; i < len; i++) {
            var rule_re = rules[i];

            // compression: is the RE an xref to another RE slot in the rules[] table?
            if (typeof rule_re === 'number') {
              rules[i] = rules[rule_re];
            }
          }

          // step 2: unfold the conditions[] set to make these ready for use:
          var conditions = this.conditions;
          for (var k in conditions) {
            var spec = conditions[k];

            var rule_ids = spec.rules;

            var len = rule_ids.length;
            var rule_regexes = new Array(len + 1);            // slot 0 is unused; we use a 1-based index approach here to keep the hottest code in `lexer_next()` fast and simple!
            var rule_new_ids = new Array(len + 1);

            for (var i = 0; i < len; i++) {
              var idx = rule_ids[i];
              var rule_re = rules[idx];
              rule_regexes[i + 1] = rule_re;
              rule_new_ids[i + 1] = idx;
            }

            spec.rules = rule_new_ids;
            spec.__rule_regexes = rule_regexes;
            spec.__rule_count = len;
          }

          this.__decompressed = true;
        }

        this._input = input || '';
        this.clear();
        this._signaled_error_token = false;
        this.done = false;
        this.yylineno = 0;
        this.matched = '';
        this.conditionStack = ['INITIAL'];
        this.__currentRuleSet__ = null;
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0, 0];
        }
        this.offset = 0;
        return this;
    },

    // consumes and returns one char from the input
    input: function lexer_input() {
        if (!this._input) {
            //this.done = true;    -- don't set `done` as we want the lex()/next() API to be able to produce one custom EOF token match after this anyhow. (lexer can match special <<EOF>> tokens and perform user action code for a <<EOF>> match, but only does so *once*)
            return null;
        }
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        // Count the linenumber up when we hit the LF (or a stand-alone CR).
        // On CRLF, the linenumber is incremented when you fetch the CR or the CRLF combo
        // and we advance immediately past the LF as well, returning both together as if
        // it was all a single 'character' only.
        var slice_len = 1;
        var lines = false;
        if (ch === '\n') {
            lines = true;
        } else if (ch === '\r') {
            lines = true;
            var ch2 = this._input[1];
            if (ch2 === '\n') {
                slice_len++;
                ch += ch2;
                this.yytext += ch2;
                this.yyleng++;
                this.offset++;
                this.match += ch2;
                this.matched += ch2;
                if (this.options.ranges) {
                    this.yylloc.range[1]++;
                }
            }
        }
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(slice_len);
        return ch;
    },

    // unshifts one char (or a string) into the input
    unput: function lexer_unput(ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - len);
        this.matched = this.matched.substr(0, this.matched.length - len);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }

        this.yylloc.last_line = this.yylineno + 1;
        this.yylloc.last_column = (lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                + oldLines[oldLines.length - lines.length].length - lines[0].length :
                this.yylloc.first_column - len);

        if (this.options.ranges) {
            this.yylloc.range[1] = this.yylloc.range[0] + this.yyleng - len;
        }
        this.yyleng = this.yytext.length;
        this.done = false;
        return this;
    },

    // When called from action, caches matched text and appends it on next action
    more: function lexer_more() {
        this._more = true;
        return this;
    },

    // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
    reject: function lexer_reject() {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            // when the `parseError()` call returns, we MUST ensure that the error is registered.
            // We accomplish this by signaling an 'error' token to be produced for the current
            // `.lex()` run.
            var p = this.constructLexErrorInfo('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), false);
            this._signaled_error_token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
        }
        return this;
    },

    // retain first n characters of the match
    less: function lexer_less(n) {
        return this.unput(this.match.slice(n));
    },

    // return (part of the) already matched input, i.e. for error messages.
    // Limit the returned string length to `maxSize` (default: 20).
    // Limit the returned string to the `maxLines` number of lines of input (default: 1).
    // Negative limit values equal *unlimited*.
    pastInput: function lexer_pastInput(maxSize, maxLines) {
        var past = this.matched.substring(0, this.matched.length - this.match.length);
        if (maxSize < 0)
            maxSize = past.length;
        else if (!maxSize)
            maxSize = 20;
        if (maxLines < 0)
            maxLines = past.length;         // can't ever have more input lines than this!
        else if (!maxLines)
            maxLines = 1;
        // `substr` anticipation: treat \r\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        past = past.substr(-maxSize * 2 - 2);
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        var a = past.replace(/\r\n|\r/g, '\n').split('\n');
        a = a.slice(-maxLines);
        past = a.join('\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis prefix...
        if (past.length > maxSize) {
            past = '...' + past.substr(-maxSize);
        }
        return past;
    },

    // return (part of the) upcoming input, i.e. for error messages.
    // Limit the returned string length to `maxSize` (default: 20).
    // Limit the returned string to the `maxLines` number of lines of input (default: 1).
    // Negative limit values equal *unlimited*.
    upcomingInput: function lexer_upcomingInput(maxSize, maxLines) {
        var next = this.match;
        if (maxSize < 0)
            maxSize = next.length + this._input.length;
        else if (!maxSize)
            maxSize = 20;
        if (maxLines < 0)
            maxLines = maxSize;         // can't ever have more input lines than this!
        else if (!maxLines)
            maxLines = 1;
        // `substring` anticipation: treat \r\n as a single character and take a little
        // more than necessary so that we can still properly check against maxSize
        // after we've transformed and limited the newLines in here:
        if (next.length < maxSize * 2 + 2) {
            next += this._input.substring(0, maxSize * 2 + 2);  // substring is faster on Chrome/V8
        }
        // now that we have a significantly reduced string to process, transform the newlines
        // and chop them, then limit them:
        var a = next.replace(/\r\n|\r/g, '\n').split('\n');
        a = a.slice(0, maxLines);
        next = a.join('\n');
        // When, after limiting to maxLines, we still have too much to return,
        // do add an ellipsis postfix...
        if (next.length > maxSize) {
            next = next.substring(0, maxSize) + '...';
        }
        return next;
    },

    // return a string which displays the character position where the lexing error occurred, i.e. for error messages
    showPosition: function lexer_showPosition(maxPrefix, maxPostfix) {
        var pre = this.pastInput(maxPrefix).replace(/\s/g, ' ');
        var c = new Array(pre.length + 1).join('-');
        return pre + this.upcomingInput(maxPostfix).replace(/\s/g, ' ') + '\n' + c + '^';
    },

    // helper function, used to produce a human readable description as a string, given
    // the input `yylloc` location object.
    // Set `display_range_too` to TRUE to include the string character index position(s)
    // in the description if the `yylloc.range` is available.
    describeYYLLOC: function lexer_describe_yylloc(yylloc, display_range_too) {
        var l1 = yylloc.first_line;
        var l2 = yylloc.last_line;
        var o1 = yylloc.first_column;
        var o2 = yylloc.last_column - 1;
        var dl = l2 - l1;
        var d_o = (dl === 0 ? o2 - o1 : 1000);
        var rv;
        if (dl === 0) {
            rv = 'line ' + l1 + ', ';
            if (d_o === 0) {
                rv += 'column ' + o1;
            } else {
                rv += 'columns ' + o1 + ' .. ' + o2;
            }
        } else {
            rv = 'lines ' + l1 + '(column ' + o1 + ') .. ' + l2 + '(column ' + o2 + ')';
        }
        if (yylloc.range && display_range_too) {
            var r1 = yylloc.range[0];
            var r2 = yylloc.range[1] - 1;
            if (r2 === r1) {
                rv += ' {String Offset: ' + r1 + '}';
            } else {
                rv += ' {String Offset range: ' + r1 + ' .. ' + r2 + '}';
            }
        }
        return rv;
        // return JSON.stringify(yylloc);
    },

    // test the lexed token: return FALSE when not a match, otherwise return token.
    //
    // `match` is supposed to be an array coming out of a regex match, i.e. `match[0]`
    // contains the actually matched text string.
    //
    // Also move the input cursor forward and update the match collectors:
    // - yytext
    // - yyleng
    // - match
    // - matches
    // - yylloc
    // - offset
    test_match: function lexer_test_match(match, indexed_rule) {
        var token,
            lines,
            backup,
            match_str,
            match_str_len;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        match_str = match[0];
        match_str_len = match_str.length;
        // if (match_str.indexOf('\n') !== -1 || match_str.indexOf('\r') !== -1) {
            lines = match_str.match(/(?:\r\n?|\n).*/g);
            if (lines) {
                this.yylineno += lines.length;
            }
        // }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/^\r?\n?/)[0].length :
                         this.yylloc.last_column + match_str_len
        };
        this.yytext += match_str;
        this.match += match_str;
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset + this.yyleng];
        }
        // previous lex rules MAY have invoked the `more()` API rather than producing a token:
        // those rules will already have moved this `offset` forward matching their match lengths,
        // hence we must only add our own match length now:
        this.offset += match_str_len;
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match_str_len);
        this.matched += match_str;

        // calling this method:
        //
        //   function lexer__performAction(yy, yy_, $avoiding_name_collisions, YY_START) {...}
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1] /* = YY_START */);
        // otherwise, when the action codes are all simple return token statements:
        //token = this.simpleCaseActionClusters[indexed_rule];

        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            this.__currentRuleSet__ = null;
            return false; // rule action called reject() implying the next rule should be tested instead.
        } else if (this._signaled_error_token) {
            // produce one 'error' token as `.parseError()` in `reject()` did not guarantee a failure signal by throwing an exception!
            token = this._signaled_error_token;
            this._signaled_error_token = false;
            return token;
        }
        return false;
    },

    // return next match in input
    next: function lexer_next() {
        if (this.done) {
            this.clear();
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.clear();
        }
        var spec = this.__currentRuleSet__;
        if (!spec) {
            // Update the ruleset cache as we apparently encountered a state change or just started lexing.
            // The cache is set up for fast lookup -- we assume a lexer will switch states much less often than it will
            // invoke the `lex()` token-producing API and related APIs, hence caching the set for direct access helps
            // speed up those activities a tiny bit.
            spec = this.__currentRuleSet__ = this._currentRules();
            // Check whether a *sane* condition has been pushed before: this makes the lexer robust against
            // user-programmer bugs such as https://github.com/zaach/jison-lex/issues/19
            if (!spec || !spec.rules) {
                var p = this.constructLexErrorInfo('Internal lexer engine error on line ' + (this.yylineno + 1) + '. The lex grammar programmer pushed a non-existing condition name "' + this.topState() + '"; this is a fatal error and should be reported to the application programmer team!\n', false);
                // produce one 'error' token until this situation has been resolved, most probably by parse termination!
                return (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
            }
        }

        var rule_ids = spec.rules;
//        var dispatch = spec.__dispatch_lut;
        var regexes = spec.__rule_regexes;
        var len = spec.__rule_count;

//        var c0 = this._input[0];

        // Note: the arrays are 1-based, while `len` itself is a valid index,
        // hence the non-standard less-or-equal check in the next loop condition!
        //
        // `dispatch` is a lookup table which lists the *first* rule which matches the 1-char *prefix* of the rule-to-match.
        // By using that array as a jumpstart, we can cut down on the otherwise O(n*m) behaviour of this lexer, down to
        // O(n) ideally, where:
        //
        // - N is the number of input particles -- which is not precisely characters
        //   as we progress on a per-regex-match basis rather than on a per-character basis
        //
        // - M is the number of rules (regexes) to test in the active condition state.
        //
        for (var i = 1 /* (dispatch[c0] || 1) */ ; i <= len; i++) {
            tempMatch = this._input.match(regexes[i]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rule_ids[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = undefined;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rule_ids[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === '') {
            this.done = true;
            return this.EOF;
        } else {
            var p = this.constructLexErrorInfo('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), this.options.lexer_errors_are_recoverable);
            token = (this.parseError(p.errStr, p, this.JisonLexerError) || this.ERROR);
            if (token === this.ERROR) {
                // we can try to recover from a lexer error that `parseError()` did not 'recover' for us
                // by moving forward at least one character at a time:
                if (!this.match.length) {
                    this.input();
                }
            }
            return token;
        }
    },

    // return next match that has a token
    lex: function lexer_lex() {
        var r;
        // allow the PRE/POST handlers set/modify the return token for maximum flexibility of the generated lexer:
        if (typeof this.options.pre_lex === 'function') {
            r = this.options.pre_lex.call(this);
        }
        while (!r) {
            r = this.next();
        }
        if (typeof this.options.post_lex === 'function') {
            // (also account for a userdef function which does not return any value: keep the token as is)
            r = this.options.post_lex.call(this, r) || r;
        }
        return r;
    },

    // backwards compatible alias for `pushState()`;
    // the latter is symmetrical with `popState()` and we advise to use
    // those APIs in any modern lexer code, rather than `begin()`.
    begin: function lexer_begin(condition) {
        return this.pushState(condition);
    },

    // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
    pushState: function lexer_pushState(condition) {
        this.conditionStack.push(condition);
        this.__currentRuleSet__ = null;
        return this;
    },

    // pop the previously active lexer condition state off the condition stack
    popState: function lexer_popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            this.__currentRuleSet__ = null;
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

    // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
    topState: function lexer_topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return 'INITIAL';
        }
    },

    // (internal) determine the lexer rule set which is active for the currently active lexer condition state
    _currentRules: function lexer__currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]];
        } else {
            return this.conditions['INITIAL'];
        }
    },

    // return the number of states currently on the stack
    stateStackSize: function lexer_stateStackSize() {
        return this.conditionStack.length;
    },
    options: {
  inputFilename: "dummy"
},
    JisonLexerError: JisonLexerError,
    performAction: function lexer__performAction(yy, yy_, $avoiding_name_collisions, YY_START) {

var YYSTATE = YY_START;
switch($avoiding_name_collisions) {
case 5 : 
/*! Conditions:: INITIAL */ 
/*! Rule::       [\r\n\s]+ */ 
 // ignore 
break;
default:
  return this.simpleCaseActionClusters[$avoiding_name_collisions];
}
},
    simpleCaseActionClusters: {

  /*! Conditions:: INITIAL */ 
  /*! Rule::       yy */ 
   0 : 'YY',
  /*! Conditions:: INITIAL */ 
  /*! Rule::       zz */ 
   1 : 3,
  /*! Conditions:: INITIAL */ 
  /*! Rule::       ; */ 
   2 : ';',
  /*! Conditions:: INITIAL */ 
  /*! Rule::       \( */ 
   3 : '(',
  /*! Conditions:: INITIAL */ 
  /*! Rule::       \) */ 
   4 : ')',
  /*! Conditions:: INITIAL */ 
  /*! Rule::       $ */ 
   6 : 1
},
    rules: [
/^(?:yy)/,
/^(?:zz)/,
/^(?:;)/,
/^(?:\()/,
/^(?:\))/,
/^(?:\s+)/,
/^(?:$)/
],
    conditions: {
  "INITIAL": {
    rules: [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    inclusive: true
  }
}
};




return lexer;
})();
parser.lexer = lexer;

function Parser() {
  this.yy = {};
}
Parser.prototype = parser;
parser.Parser = Parser;

return new Parser();
})();
