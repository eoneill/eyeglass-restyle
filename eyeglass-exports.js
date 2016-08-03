"use strict";

var path = require("path");
var pkg = require("./package.json");
var pkgName = pkg.eyeglass && pkg.eyeglass.name;
var Grammar = require("./lib/grammar");
var Styles = require("./lib/styles");
var util = require("./lib/util");
var Memoizer = require("./lib/memoizer");
var crc = require("crc");
var merge = require("lodash.merge");

var SASS_DIR = path.join(__dirname, "sass");


function namespaceFunctions(functions) {
  var prefix = "-" + pkgName + "--";
  var suffix = "-js";
  var SIGNATURE_START = "(";

  return Object.keys(functions).reduce(function(namespacedFunctions, key) {
    var fragments = key.split(SIGNATURE_START);
    fragments[0] = prefix + fragments[0].trim() + suffix;

    namespacedFunctions[fragments.join(SIGNATURE_START)] = functions[key];

    return namespacedFunctions;
  }, {});
}

module.exports = function(eyeglass, sass) {
  var sassUtils = require("node-sass-utils")(sass);
  var moreSassUtils = require("node-sass-more-utils")(sass, sassUtils);
  var grammarEngines = new Set();

  function addGrammarEngine(engine) {
    grammarEngines.add(engine);
  }

  var options = eyeglass.options.restyle = merge({}, eyeglass.options.restyle, {
    // here for back-compat with eyeglass < 0.8.0
    addGrammarEngine: addGrammarEngine
  });

  if (options.grammarEngines) {
    options.grammarEngines.forEach(addGrammarEngine);
  }

  var toJS = moreSassUtils.toJS;
  var toSass = moreSassUtils.toSass;

  var globalContext = {};

  function getMemoizer(context) {
    /* istanbul ignore next - ignored because this is here for different node-sass/eyeglass versions */
    if (!(context && context.options)) {
      context = globalContext;
    }

    if (!(context.restyle && context.restyle.memoizer)) {
      context = merge(context, {
        restyle: {
          memoizer: new Memoizer()
        }
      });
    }

    return context.restyle.memoizer;
  }

  return {
    sassDir: SASS_DIR,
    addGrammarEngine: addGrammarEngine,
    functions: namespaceFunctions({
      "memoize($name, $value: undefined, $options: ())": function($name, $value, $options, done) {

        var memoizer = getMemoizer(this);
        var options = toJS($options);
        var value = toJS($value, {
          shallow: (options instanceof Map) && options.get("shallow")
        });
        var name = toJS($name);

        memoizer.set(name, value);
        done(toSass(value));
      },

      "grammar-from-description($description, $type)": function($description, $type, done) {
        var memoizer = getMemoizer(this);
        // get the grammar
        var grammar = new Grammar(
          toJS($description),
          toJS($type),
          memoizer.get("types"),
          memoizer.get("aliases"),
          memoizer.get("grammar-context-stack"),
          // pass along the custom grammar engines
          grammarEngines
        );
        // and return a SassMap
        done(toSass(grammar));
      },

      "styles-from-grammar($grammars, $variables: ())": function($grammars, $variables, done) {
        var memoizer = getMemoizer(this);
        var styles = new Styles(
          toJS($grammars),
          memoizer.get("types"),
          memoizer.get("patterns"),
          memoizer.get("aliases"),
          memoizer.get("grammar-context-stack"),
          // pass along the custom grammar engines
          grammarEngines,
          // pass along moreSassUtils
          moreSassUtils,
          // incoming custom variables
          toJS($variables)
        );

        // and return a SassMap
        done(toSass(styles));
      },

      "styles-from-diff($original, $other)": function($original, $other, done) {
        var styles = Styles.diff(toJS($original), toJS($other));

        done(toSass(styles));
      },

      "is-selector($key)": function($key, done) {
        var result = Styles.isSelector(toJS($key));
        done(toSass(result));
      },

      "get-directive($value)": function($value, done) {
        var result = Styles.getDirective(toJS($value));
        done(toSass(result));
      },

      "checksum($data)": function($data, done) {
        var data = sassUtils.sassString($data);
        var checksum = crc.crc32(data).toString(16);

        done(toSass(checksum));
      },

      "is-multivalue($value)": function($value, done) {
        var result = util.isMultiValue(toJS($value, {
          shallow: true
        }));
        done(toSass(result));
      },

      "normalize-property($property)": function($property, done) {
        var result = util.normalizeProperty(toJS($property), true);
        done(toSass(result));
      },

      "str-substitute($string, $data)": function($string, $data, done) {
        var result = util.strSubstitute(toJS($string), toJS($data));
        done(toSass(result));
      },

      "is-logging-enabled($type, $config)": function($type, $config, done) {
        var result = util.isLoggingEnabled(toJS($config), toJS($type));
        done(toSass(result));
      },

      "timer($time: null)": function($time, done) {
        var result = util.timer(toJS($time));
        if (typeof result === "number") {
          done(sass.types.Number(result, "ms"));
        }
        else {
          done(toSass(result));
        }
      },

      "normalize-word($word)": function($word, done) {
        var word = toJS($word);
        var normalizedWord = util.normalizeWord(word);
        done(toSass(normalizedWord));
      }
    })
  };
};
