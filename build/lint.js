"use strict";

var eslint = require("gulp-eslint");
var config = require("eyeglass-dev-eslint") || {};

// customize some of these...
var rules = config.rules || {};
rules["max-len"] = undefined;
rules["brace-style"] = [2, "stroustrup"];
rules["max-depth"] = [1, 8];

// for ESLint 1.0 support
// can remove this once eyeglass-dev-eslint 2.x lands
var SPACE_IN_BRACKETS = "space-in-brackets";
var spaceInBracketsRule = rules[SPACE_IN_BRACKETS];
if (spaceInBracketsRule) {
  rules["object-curly-spacing"] = rules["computed-property-spacing"] = rules["array-bracket-spacing"] = spaceInBracketsRule;
  rules[SPACE_IN_BRACKETS] = undefined;
}

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
