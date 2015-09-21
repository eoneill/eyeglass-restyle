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

describe("Show throw errors appropriately", function() {
  var tests = [
    {
      description: "#restyle: should throw an exception when no valid type is found",
      data: "@import 'restyle'; .test { @include restyle(test); }",
      expectedError: /A type could not be found in the description `.*`/
    }
  ];

  tests.forEach(function(test) {
    it(test.description, function(done) {
      testutils.assertCompilationError({
        data: test.data
      }, test.expectedError, done);
    });
  });

});
