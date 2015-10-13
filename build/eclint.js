"use strict";

var eclint = require("eclint");
var path = require("path");

var sources = [
  "*",
  ".*",
  "{lib,sass,test,build}/**/*"
];

module.exports = function(gulp, depends) {

  gulp.task("eclint", function() {
    var hasErrors = false;
    var stream = gulp.src(sources)
    .pipe(eclint.check({
      reporter: function(file, message) {
        hasErrors = true;
        var relativePath = path.relative(".", file.path);
        console.error(relativePath + ":", message);
      }
    }));

    stream.on("finish", function() {
      if (hasErrors) {
        process.exit(1);
      }
    });

    return stream;
  });

  gulp.task("eclint:fix", function() {
    return gulp.src(sources, {
      base: "./"
    })
    .pipe(eclint.fix())
    .pipe(gulp.dest("."));
  });
};
