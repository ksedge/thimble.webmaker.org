(function(){
  var projects = document.getElementById("projects").children;

  Array.prototype.forEach.call(projects, function(project) {
    project.addEventListener("click", function() {
      window.location.pathname += "project/" + project.getAttribute("data-project-id");
    });
  });
})();
