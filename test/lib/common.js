var Testutils = require("eyeglass-dev-testutils");
var prettier = require('prettier');

function formatter(str) {
  return prettier.format(str, {
    "parser": "css",
    "htmlWhitespaceSensitivity": "strict"
  });
}

module.exports = {
  getTestSuites: function () {
    var testSuites = [];

    var nodeSassTestutils = new Testutils({
      engines: {
        sass: require("node-sass"),
        eyeglass: require("eyeglass").bind(null),
      },
      options: {
        formatter: formatter,
      },
      eyeglass: {
        useGlobalModuleCache: false,
      },
    });

    testSuites.push({
      suiteName: "node-sass",
      testutils: nodeSassTestutils,
    });

    var dartSassTestutils = new Testutils({
      engines: {
        sass: require("sass"),
        eyeglass: require("eyeglass").bind(null),
      },
      options: {
        formatter: formatter,
      },
      eyeglass: {
        useGlobalModuleCache: false,
      },
    });

    // Uncomment to enable dart-sass test suites
    testSuites.push({
      suiteName: "sass",
      testutils: dartSassTestutils,
    });

    return testSuites;
  },
};
