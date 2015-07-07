"use strict";

var path = require("path");
var pkg = require("./package.json");
var pkgName = pkg.eyeglass && pkg.eyeglass.name || pkg.name;
var Grammar = require("./lib/grammar");
var Styles = require("./lib/styles");
var util = require("./lib/util");
var crc = require("crc");

var SASS_DIR = path.join(__dirname, "sass");


function namespaceFunctions(functions) {
  var prefix = "-" + pkgName + "--";
  var suffix = "-js";
  var namespacedFunctions = {};
  var SIGNATURE_START = "(";

  Object.keys(functions).forEach(function(key) {
    var fragments = key.split(SIGNATURE_START);
    fragments[0] = prefix + fragments[0].trim() + suffix;

    namespacedFunctions[fragments.join(SIGNATURE_START)] = functions[key];
  });

  return namespacedFunctions;
}

module.exports = function(eyeglass, sass) {
  var sassUtils = require("node-sass-utils")(sass);
  var moreSassUtils = require("node-sass-more-utils")(sass, sassUtils);

  var toJS = moreSassUtils.toJS;
  var toSass = moreSassUtils.toSass;

  return {
    sassDir: SASS_DIR,
    functions: namespaceFunctions({
      "grammar-from-description($description, $type, $allowed-types: ())": function($description, $type, $allowedTypes, done) {
        // get the grammar
        var grammar = new Grammar(
          toJS($description),
          toJS($type),
          toJS($allowedTypes)
        );
        // and return a SassMap
        done(toSass(grammar));
      },

      "styles-from-grammar($grammars, $allowed-types, $registered-components)": function($grammars, $allowedTypes, $registeredComponents, done) {
        var styles = new Styles(
          toJS($grammars),
          toJS($allowedTypes),
          toJS($registeredComponents)
        );

        // and return a SassMap
        done(toSass(styles));
      },

      "is-selector($key)": function($key, done) {
        var result = Styles.isSelector(toJS($key));
        done(toSass(result));
      },

      "checksum($data)": function($data, done) {
        var data = sassUtils.sassString($data);
        var checksum = crc.crc32(data).toString(16);

        done(toSass(checksum));
      },

      "is-multivalue($value)": function($value, done) {
        var result = util.isMultiValue(toJS($value));
        done(toSass(result));
      },

      "normalize-property($property)": function($property, done) {
        var result = toJS($property).replace(/\{.*\}/g, "");
        done(toSass(result));
      }
    })
  };
};
