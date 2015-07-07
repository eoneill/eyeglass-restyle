"use strict";

var git = require("gulp-git");
var bump = require("gulp-bump");
var tagVersion = require("gulp-tag-version");

module.exports = function(gulp, depends) {
  function increment(type) {
    // get all the files to bump version in
    return gulp.src(["./package.json"])
      // bump the version number in those files
      .pipe(bump({type: type}))
      // save it back to filesystem
      .pipe(gulp.dest("./"))
      // commit the changed version number
      .pipe(git.commit("bump version"))
      // tag it in the repository
      .pipe(tagVersion());
  }

  gulp.task("release:patch", depends, increment.bind("patch"));
  gulp.task("release:minor", depends, increment.bind("minor"));
  gulp.task("release:major", depends, increment.bind("major"));
};
