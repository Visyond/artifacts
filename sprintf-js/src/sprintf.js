(function ( window ) {
	var re = {
		not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
		text: /^[^\x25]+/,
		modulo: /^\x25{2}/,
		placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+|\*(?:([1-9]\d*)\$|\(([^\)]+)\))?)?(?:\.(\d+|\*(?:([1-9]\d*)\$|\(([^\)]+)\))?))?([b-gfijosuxX])/,
		//                                                                                                                         11111111       111111 99999   11111111111      
		//                     11111111       222222      33   4444444   5   666666666 77777777 66666 888888 6666        999999999 00000000 99999 111111 99999   22222222222
		key: /^([a-z_][a-z_\d]*)/i,
		key_access: /^\.([a-z_][a-z_\d]*)/i,
		index_access: /^\[(\d+)\]/,
		sign: /^[\+\-]/
	};

	function sprintf() {
		var key = arguments[0], cache = sprintf.cache;
		if ( ! ( cache[key] && cache.hasOwnProperty( key ) ) ) {
			cache[key] = sprintf.parse( key );
		}
		return sprintf.format.call( null, cache[key], arguments );
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
			arglen, argprec, arg_left_align;

		for ( i = 0; i < tree_length; i++ ) {
			node_type = get_type( parse_tree[i] );
			if ( node_type === "string" ) {
				output[output.length] = parse_tree[i];
			}
			else if ( node_type === "array" ) {
				is_positive = true;
				sign = "";
				arglen = false;
				argprec = false; 
				arg_left_align = false;

				match = parse_tree[i]; // convenience purposes only
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
				if ( get_type( arg ) === "function" ) {
					arg = arg();
				}

				if ( re.not_string.test( match[12] ) && re.not_json.test(match[8]) && (get_type( arg ) !== "number" && isNaN( arg )) ) {
					throw new TypeError( sprintf( "[sprintf] expecting number but found %s", get_type( arg ) ) );
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
						arg = argprec !== false ? parseFloat( arg ).toFixed( argprec ) : parseFloat( arg ).toString();
                        break;
                    case "g":
                        arg = argprec !== false ? parseFloat(arg).toPrecision(argprec) : parseFloat(arg).toString();
						break;
					case "o":
						arg = arg.toString( 8 );
						break;
					case "s":
						arg = ((arg = String( arg )) && argprec !== false ? arg.substring( 0, argprec ) : arg);
						break;
					case "u":
						arg = (arg >>> 0).toString();
						break;
					case "x":
						arg = arg.toString( 16 );
						break;
					case "X":
						arg = arg.toString( 16 ).toUpperCase();
						break;
				}
                if (re.json.test(match[8])) {
                    output[output.length] = arg
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

	var vsprintf = function ( fmt, argv, _argv ) {
		_argv = (argv || []).slice( 0 );
		_argv.splice( 0, 0, fmt );
		return sprintf.apply( null, _argv );
	};

	/**
	 * helpers
	 */
	function get_type( variable ) {
		return Object.prototype.toString.call( variable ).slice( 8, -1 ).toLowerCase();
	}

	function str_repeat( input, multiplier ) {
		return multiplier > 0 ? new Array( multiplier + 1 ).join( input ) : "";
	}

	/**
	 * export to browser
	 */
	window.sprintf = sprintf;
	window.vsprintf = vsprintf;
})( typeof window === "undefined" ? this : window );
