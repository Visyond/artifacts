/*
Language: OCaml
Author: Paul Chaignon <paul.chaignon@gmail.com>
Description: OCaml is the main implementation of the language Caml.
*/
function(hljs) {
  var SCHEME_KEYWORDS = {
    keyword:
      'define cond loop map else cons let lambda|10 list cdr car reverse if null?'
  };
  return {
    keywords: SCHEME_KEYWORDS,
    contains: [
      hljs.C_NUMBER_MODE,
      hljs.QUOTE_STRING_MODE
    ]
  };
}
