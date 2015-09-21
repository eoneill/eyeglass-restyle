"use strict";

var testutils = require("eyeglass-dev-testutils");
var path = require("path");

var fixtureDir = path.join(__dirname, "fixtures");
var fixtures = testutils.getSassFixtures(fixtureDir);

describe("Compile Fixtures", function() {
  Object.keys(fixtures).forEach(function(name) {
    var fixture = fixtures[name];
    it(fixture.error ? ("should throw an exception for " + name) : ("the output should match " + name + ".css"), function(done) {
      testutils.assertCompilesFixture(fixture, done);
    });
  });
});
