// A subclass of CodeMirror which adds a few methods that make it easier
// to work with character indexes rather than {line, ch} objects.
//
// NOTE: CodeMirror now lives inside of an iframe with our version of
//       brackets (affectionatly called brambles), so the "CodeMirror"
//       object seen here is actually the friendlycode half of our proxy
//       between friendlycode and the bramble CodeMirror instance.
define(["bramble-proxy"], function(CodeMirror) {
  "use strict";

  return function indexableCodeMirror(place, givenOptions) {
    return new CodeMirror(place, givenOptions);
  };
});
