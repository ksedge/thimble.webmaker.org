define([], function() {
  "use strict";

  var Path = Bramble.Filer.Path;
  var FilerBuffer = Bramble.Filer.Buffer;
  var self = {};

  self.load = function(project, callback) {
    var fs = Bramble.getFileSystem();
    var shell = new fs.Shell();
    var projectFilesUrl = window.location.protocol + "//" + window.location.host + "/initializeProject";
    var request = new XMLHttpRequest();
    var root = project && project.title;

    if(!root) {
      callback(new Error("No project specified"));
      return;
    }

    root = Path.join("/", root);

    function updateFs() {
      if(request.readyState !== 4) {
        return;
      }

      if(request.status !== 200) {
        // TODO: handle error case here
        console.error("Failed to get files for this project");
        callback(new Error("Failed to get files for this project"));
        return;
      }

      var files;

      try {
        files = request.response.files;
      } catch(e) {
        // TODO: handle error case here
        console.error("Failed to get a response");
        callback(new Error("Failed to get a response"));
        return;
      }

      var length = files.length;
      var completed = 0;
      var filePathToOpen;

      function checkProjectLoaded() {
        if(completed === length) {
          callback(null, {
            root: root,
            open: filePathToOpen
          });
        }
      }

      function writeFile(path, data) {
        var parent = Path.dirname(path);

        function write() {
          fs.writeFile(path, data, function(err) {
            if(err) {
              // TODO: handle error case here
              console.error("Failed to write: ", path);
              callback(err);
              return;
            }

            completed++;
            checkProjectLoaded();
          });
        }

        fs.stat(parent, function(err) {
          if(!err || err.code !== "ENOENT") {
            write();
            return;
          }

          shell.mkdirp(parent, write);
        });
      }

      if(!length) {
        // TODO: What should we do here? :P
        callback(new Error("No files to load"));
        return;
      }

      files.forEach(function(file) {
        // TODO: Make this configurable
        if(!filePathToOpen || Path.extname(filePathToOpen) !== ".html") {
          filePathToOpen = file.path;
        }
        file.path = Path.join(root, file.path);
        writeFile(file.path, new FilerBuffer(file.buffer));
      });
    }

    request.onreadystatechange = updateFs;
    request.responseType = "json";
    request.open("GET", projectFilesUrl, true);
    request.send();
  };

  return self;
});
