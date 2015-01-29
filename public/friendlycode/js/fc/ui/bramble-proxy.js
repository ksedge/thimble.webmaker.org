// This file is the friendlycode half of a proxy layer between Thimble's live preview
// window and bramble's codemirror instance. It was designed to map to existing
// friendlycode use of codemirror, with the exception of duplicate functionality
// between bramble and friendlycode that bramble already provides (or will)
define(function() {
  "use strict";

  var eventCBs = {
    "change": [],
    "reparse": []
  };

  function BrambleProxy(place, givenOptions) {
    var iframe = document.createElement("iframe"),
        telegraph = iframe.contentWindow,        // communication channel to the editor iframe
        latestSource = "";

    // Event listening for proxied event messages from our editor iframe.
    window.addEventListener("message", function(evt) {
      var message = JSON.parse(evt.data);
      if (typeof message.type !== "string" || message.type.indexOf("bramble") === -1) {
        return;
      }
      if (evt.type == "bramble:change") {
        latestSource = evt.sourceCode;
        eventCBs[change].forEach(function(cb){
          cb();
        });
      }
    });

    iframe.onload = function() {
      // TODO: Populate bramble with the code Thimble provides
      //       for this make. See: https://github.com/humphd/brackets/issues/20
    };

    // Tell the iframe to load bramble
    iframe.src = givenOptions.appUrl + "/friendlycode/vendor/brackets/src";

    // Attach the iframe to the dom
    place.append(iframe);

    // Create CodeMirror-like interface for friendlycode to use
    function getValue() {
      return latestSource;
    }
  }

  BrambleProxy.prototype.on = function on(event, callback) {
    if (event === "change") {
      eventCBs.change.push(callback);
    } else if(event === "reparse") {
      eventCBs.reparse.push(callback);
    }
  };

  BrambleProxy.signal = function signal(proxyInstance, eventType, data) {
    eventCBs["reparse"].forEach(function (cb){
      cb({
        error: data.error,
        sourceCode: data.sourceCode,
        document: data.document
      })
    });
  };

  return BrambleProxy;
});
