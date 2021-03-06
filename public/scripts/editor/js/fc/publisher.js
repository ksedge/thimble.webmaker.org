define(function(require) {
  var $ = require("jquery");
  var host;

  var TEXT_PUBLISH = "Publish";
  var TEXT_PUBLISHING = "Publishing...";
  var TEXT_UNPUBLISH = "Unpublish";
  var TEXT_UNPUBLISHING = "Unpublishing...";
  var TEXT_UPDATE_PUBLISH = "Update published version";

  function unpublishedChangesPrompt() {
    var dialog = this.dialog;
    var publish = this.handlers.publish;
    dialog.published.changed.removeClass("hide");
    dialog.buttons.update
      .off("click", publish)
      .on("click", publish);
  }

  function Publisher(options) {
    this.fsync = options.sync;
    host = options.appUrl;
    this.csrfToken = $("meta[name='csrf-token']").attr("content");
    this.dialog = {
      buttons: {
        publish: $("#publish-button-publish"),
        update: $("#publish-button-update"),
        unpublish: $("#publish-button-unpublish")
      },
      description: $("#publish-details > textarea.publish-description"),
      published: {
        link: $("#publish-link > a"),
        changed: $("#publish-changes"),
        container: $("#publish-live")
      }
    };
  }

  Publisher.prototype.init = function(project) {
    var publisher = this;
    var dialog = publisher.dialog;
    publisher.dialog.trackSyncChanges = true;
    publisher.isProjectPublic = true;
    publisher.handlers = {
      publish: publisher.publish.bind(publisher),
      unpublish: publisher.unpublish.bind(publisher),
      unpublishedChangesPrompt: unpublishedChangesPrompt.bind(publisher)
    };

    if(project.description) {
      dialog.description.val(project.description);
    }

    if(project.publishUrl) {
      this.updateDialog(project.publishUrl, true);
    }

    if(publisher.fsync) {
      publisher.fsync.addBeforeEachCallback(function() {
        if(dialog.trackSyncChanges) {
          publisher.disable();
        }
      });
      publisher.fsync.addAfterEachCallback(function() {
        if(dialog.trackSyncChanges) {
          publisher.enable();
          publisher.handlers.unpublishedChangesPrompt();
        }
      });
    }

    dialog.buttons.publish.on("click", publisher.handlers.publish);
  };

  Publisher.prototype.publish = function() {
    var publisher = this;
    var dialog = publisher.dialog;

    function setState(done) {
      var buttons = dialog.buttons;
      var toggle = done ? "on" : "off";

      publisher.togglePublishState(toggle);
      buttons.publish.text(done ? TEXT_PUBLISH : TEXT_PUBLISHING);
      buttons.update.text(done ? TEXT_UPDATE_PUBLISH : TEXT_PUBLISHING);
    }

    function run() {
      var request = publisher.generateRequest("/publish");
      request.done(function(project) {
        if(request.status !== 200) {
          console.error("[Bramble] Server was unable to publish project, responded with status ", request.status);
          return;
        }

        publisher.updateDialog(project.link, true);
      });
      request.fail(function(jqXHR, status, err) {
        console.error("[Bramble] Failed to send request to publish project to the server with: ", err);
      });
      request.always(function() {
        setState(true);
      });
    }

    setState(false);
    dialog.trackSyncChanges = false;

    publisher.fsync.saveAndSyncAll(function(err) {
      if(err) {
        console.error("[Bramble] Failed to publish project");
        setState(true);
        return;
      }

      dialog.trackSyncChanges = true;
      run();
    });
  };

  Publisher.prototype.unpublish = function() {
    var publisher = this;
    var handlers = publisher.handlers;
    var dialog = publisher.dialog;
    var buttons = dialog.buttons;

    function setState(done) {
      buttons.publish[done ? "on" : "off"]("click", handlers.publish);
      buttons.unpublish.children("span").text(done ? TEXT_UNPUBLISH : TEXT_UNPUBLISHING);
    }

    // Disable all actions during the unpublish
    buttons.unpublish.off("click", handlers.unpublish);
    setState(false);

    var request = publisher.generateRequest("/unpublish");
    request.done(function() {
      if(request.status !== 200) {
        console.error("[Bramble] Server was unable to unpublish project, responded with status ", request.status);
        buttons.unpublish.on("click", handlers.unpublish);
        return;
      }

      publisher.updateDialog("");
    });
    request.fail(function(jqXHR, status, err) {
      console.error("[Bramble] Failed to send request to unpublish project to the server with: ", err);
      buttons.unpublish.on("click", handlers.unpublish);
    });
    request.always(function() {
      setState(true);
    });
  };

  Publisher.prototype.generateRequest = function(route) {
    var publisher = this;

    return $.ajax({
      contentType: "application/json",
      headers: {
        "X-Csrf-Token": publisher.csrfToken,
        "Accept": "application/json"
      },
      type: "PUT",
      url: host + route,
      data: JSON.stringify({
        description: publisher.dialog.description.val() || " ",
        public: publisher.isProjectPublic,
        dateUpdated: (new Date()).toISOString()
      })
    });
  };

  Publisher.prototype.updateDialog = function(publishUrl, allowUnpublish) {
    var published = this.dialog.published;
    var unpublishBtn = this.dialog.buttons.unpublish;
    var unpublish = this.handlers.unpublish;

    // Expose the published state with the updated link
    published.link
      .attr("href", publishUrl)
      .text(publishUrl);
    published.changed.addClass("hide");

    // Re-attach the unpublish handler
    if(allowUnpublish) {
      unpublishBtn
        .off("click", unpublish)
        .on("click", unpublish);
      published.container.removeClass("hide");
    } else {
      published.container.addClass("hide");
    }
  };

  Publisher.prototype.enable = function() {
    var buttons = this.dialog.buttons;
    buttons.publish.removeClass("disabled");
    buttons.update.removeClass("disabled");
    this.togglePublishState("on");
  };

  Publisher.prototype.disable = function() {
    var buttons = this.dialog.buttons;
    buttons.publish.addClass("disabled");
    buttons.update.addClass("disabled");
    this.togglePublishState("off");
  };

  Publisher.prototype.togglePublishState = function(state) {
    var buttons = this.dialog.buttons;
    var handlers = this.handlers;
    buttons.publish[state]("click", handlers.publish);
    buttons.update[state]("click", handlers.publish);
  };

  return Publisher;
});
