"use strict";

var gulp = require("gulp");

require("./build/sassdoc")(gulp);
require("./build/docco")(gulp);
require("./build/jsdoc")(gulp);

require("./build/release")(gulp);
require("./build/publish")(gulp);

require("./build/lint")(gulp);
require("./build/test")(gulp, ["lint"], {
  coverage: {
    thresholds: {
      global: {
        //statements: 95.05,
        //branches: 86.64,
        //functions: 97.14,
        //lines: 95.05
      }
    }
  }
});

gulp.task("default", ["test"]);

gulp.task("docs", ["docco", "jsdoc", "sassdoc"]);
gulp.task("doc", ["docs"]); // alias `doc` to `docs`
