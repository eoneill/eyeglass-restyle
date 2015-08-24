"use strict";

var eslint = require("gulp-eslint");
var config = require("eyeglass-dev-eslint") || {};

// customize some of these...
var rules = config.rules || {};
rules["max-len"] = undefined;
rules["brace-style"] = [2, "stroustrup"];
rules["max-depth"] = [1, 8];

config.rules = rules;

module.exports = function(gulp, depends) {
  gulp.task("lint", depends, function() {
    var jsSource = [
      "build/**/*.js",
      "lib/**/*.js",
      "test/**/*.js",
      "*.js"
    ];
    return gulp.src(jsSource)
        .pipe(eslint(config))
        .pipe(eslint.formatEach("stylish", process.stderr))
        .pipe(eslint.failOnError());
  });
};
