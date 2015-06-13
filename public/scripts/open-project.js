(function(){
  var projects = document.getElementById("projects").children;

  Array.prototype.forEach.call(projects, function(project) {
    project.addEventListener("click", function() {
      window.location.pathname += "loadProject/" + project.getAttribute("data-project-id");
    });
  });
})();
