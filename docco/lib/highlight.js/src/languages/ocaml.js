/*
Language: OCaml
Author: Paul Chaignon <paul.chaignon@gmail.com>
Description: OCaml is the main implementation of the language Caml.
*/
function(hljs) {
  return {
    keywords:
      'let function type true false in match with rec|10 float if else then fun ' +
      'succ int assert-false|10 val list List raise failwith|10 and exit of when exception',
    contains: [
      hljs.C_NUMBER_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'comment',
        begin: '\\(\\*', end: '\\*\\)',
      },
      {
        className: 'let',
        beginWithKeyword: true, end: '=',
        excludeEnd: true,
        keywords: 'let rec'
      },
      {
        className: 'class',
        beginWithKeyword: true, end: '=',
        keywords: 'type',
        contains: [
          {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
        ]
      },
    ]
  };
}
