/* globals window, exports, define */

(function ( window ) {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[d-gi]/,                   // [defgi]
        numeric_arg: /b-giuxX/,             // [bcdefgiuxX]
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+|\*(?:([1-9]\d*)\$|\(([^\)]+)\))?)?(?:\.(\d+|\*(?:([1-9]\d*)\$|\(([^\)]+)\))?))?([b-gijostTuvxX])/,
        //                                                                                                                         11111111       111111 99999   111111111111111      
        //                     11111111       222222      33   4444444   5   666666666 77777777 66666 888888 6666        999999999 00000000 99999 111111 99999   222222222222222
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    function sprintf() {
        var key = arguments[0], 
            cache = sprintf.cache;
        if ( ! ( cache[key] && cache.hasOwnProperty( key ) ) ) {
            cache[key] = sprintf.parse( key );
        }
        return sprintf.format( cache[key], arguments );
    }

    sprintf.format = function ( parse_tree, argv ) {
        var cursor = 1, 
            tree_length = parse_tree.length, 
            node_type = "", 
            arg, 
            output = [], 
            i, k, match, pad, pad_character, pad_length, 
            is_positive, 
            sign,
            arglen, argprec, arg_left_align, argtype;

        for ( i = 0; i < tree_length; i++ ) {
            match = parse_tree[i]; // convenience purposes only
            node_type = get_type( match );
            if ( node_type === "string" ) {
                output[output.length] = match;
            }
            else if ( node_type === "array" ) {
                is_positive = true;
                sign = "";
                arglen = false;
                argprec = false; 
                arg_left_align = false;

                if (match[6]) {
                    arglen = +match[6];
                    if (match[6][0] === '*') { // length argument
                        arglen = +argv[cursor++];
                    }
                }
                if (match[9]) {
                    argprec = +match[9];
                    if (match[9][0] === '*') { // precision argument
                        argprec = +argv[cursor++];
                    }
                }
                //output[output.length] = "{M:" + match[5] + ":L:" + arglen + ":P:" + argprec + "}";
                if ( match[5] || arglen < 0 ) {
                    arg_left_align = true;
                    arglen = Math.abs(arglen);
                }
                if ( match[2] ) { // keyword argument
                    arg = argv[cursor];
                    for ( k = 0; k < match[2].length; k++ ) {
                        if ( ! arg.hasOwnProperty( match[2][k] ) ) {
                            throw new Error( sprintf( "[sprintf] property '%s' does not exist", match[2][k] ) );
                        }
                        arg = arg[match[2][k]];
                    }
                }
                else if ( match[1] ) { // positional argument (explicit)
                    arg = argv[match[1]];
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                // compute functions into their argument value
                if ( re.not_type.test( match[12] ) && re.not_primitive.test( match[12] ) && get_type( arg ) === "function" ) {
                    arg = arg();
                }

                if ( re.numeric_arg.test( match[12] ) ) {
                    argtype = get_type( arg );
                    if ( argtype === "number" ) {
		    	if ( !isFinite( arg ) ) {
                            argtype = String( arg );
			}
                    } else {
		    	if ( isFinite( arg ) ) {
                            argtype = "number";
			    arg = parseFloat( arg );
			}
		    }
                    if ( argtype !== "number" ) {
                        throw new TypeError( sprintf( "[sprintf] expecting number but found %s", argtype ) );
                    }
                }

                if ( re.number.test( match[12] ) ) {
                    is_positive = arg >= 0;
                }

                switch ( match[12] ) {
                case "b":
                    arg = arg.toString( 2 );
                    break;
                case "c":
                    arg = String.fromCharCode( arg );
                    break;
                case "d":
                case "i":
                    arg = parseInt( arg, 10 ).toString();
                    break;
                case "j":
                    arg = JSON.stringify(arg, null, arglen ? parseInt(arglen) : 0);
                    break;
                case "e":
                    arg = argprec !== false ? arg.toExponential( argprec ) : arg.toExponential();
                    break;
                case "f":
                    arg = argprec !== false ? arg.toFixed( argprec ) : arg.toString();
                    break;
                case "g":
                    arg = argprec !== false ? arg.toPrecision( argprec ) : arg.toString();
                    break;
                case "o":
                    arg = arg.toString( 8 );
                    break;
                case "s":
                    arg = String( arg );
                    arg = (arg && argprec !== false ? arg.substring( 0, argprec ) : arg);
                    break;
                case "t":
                    arg = String(!!arg);
                    arg = (argprec !== false ? arg.substring( 0, argprec ) : arg);
                    break;
                case "T":
                    arg = get_type(arg);
                    arg = (argprec !== false ? arg.substring( 0, argprec ) : arg);
                    break;
                case "u":
                    arg = (arg >>> 0).toString();
                    break;
                case "v":
                    arg = arg.valueOf();
                    arg = (argprec !== false ? arg.substring( 0, argprec ) : arg);
                    break;
                case "x":
                    arg = arg.toString( 16 );
                    break;
                case "X":
                    arg = arg.toString( 16 ).toUpperCase();
                    break;
                }
                if (re.json.test(match[12])) {
                    output[output.length] = arg;
                }
                else {
                    if ( re.number.test( match[12] ) && (! is_positive || match[3]) ) {
                        sign = is_positive ? "+" : "-";
                        arg = arg.toString().replace( re.sign, "" );
                    }
                    else {
                        sign = "";
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt( 1 ) : " ";
                    pad_length = arglen - (sign + arg).length;
                    pad = arglen !== false ? (pad_length > 0 ? str_repeat( pad_character, pad_length ) : "") : "";
                    output[output.length] = arg_left_align ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg);
                    //output[output.length] = ":I:" + arg_left_align + ":S:" + sign + ":A:" + arg + ":P:" + pad + ":C:" + pad_character + ":";
                }
            }
        }
        return output.join( "" );
    };

    sprintf.cache = {};

    sprintf.parse = function ( fmt ) {
        var _fmt = fmt, 
            match = [], 
            parse_tree = [], 
            arg_names = 0;

        while ( _fmt ) {
            if ( (match = re.text.exec( _fmt )) !== null ) {
                parse_tree[parse_tree.length] = match[0];
            }
            else if ( (match = re.modulo.exec( _fmt )) !== null ) {
                parse_tree[parse_tree.length] = "%";
            }
            else if ( (match = re.placeholder.exec( _fmt )) !== null ) {
                if ( match[2] ) {
                    arg_names |= 1;
                    var field_list = [], 
                        replacement_field = match[2], 
                        field_match = [];

                    if ( (field_match = re.key.exec( replacement_field )) !== null ) {
                        field_list[field_list.length] = field_match[1];
                        while ( (replacement_field = replacement_field.substring( field_match[0].length )) !== "" ) {
                            if ( (field_match = re.key_access.exec( replacement_field )) !== null ) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else if ( (field_match = re.index_access.exec( replacement_field )) !== null ) {
                                field_list[field_list.length] = field_match[1];
                            }
                            else {
                                throw new SyntaxError( "[sprintf] failed to parse named argument key" );
                            }
                        }
                    }
                    else {
                        throw new SyntaxError( "[sprintf] failed to parse named argument key" );
                    }
                    match[2] = field_list;
                }
                else {
                    arg_names |= 2;
                }
                if ( arg_names === 3 ) {
                    throw new Error( "[sprintf] mixing positional and named placeholders is not (yet) supported" );
                }
                parse_tree[parse_tree.length] = match;
            }
            else {
                throw new SyntaxError( "[sprintf] unexpected placeholder" );
            }
            _fmt = _fmt.substring( match[0].length );
        }
        return parse_tree;
    };

    var vsprintf = function ( fmt, argv ) {
        var _argv = (argv || []).slice( 0 );
        _argv.unshift( fmt );
        return sprintf.apply( null, _argv );
    };

    /**
     * helpers
     */
    function get_type( variable ) {
        if ( typeof variable === 'number' ) return 'number';
        if ( typeof variable === 'string' ) return 'string';
        return Object.prototype.toString.call( variable ).slice( 8, -1 ).toLowerCase();
    }

    var preformattedPadding = {
        '0': ['', '0', '00', '000', '0000', '00000', '000000', '0000000'],
        ' ': ['', ' ', '  ', '   ', '    ', '     ', '      ', '       '],
        '_': ['', '_', '__', '___', '____', '_____', '______', '_______'],
    };
    function str_repeat( input, multiplier ) {
        if ( multiplier >= 0 && multiplier <= 7 && preformattedPadding[input] ) {
            return preformattedPadding[input][multiplier];
        }
        return multiplier > 0 ? new Array( multiplier + 1 ).join( input ) : "";
    }

    /**
     * export to either browser or node.js
     */
    window.sprintf = sprintf;
    window.vsprintf = vsprintf;

    if (typeof exports !== 'undefined') {
        exports.sprintf = sprintf;
        exports.vsprintf = vsprintf;
    }
    else {
        if (typeof define === 'function' && define.amd) {
            define(function() {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                };
            });
        }
    }
})( typeof window === "undefined" ? this : window );
