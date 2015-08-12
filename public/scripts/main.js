require.config({
  baseUrl: "/scripts/editor/js",
  paths: {
    "text": "../vendor/require.text",
    "i18n": "../vendor/require.i18n",
    "sso-override": "../../sso-override",
    "jquery": "/bower/jquery/index",
    "localized": "/bower/webmaker-i18n/localized",
    "uuid": "/bower/node-uuid/uuid",
    "cookies": "/bower/cookies-js/dist/cookies"
  },
  shim: {
    "jquery": {
      exports: "$"
    }
  },
  config: {
    template: {
      htmlPath: "templates",
      i18nPath: "fc/nls/ui"
    }
  }
});

define(["bramble-editor", "project", "sso-override"], function(BrambleEditor, Project) {
  var thimbleScript = document.getElementById("thimble-script");
  var appUrl = thimbleScript.getAttribute("data-app-url");
  var makeDetails = thimbleScript.getAttribute("data-make-details");
  var editorUrl = thimbleScript.getAttribute("data-editor-url");
  var editorHost = thimbleScript.getAttribute("data-editor-host");

  // unpack makedetails
  makeDetails = JSON.parse(decodeURIComponent(makeDetails));
  Project.init(makeDetails);

  var editor = BrambleEditor({
    makeDetails: makeDetails,
    editorUrl: editorUrl,
    editorHost: editorHost,
    appUrl: appUrl
  });
});
