/**
 * GET for the index.html template
 */
var querystring = require("querystring");
var request = require("request");
var config = require("./config");

// Bramble routes
var home = require("./home");
var usersProjects = require("./view-user-projects");
var setProject = require("./set-current-project");
var getProject = require("./get-current-project");
var newProject = require("./new-project");
var deleteProject = require("./delete-project");
var renameProject = require("./rename-project");
var createOrUpdateProjectFile = require("./create-or-update-file");
var deleteProjectFile = require("./delete-file");
var publish = require("./publish");
var unpublish = require("./unpublish");
var tutorial = require("./tutorial");

// Content-fetching function used for generating the output
// on http://[...]/data routes via the index.rawData function.
function getPageData(req) {
  var content = "";
  if (req.pageData) {
    content = req.pageData;
    if (req.query.mode && req.query.mode === "remix") {
      content = content.replace(/<title([^>]*)>/, "<title$1>Remix of ");
    }
  }
  return content;
}

module.exports = function(utils, nunjucksEnv, appName) {
  config.appName = appName;
  var cryptr = config.cryptr;
  var oauth = config.oauth;
  var renderHomepage = home(config);
  var renderUsersProjects = usersProjects(config);

  return {
    index: function(req, res) {
      var qs = querystring.stringify(req.query);
      if(qs !== "") {
        qs = "?" + qs;
      }

      if(req.user && !req.session.project) {
        res.redirect(301, "/projects/" + qs);
        return;
      }

      renderHomepage(req, res);
    },
    projects: renderUsersProjects,
    homepage: renderHomepage,
    openProject: setProject(config),
    newProject: newProject(config),
    createOrUpdateProjectFile: createOrUpdateProjectFile(config),
    deleteProjectFile: deleteProjectFile(config),
    getProject: getProject(config),
    deleteProject: deleteProject(config),
    renameProject: renameProject(config),
    publish: publish(config),
    unpublish: unpublish(config),
    tutorialTemplate: tutorial.template(config),
    tutorialStyleGuide: tutorial.styleGuide(config),

    rawData: function(req, res) {
      res.type('text/plain; charset=utf-8');
      res.send(getPageData(req));
    },

    oauth2Callback: function(req, res, next) {
      if (req.query.logout) {
        req.session = null;
        return res.redirect(301, '/');
      }

      if (!req.query.code) {
        return next({ status: 401, message: "OAUTH: Code required" });
      }

      if (!req.cookies.state || !req.query.state) {
        return next({ status: 401, message: "OAUTH: State required" });
      }

      if (req.cookies.state !== req.query.state) {
        return next({ status: 401, message: "OAUTH: Invalid state" });
      }

      if (req.query.client_id !== oauth.client_id) {
        return next({ status: 401, message: "OAUTH: Invalid client credentials" });
      }

      // First, fetch the token
      request.post({
        url: oauth.authorization_url + '/login/oauth/access_token',
        form: {
          client_id: oauth.client_id,
          client_secret: oauth.client_secret,
          grant_type: "authorization_code",
          code: req.query.code
        }
      }, function(err, response, body) {
        if (err) {
          console.log("Request error: ", err, " Body: ", body);
          return next({ status: 500, message: "Internal server error. See logs for details" });
        }

        if (response.statusCode !== 200) {
          console.log("Code " + response.statusCode + ". Error getting access token: ", body);
          return next({ status: response.statusCode, message: body });
        }

        try {
          body = JSON.parse(body);
        } catch(e) {
          return next({status: 500, err: e});
        }

        req.session.token = cryptr.encrypt(body.access_token);

        // Next, fetch user data
        request.get({
          url: oauth.authorization_url + "/user",
          headers: {
            "Authorization": "token " + body.access_token
          }
        }, function(err, response, body) {
          if (err) {
            console.log("Request error: ", err, " Body: ", body);
            return next({ status: 500, message: "Internal server error. See logs for details" });
          }

          if (response.statusCode !== 200) {
            console.log("Code " + response.statusCode + ". Error getting user data: ", body);
            return next({ status: response.statusCode, message: body });
          }

          try {
            req.session.user = JSON.parse(body);
          } catch(e) {
            return next({status: 500, err: e});
          }
          res.redirect(301, '/');
        });
      });
    }
  };
};
