"use strict";

var git = require("gulp-git");
var bump = require("gulp-bump");
var prompt = require("gulp-prompt");
var shell = require("gulp-shell");
var tagVersion = require("gulp-tag-version");
var addSrc = require("gulp-add-src");
var gulpIf = require("gulp-if");
var conventionalChangelog = require("gulp-conventional-changelog");

var changelogSource = "CHANGELOG.md";
var pkgSource = "package.json";

var versionTypes = ["patch", "minor", "major", "prerelease"];

module.exports = function(gulp, depends, options) {
  options = options || {};

  function increment(type) {
    // get all the files to bump version in
    return gulp.src(pkgSource)
      // bump the version number in those files
      .pipe(bump({type: type}))
      // save it back to filesystem
      .pipe(gulp.dest("./"))
      // commit the changed version number
      .pipe(git.commit("chore(release): bump version"))
      // update the CHANGELOG
      .pipe(addSrc(changelogSource))
      .pipe(gulpIf(changelogSource, conventionalChangelog({
        preset: options.changelogConvention || "angular"
      })))
      .pipe(gulpIf(changelogSource, gulp.dest("./")))
      .pipe(git.commit("chore(release): update CHANGELOG"))
      // tag it
      .pipe(gulpIf(pkgSource, tagVersion()))
      // push it all
      // can't use git.push until this is resolved...
      // https://github.com/ikari-pl/gulp-tag-version/issues/8
      //.pipe(git.push("origin", "master", {args: "--tags"}));
      .pipe(shell("git push origin master --tags"));
  }

  gulp.task("release", depends, function(done) {
    return gulp.src(pkgSource)
      .pipe(prompt.prompt({
          type: "checkbox",
          name: "type",
          message: "What type of release would you like to do?",
          choices: versionTypes
      }, function(result){
        var type = result.type[0];
        if (type) {
          return increment(type);
        }
      }));
  });

  versionTypes.forEach(function(version) {
    gulp.task("release:" + version, depends, increment.bind(increment, version));
  });
};
