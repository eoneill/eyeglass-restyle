"use strict";

var gulp = require("gulp");

require("./build/sassdoc")(gulp);
require("./build/docco")(gulp);
require("./build/jsdoc")(gulp);

require("./build/eclint")(gulp);
require("./build/lint")(gulp);

require("./build/test")(gulp, ["eclint", "lint"], {
  coverage: {
    thresholds: {
      global: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});

require("./build/release")(gulp, ["test"]);
require("./build/publish")(gulp, ["test"]);

gulp.task("default", ["test"]);

gulp.task("docs", ["docco", "jsdoc", "sassdoc"]);
gulp.task("doc", ["docs"]); // alias `doc` to `docs`
