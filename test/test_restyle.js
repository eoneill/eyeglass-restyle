"use strict";

var path = require("path");
var Testutils = require("eyeglass-dev-testutils");
var testutils = new Testutils({
  engines: {
    sass: require("node-sass"),
    eyeglass: require("eyeglass").bind(null)
  }
});

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
