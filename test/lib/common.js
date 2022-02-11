var Testutils = require("eyeglass-dev-testutils");

module.exports = {
  getTestSuites: function () {
    var testSuites = [];

    var nodeSassTestutils = new Testutils({
      engines: {
        sass: require("node-sass"),
        eyeglass: require("eyeglass").bind(null)
      }
    });

    testSuites.push({
      name: "node-sass",
      testutils: nodeSassTestutils
    });

    var dartSassTestutils = new Testutils({
      engines: {
        sass: require("sass"),
        eyeglass: require("eyeglass").bind(null)
      }
    });

    // Uncomment to enable dart-sass test suites
    // testSuites.push({
    //   name: "dart-sass",
    //   testutils: dartSassTestutils
    // });

    return testSuites;
  }
};
