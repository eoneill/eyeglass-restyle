"use strict";

var docco = require("gulp-docco");
var config = require("./config");

var options = {};

module.exports = function(gulp, depends) {
  gulp.task("docco", depends || [], function () {
    return gulp.src("lib/**/*.js")
      .pipe(docco(options))
      .pipe(gulp.dest(config.codeDocs + "/docco"));
  });
};
