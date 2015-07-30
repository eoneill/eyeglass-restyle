"use strict";

var gulp = require("gulp");

require("./build/lint")(gulp);
require("./build/test")(gulp, ["lint"]);
require("./build/sassdoc")(gulp);
require("./build/docco")(gulp);
require("./build/jsdoc")(gulp);
require("./build/release")(gulp);
require("./build/publish")(gulp);
require("./build/coverage")(gulp);

gulp.task("default", ["test"]);

gulp.task("docs", ["docco", "jsdoc", "sassdoc"]);
gulp.task("doc", ["docs"]); // alias `doc` to `docs`
