define([], function() {
  "use strict";

  var FileSystemSync = {};

  function pushFileChange(serverURL, path) {
    console.log("Received fileChange event from bramble for ", path);
    console.log("Sending to server at ", serverURL);
  }

  function pushFileDelete() {}

  function pushFileRename() {}

  FileSystemSync.init = function(persistanceUrls) {
    function configHandler(handler, serverURL) {
      return function() {
        arguments.unshift(serverURL);
        handler.apply(null, arguments);
      };
    }

    Bramble.on("ready", function(bramble) {
      bramble.on("fileChange", configHandler(pushFileChange, persistanceUrls.createOrUpdate));
      bramble.on("fileDelete", configHandler(pushFileDelete, persistanceUrls.delete));
      bramble.on("fileRename", configHandler(pushFileRename, persistanceUrls.rename));
    });
  };
});
