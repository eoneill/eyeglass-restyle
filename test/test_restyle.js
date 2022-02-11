"use strict";

var path = require("path");
var fixtureDir = path.join(__dirname, "fixtures");
var testSuites = require("./lib/common").getTestSuites();

testSuites.forEach(function (suite) {
  describe(suite.name, function () {
    var testutils = suite.testutils;
      describe("Compile Fixtures", function () {
        var fixtures = testutils.getSassFixtures(fixtureDir);
        Object.keys(fixtures).forEach(function(name) {
          var fixture = fixtures[name];
          it(fixture.error ? ("should throw an exception for " + name) : ("the output should match " + name + ".css"), function(done) {
            testutils.assertCompilesFixture(fixture, done);
          });
        });
      });
  });
});

