"use strict";

var jsdoc = require("gulp-jsdoc3");
var config = require("./config");

var infos = {};
var name = "eyeglass-restyle";

module.exports = function(gulp, depends) {
  gulp.task("jsdoc", depends || [], function () {
    return gulp.src("lib/**/*.js")
      .pipe(jsdoc.parser(infos, name))
      .pipe(jsdoc.generator(config.codeDocs + "/jsdoc"));
  });
};
