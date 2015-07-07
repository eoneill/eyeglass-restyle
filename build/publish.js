"use strict";

var spawn = require("child_process").spawn;

module.exports = function(gulp, depends) {
  gulp.task("publish", function(done) {
    var options = {
      stdio: "inherit"
    };
    spawn("npm", ["publish"], options).on("close", done);
  });
};
