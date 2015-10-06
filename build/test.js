"use strict";

var istanbul = require("gulp-istanbul");
var mocha = require("gulp-mocha");

module.exports = function(gulp, depends, options) {
  options = options || {};
  gulp.task("test", depends, function (cb) {
    gulp.src(["*.js", "lib/**/*.js", "test/*.js"])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on("finish", function () {
      gulp.src(["test/**/test_*.js"], {
        read: false
      })
      .pipe(mocha({
        reporter: "spec"
      }))
      .pipe(istanbul.writeReports()) // Creating the reports after tests runned
      .pipe(istanbul.enforceThresholds({
        thresholds: options.coverage && options.coverage.thresholds
      }))
      .on("end", cb)
      .on("error", function(e) {
        console.error(e.toString());
        process.exit(1);
      });
    });
  });
};
