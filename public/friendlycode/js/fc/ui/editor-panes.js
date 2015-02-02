define(function(require) {
  var $ = require("jquery"),
      Slowparse = require("slowparse/slowparse"),
      ParsingCodeMirror = require("fc/ui/parsing-codemirror"),
      Help = require("fc/help"),
      LivePreview = require("fc/ui/live-preview");

  require('slowparse-errors');
  require("codemirror/html");

  // TODO: Add bracketsProxy in place of codemirror

  return function EditorPanes(options) {
    var self = {},
        div = options.container,
        initialValue = options.value || "",
        allowJS = options.allowJS || false,
        sourceCode = $('<div class="source-code"></div>').attr('id','webmaker-source-code-pane').appendTo(div),
        previewArea = $('<div class="preview-holder"></div>').attr('id','webmaker-preview-holder-pane').appendTo(div);

    var codeMirror = self.codeMirror = ParsingCodeMirror(sourceCode[0], {
      parse: function(html) {
        return Slowparse.HTML(document, html, {
          disallowActiveAttributes: true
        });
      },
      dataProtector: options.dataProtector,
      appUrl: options.appUrl
    });

    var preview = self.preview = LivePreview({
      codeMirror: codeMirror,
      ignoreErrors: options.ignoreErrors || false,
      previewArea: previewArea,
      previewLoader: options.previewLoader
    });

    return self;
  };
});
