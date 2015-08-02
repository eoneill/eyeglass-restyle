"use strict";

var testutils = require("eyeglass-dev-testutils");
var path = require("path");

var fixtureDir = path.join(__dirname, "fixtures");
var fixtures = testutils.getSassFixtures(fixtureDir);

describe("Compile Fixtures", function() {
  Object.keys(fixtures).forEach(function(name) {
    var fixture = fixtures[name];
    it("the output should match " + name + ".css", function(done) {
      testutils.assertCompiles(fixture.source, fixture.expected, done);
    });
  });
});
