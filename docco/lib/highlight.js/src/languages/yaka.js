/*
Language: Yaka
Author: Paul Chaignon <paul.chaignon@gmail.com>
Description: French pseudo language written by INSA students.
*/
function(hljs) {
  var TITLE = {
    className: 'title', begin: hljs.UNDERSCORE_IDENT_RE
  };
  var YAKA_KEYWORDS = {
    keyword:
      'faux|10 entier|10 booleen|10 si|10 ffonction|10 const tantque|10 vrai|10 retourne|10 ' +
      'sinon|10 var alaligne|10 lire|10 ecrire|10 fprogramme|10 fprincipal|10 fsi|10 alors|10 faire|10 fait|10'
  };
  return {
    case_insensitive: true,
    keywords: YAKA_KEYWORDS,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'comment',
        begin: '\\(\\*', end: '\\*\\)',
      },
      {
        className: 'program',
        beginWithKeyword: true, end: /$/,
        keywords: 'programme',
        relevance: 10,
        contains: [TITLE]
      },
      {
        className: 'principal',
        beginWithKeyword: true,
        keywords: 'principal',
      },
      {
        className: 'function',
        beginWithKeyword: true, end: /$/,
        keywords: 'fonction',
        relevance: 10,
        contains: [
          TITLE,
          {
            className: 'params',
            begin: /\(/, end: /\)/,
            keywords: YAKA_KEYWORDS
          }
        ]
      }
    ]
  };
}
