"use strict";

var sassdoc = require("sassdoc");
var config = require("./config");

var options = {
  dest: config.codeDocs + "/sassdoc"
};

module.exports = function(gulp, depends) {
  gulp.task("sassdoc", depends || [], function () {
    return gulp.src("sass/**/*.s[ac]ss")
      .pipe(sassdoc(options));
  });
};
