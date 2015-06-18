define(["jquery"], function($) {
  "use strict";

  var FileSystemSync = {};

  function pushFileChange(url, csrfToken, fs, root, path) {
    console.log("Received fileChange event from bramble for ", path);
    console.log("Sending to server at ", url);
    console.log("CSRF token used: ", csrfToken);

    var Path = Bramble.Filer.Path;
    var options = {
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      headers: {
        "X-Csrf-Token": csrfToken
      },
      type: "POST",
      url: url
    };

    function send() {
      var request = $.ajax(options);
      request.done(function() {
        if(request.readyState !== 4) {
          return;
        }

        if(request.status !== 201) {
          // TODO: handle error case here
          console.error("Server did not persist file");
          return;
        }

        console.log("Successfully persisted file");
      });
      request.fail(function() {
        console.error("Failed to send request to persist the file to the server");
      });
    }

    fs.readFile(path, function(err, data) {
      if(err) {
        // TODO: handle errors
        throw err;
      }

      options.data = JSON.stringify({
        path: Path.relative(root, path),
        buffer: data.toJSON()
      });

      send();
    });
  }

  function pushFileDelete() {}

  function pushFileRename() {}

  FileSystemSync.init = function(projectName, persistanceUrls, csrfToken) {
    if(!projectName) {
      return;
    }

    var fs = Bramble.getFileSystem();
    var root = Bramble.Filer.Path.join("/", projectName);

    function configHandler(handler, url) {
      return function() {
        Array.prototype.unshift.call(arguments, url, csrfToken, fs, root);
        handler.apply(null, arguments);
      };
    }

    Bramble.on("ready", function(bramble) {
      bramble.on("fileChange", configHandler(pushFileChange, persistanceUrls.createOrUpdate));
      bramble.on("fileDelete", configHandler(pushFileDelete, persistanceUrls.delete));
      bramble.on("fileRename", configHandler(pushFileRename, persistanceUrls.rename));
    });
  };

  return FileSystemSync;
});
