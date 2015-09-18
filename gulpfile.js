"use strict";

var gulp = require("gulp");

require("./build/sassdoc")(gulp);
require("./build/docco")(gulp);
require("./build/jsdoc")(gulp);

require("./build/release")(gulp, ["test"]);
require("./build/publish")(gulp, ["test"]);

require("./build/lint")(gulp);
require("./build/test")(gulp, ["lint"], {
  coverage: {
    thresholds: {
      global: {
        statements: 96,
        branches: 89,
        functions: 98,
        lines: 96
      }
    }
  }
});

gulp.task("default", ["test"]);

gulp.task("docs", ["docco", "jsdoc", "sassdoc"]);
gulp.task("doc", ["docs"]); // alias `doc` to `docs`
