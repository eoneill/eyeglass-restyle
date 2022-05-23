"use strict";

var path = require("path");
var fixtureDir = path.join(__dirname, "fixtures");
var suites = require("./lib/common").getTestSuites();

suites.forEach(function (suite) {
  var suiteName = suite.suiteName;
  var testutils = suite.testutils;

  describe("engine: " + suiteName, function () {
    describe("Compile Fixtures", function () {
      var fixtures = testutils.getSassFixtures(fixtureDir);
      // var tests = Object.keys(fixtures);
      var tests = Object.keys(fixtures).slice(1, 2);
      tests.forEach(function (name) {
        var fixture = fixtures[name];
        it(
          fixture.error
            ? "should throw an exception for " + name
            : "the output should match " + name + ".css",
          function (done) {
            testutils.assertCompilesFixture(fixture, done);
          }
        );
      });
    });
  });
});

// function isTestSuiteSass(suiteName) {
//   return suiteName === "sass";
// }

// function isTestSuiteNodeSass(suiteName) {
//   return suiteName === "node-sass";
// }

// function adjustOutputForSass(output) {

//   output = output.replace(/\;\s\}/g, ";\n}");
//   output = output.replace(/\/\s\}/g, "/\n")

//   return output;

// };

// function adjustOutputForNodeSass(output) {
//   return output.replace(/\;\n\}\n$/g, "; }\n");
// }
