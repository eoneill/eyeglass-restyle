"use strict";

// dependencies
var clone = require("lodash.clone");
var Grammar = require("./grammar");
var util = require("./util");

// constants
var RESTYLE_DIRECTIVE = "@restyle";
var RESTYLE_DIRECTIVE_PATTERN = /^[@-]restyle[\.-]*/;
var RESTYLE_VAR_DIRECTIVE_PATTERN = /^var\s+/;
var RESTYLE_FUNCTION_DIRECTIVE_PATTERN = /^function\s+/;
var THIS_DIRECTIVE_PATTERN = /^@this\./;
var VAR_DIRECTIVE_PATTERN = /^@var\./;
var ROOT_DIRECTIVE_PATTERN = /^@root\./;
var PARENT_DIRECTIVE_PATTERN = /^@parent\./;
var STATES_DIRECTIVE_PATTERN = /^@states\./;
var SIMPLE_SELECTOR_PATTERN = /[\[\*\#\.\&\:\s]/;
var WEIGHT_OFFSET = 1000;

var PRESERVED_PROPERTIES = ["states", "functions"];

/**
 * Converts a given set of grammars into their respective style rules.
 *
 * @constructor
 * @param   {Array<Grammar|Map>} grammars - the grammars to resolve
 * @param   {Array<String>} allowedTypes - the allowed types of items
 * @param   {Array<Map>} registeredComponents - the registered components
 * @returns {Map} the resolved styles
 */
function Styles(grammars, allowedTypes, registeredComponents) {
  this.allowedTypes = allowedTypes;
  this.registeredComponents = registeredComponents;

  this.weight = 0;

  var styles = this.processGrammars(grammars);

  // convert the array of styles to a map
  styles = createStylesMap(styles);

  // resolve any unresolved values
  return resolveStyleValues(styles);
}

/**
 * Whether or not a string qualifies as a selector
 *
 * @param   {String} value - the string to check
 * @returns {Boolean} whether or not the string matches the conditions of a selector
 */
Styles.isSelector = function(value) {
  return SIMPLE_SELECTOR_PATTERN.test(value);
};

/**
 * Processes the grammar into an array of style rules
 *
 * @param   {Array<Grammar|Map>} grammars - the grammars to process
 * @param   {Integer} [weight = 0] - the weight to offset the rules
 * @returns {Array<Object>} an array that represents the individual style rules and nested styles
 */
Styles.prototype.processGrammars = function(grammars) {
  resetCurrent.call(this);

  var allStyles = [];

  // for each grammar...
  grammars.forEach(function(grammar) {
    this.weight += Math.pow(WEIGHT_OFFSET, 2);
    // extract the type and description from the grammar
    var isGrammarMap = (grammar instanceof Map);
    var type = isGrammarMap ? grammar.get("type") : grammar.type;
    var description = isGrammarMap ? grammar.get("description") : grammar.description;

    this.current.type = type;

    // if the type is not a supported type, throw an exception here
    if (this.allowedTypes.indexOf(type) === -1) {
      throw new Error(description.join(" ") + " does not contain an identifier. please specify one of: " + this.allowedTypes.join(", "));
    }

    // get the registered component definition
    var component = this.registeredComponents.get(type);

    // get the styles from the component definition
    var styles = this.extractStylesFromDefinition(component, description);

    // merge all the new styles we got back into the master collection
    mergeStyles(allStyles, styles);
  }.bind(this));

  return allStyles;
};

/**
 * Merges a set of styles into a master collection of styles
 *
 * @param   {Array<Object>} allStyles - the master collection of styles
 * @param   {Array<Object>} styles - the styles to merge
 */
function mergeStyles(allStyles, styles) {
  var preservedProps = {};
  if (styles) {
    PRESERVED_PROPERTIES.forEach(function(prop) {
      if (styles[prop]) {
        preservedProps[prop] = styles[prop];
      }
    });

    allStyles.push.apply(allStyles, styles);

    Object.keys(preservedProps).forEach(function(prop) {
      allStyles[prop] = allStyles[prop] || [];
      allStyles[prop].push.apply(allStyles[prop], preservedProps[prop]);
    });
  }
}

/**
 * Sorts an array of object by their respective `weight`
 *
 * @param   {Array<Object>} styles - the array to sort
 * @returns {Array<Object>} the sorted array
 */
function sortByWeight(styles) {
  function sort(a, b) {
    return a.weight - b.weight;
  }
  // sort based on the weight
  styles = styles && styles.sort && styles.sort(sort) || null;

  return styles;
}

/**
 * Given a set of styles (as an array), creates a Map that represents the style rules
 *
 * @param   {Array<Object>} styles - the array of styles
 * @param   {Object} [variables] - the scope of variables to consume
 * @param   {Map} [parent] - the parent style Map
 * @returns {Map} the created styles Map
 */
function createStylesMap(styles, variables, parent) {
  styles = sortByWeight(styles);

  variables = variables && clone(variables) || {};

  var stylesMap = new Map();

  var selectors;

  stylesMap.self = stylesMap;
  stylesMap.parent = parent;
  stylesMap.variables = variables;

  if (styles) {
    // then transform the collection into a Map
    stylesMap = styles.reduce(function(map, item) {
      if (item.type === "variable") {
        variables[item.key] = item.value;
      }

      else if (item.type === "selector") {
        selectors = selectors || {};
        // if they're both arrays, we have to merge them...
        if (Array.isArray(item.value) && Array.isArray(selectors[item.key])) {
          selectors[item.key].push.apply(selectors[item.key], item.value);

          PRESERVED_PROPERTIES.forEach(function(prop) {
            if (selectors[item.key][prop] && item.value[prop]) {
              selectors[item.key][prop].push.apply(selectors[item.key][prop], item.value[prop]);
            }
            else {
              selectors[item.key][prop] = selectors[item.key][prop] || item.value[prop];
            }
          });
        }
        else {
          selectors[item.key] = item.value;
        }
      }

      else {
        // if the item value needs to be resolved later
        if (doesNeedPostResolution(item.value)) {
          map.keysToResolve = map.keysToResolve || [];
          // stash it
          map.keysToResolve.push(item.key);
        }
        // if requested nested resolution...
        else if (doesNeedPostNestedResolution(item.value, item.key)) {
          map.nestedKeysToResolve = map.nestedKeysToResolve || [];
          // stash it
          map.nestedKeysToResolve.push(item.key);
        }
        // if requested multivalue resolution...
        else if (doesNeedPostMultiValueResolution(item.value)) {
          // augment the value
          item.value.isMultiValue = true;
          item.value.self = stylesMap.self;
          item.value.parent = stylesMap.parent;
          item.value.variables = stylesMap.variables;
          item.value.keysToResolve = ["@restyle.multivalue"];

          map.nestedKeysToResolve = map.nestedKeysToResolve || [];
          // stash it
          map.nestedKeysToResolve.push(item.key);
        }

        // set the key-value onto the map
        map.set(item.key, item.value);
      }

      return map;
    }, stylesMap) || null;

    // process any selectors we've collected
    if (selectors) {
      Object.keys(selectors).forEach(function(selector) {
        stylesMap.set(selector, createStylesMap(selectors[selector], variables, stylesMap));
        stylesMap.nestedKeysToResolve = stylesMap.nestedKeysToResolve || [];
        stylesMap.nestedKeysToResolve.push(selector);
      });
    }

    PRESERVED_PROPERTIES.forEach(function(prop) {
      var propObj = {};
      if (styles[prop]) {
        if (prop === "states") {
          styles.states.forEach(function(state) {
            propObj[state.key] = (propObj[state.key] || []).concat(state.value);
          });
          Object.keys(propObj).forEach(function(key) {
            propObj[key] = createStylesMap(propObj[key], variables, stylesMap);
          });
        }
        else if (prop === "functions") {
          var fnMap = createStylesMap(styles.functions, variables, stylesMap);
          fnMap.self = stylesMap;
          propObj = {
            calls: fnMap
          };
        }

        stylesMap.set(RESTYLE_DIRECTIVE + "." + prop, propObj);
        // keep track of it
        stylesMap.nestedKeysToResolve = stylesMap.nestedKeysToResolve || [];
        stylesMap.nestedKeysToResolve.push(RESTYLE_DIRECTIVE + "." + prop);
      }
    });
  }

  return stylesMap;
}

/**
 * Given a Map of styles, resolved pending values (e.g. `@this.X`, `@var.X`)
 *
 * @param   {Map} stylesMap - the styles Map
 * @returns {Map} the resolved styles Map
 */
function resolveStyleValues(stylesMap) {
  var END_MARKER = "END" + Date.now();

  var key;
  var value;

  // resolver for `@this.*` values
  function resolveThisPrefixValue(val) {
    // `@this.@root.*` is the same as `@root.*`
    if (ROOT_DIRECTIVE_PATTERN.test(val)) {
      return resolveRootPrefixValue(val.replace(ROOT_DIRECTIVE_PATTERN, ""));
    }

    var map = stylesMap;
    while (map && PARENT_DIRECTIVE_PATTERN.test(val)) {
      val = val.replace(PARENT_DIRECTIVE_PATTERN, "");
      map = map.parent;
    }
    return map && map.self && map.self.get(val);
  }

  // resolver for `@root.*` values
  function resolveRootPrefixValue(val) {
    var map = stylesMap;
    while (map && map.parent) {
      map = map.parent;
    }
    return map && map.self && map.self.get(val);
  }

  // resolver for `@var.*` values
  function resolveVarPrefixValue(val, map) {
    map = map === undefined ? stylesMap : map;
    return map && (map.variables && map.variables[val] || resolveVarPrefixValue(val, map.parent || null));
  }

  // if we have keys that need resolving...
  if (stylesMap) {
    if (stylesMap.keysToResolve && stylesMap.keysToResolve.length) {

      // push a marker to keep track of when the current set ends
      // this marker is used to determine if we've hit a dead end
      stylesMap.keysToResolve.push(END_MARKER);

      // keep track of the current and previous unresolved values
      stylesMap.unresolvedStyleValues = [];
      stylesMap.previousUnresolvedStyleValues = [];

      // for each key that needs resolving...
      while (stylesMap.keysToResolve.length) {
        // get the next key in the list
        key = stylesMap.keysToResolve.shift();
        // if the key is the end marker
        if (key === END_MARKER) {
          // if there are unresolved styles and the current and previous unresolved styles are the same...
          if (stylesMap.unresolvedStyleValues.length && isEqual(stylesMap.unresolvedStyleValues, stylesMap.previousUnresolvedStyleValues)) {
            // this means we're trying to resolve the same things again, but will never find them
            // so throw an error...
            throw new Error("could not resolve values: " + uniqueArray(stylesMap.unresolvedStyleValues).join(", "));
          }
          // otherwise, if there are still items to resolve...
          else if (stylesMap.keysToResolve.length) {
            // add a new end marker
            stylesMap.keysToResolve.push(END_MARKER);
            // move the current to the previous
            stylesMap.previousUnresolvedStyleValues = stylesMap.unresolvedStyleValues;
          }
        }
        // otherwise...
        else {
          // get the value
          value = stylesMap.get(key);

          // handle values that start with `@this.`...
          resolveStyleValue(THIS_DIRECTIVE_PATTERN, resolveThisPrefixValue, value, key, stylesMap);

          // handle values that start with `@root.`...
          resolveStyleValue(ROOT_DIRECTIVE_PATTERN, resolveRootPrefixValue, value, key, stylesMap);

          // handle values that start with `@var.`...
          resolveStyleValue(VAR_DIRECTIVE_PATTERN, resolveVarPrefixValue, value, key, stylesMap);
        }
      }
    }

    // if it has nested styles that need resolution, process them
    if (stylesMap.nestedKeysToResolve && stylesMap.nestedKeysToResolve.length) {
      stylesMap.nestedKeysToResolve.forEach(function(k) {
        var val = stylesMap.get(k);
        if (val) {
          if (RESTYLE_DIRECTIVE_PATTERN.test(k)) {
            Object.keys(val).forEach(function(i) {
              val[i] = resolveStyleValues(val[i]);
            });
          }
          else if (Styles.isSelector(k) || (val && val.isMultiValue)) {
            stylesMap.set(k, resolveStyleValues(val));
          }
        }
      });
    }
  }

  return stylesMap;
}

/**
 * Resolves an individual value against a given pattern and sets it back onto the Map
 *
 * @param   {RegExp} pattern - the pattern to resolve against
 * @param   {Function} resolverFn - the function to resolve with
 * @param   {*} value - the value to resolve
 * @param   {String} key - the key associated with the value to be resolved
 * @param   {Map} stylesMap - the styles Map
 */
function resolveStyleValue(pattern, resolverFn, value, key, stylesMap) {
  var resolvedValue = [];
  var canUpdate;
  var wasArray;

  if (value) {
    wasArray = Array.isArray(value);

    if (!wasArray) {
      value = [value];
    }

    value.some(function(item) {
      var resolvedItem;
      // if the pattern matches...
      if (typeof item === "string" && pattern.test(item)) {
        canUpdate = true;
        // run the resolver function to get the resolved value
        resolvedItem = resolverFn(item.replace(pattern, ""));
        // if we got nothing back, try again later...
        if (resolvedItem === undefined) {
          stylesMap.unresolvedStyleValues.push(wasArray ? value : value[0]);
          stylesMap.keysToResolve.push(key);
          canUpdate = false;
          return;
        }

        resolvedValue.push(resolvedItem);
      }
      else {
        resolvedValue.push(item);
      }
    });

    if (canUpdate) {
      if (wasArray) {
        resolvedValue.sassSeparator = value.sassSeparator;
      }
      else {
        resolvedValue = resolvedValue[0];
      }

      // update the value in the map
      stylesMap.set(key, resolvedValue);
      // and if it needs further resolution...
      if (doesNeedPostResolution(resolvedValue)) {
        stylesMap.unresolvedStyleValues.push(resolvedValue);
        // keep track of it
        stylesMap.keysToResolve.push(key);
      }
      // otherwise...
      else {
        // it resolved so remove it from the tracker
        stylesMap.unresolvedStyleValues.pop();
      }
    }
  }
}

/**
 * Extracts the styles from an aliased definition
 *
 * @param   {Array<String>|String} alias - the alias to remap to
 * @param   {Array<String>} description - the original description
 * @returns {Array<Object>} the styles
 */
Styles.prototype.extractStylesFromAlias = function(alias, description) {
  var modifier = [].concat(this.current.modifier);
  var currentType = this.current.type;

  resetCurrent.call(this);

  // adjust the description to remove the current key (which is being aliased)
  description = description.filter(function(item) {
    return modifier.indexOf(item) === -1;
  });

  // merge the new alias onto the description
  description = description.concat(alias).join(Grammar.WORD_DELIM);
  // replace any self reference
  description = description.replace(/(^|\s)@this(\s|$)/, "$1" + currentType + "$2");

  // get the grammar
  var grammar = new Grammar(description, null, this.allowedTypes);

  // find the component
  var component = this.registeredComponents.get(grammar.type);
  this.current.type = grammar.type;

  // get the styles for our new thing
  return this.extractStylesFromDefinition(component, grammar.description, null);
};

/**
 * Extracts the styles from a nested definition
 *
 * @param   {Map} nested - the nested definition
 * @param   {Integer} weight - the weight offset
 * @returns {Array<Object>} the styles
 */
Styles.prototype.extractStylesFromNested = function(nested) {
  return this.extractStylesFromDefinition(nested, null);
};

/**
 * Extracts the styles from a definition
 *
 * @param   {Map} definition - the definition
 * @param   {Array<String>} description - the description
 * @param   {Array<Object>} styles - the existing (incoming) styles
 * @returns {Array<Object>} the styles
 */
Styles.prototype.extractStylesFromDefinition = function(definition, description, styles) {
  if (!definition) {
    return null;
  }
  var extras = {};
  var type;

  styles = styles || [];
  // iterate over _some_ of the definition
  // this is like `definition.forEach()` but gives us an escape valve to exit early given a condition
  someMap(definition, function(value, key) {

    var grammars;

    this.weight++;
    // if the key starts with `@restyle.*`
    if (RESTYLE_DIRECTIVE_PATTERN.test(key)) {
      // strip the prefix
      key = key.replace(RESTYLE_DIRECTIVE_PATTERN, "");

      // if it's a `restyle`...
      if (!key || key === "restyle") {
        if (value) {
          grammars = [];
          if (value.sassSeparator) {
            grammars.push.apply(grammars, value);
          }
          else {
            grammars.push(value);
          }
          grammars = grammars.map(function(grammar) {
            return new Grammar(grammar, null, this.allowedTypes);
          }.bind(this));

          mergeStyles(styles, this.processGrammars(grammars));
        }
      }
      // if it's `remove`...
      else if (key === "remove") {
        // remove the specified values from the styles
        styles = removeStyles(styles, value);
      }
      // if it's `alias` or `inherit` or `extends`...
      else if (key === "alias" || key === "inherit" || key === "extends") {
        // if it's an inherit, we have to augment the value to include the current type
        if ((key === "inherit" || key === "extends") && value) {
          value = typeof value === "string" ? this.current.type + " " + value : value.shift(this.current.type);
        }
        // reset the extras
        extras = {};
        // extract the styles for the alias
        styles = this.extractStylesFromAlias(value, description);

        // and exit early if it's an alias
        if (key === "alias") {
          return true;
        }
      }
      // if it's `states`...
      else if (key === "states") {
        value.forEach(function(itemValue, itemKey) {
          styles.states = styles.states || [];
          styles.states.push({
            key: itemKey,
            value: this.extractStylesFromNested(itemValue),
            weight: this.weight,
            type: "state"
          });
        }.bind(this));
      }
      // if it's `function`...
      else if (RESTYLE_FUNCTION_DIRECTIVE_PATTERN.test(key)) {
        styles.functions = styles.functions || [];
        styles.functions.push({
          key: key.replace(RESTYLE_FUNCTION_DIRECTIVE_PATTERN, ""),
          value: value,
          weight: this.weight,
          type: "function"
        });
      }
      // if it's `var`...
      else if (RESTYLE_VAR_DIRECTIVE_PATTERN.test(key)) {
        styles.push({
          key: key.replace(RESTYLE_VAR_DIRECTIVE_PATTERN, ""),
          value: value,
          weight: this.weight,
          type: "variable"
        });
      }
      // if it's `modifiers`
      else if (key === "modifiers") {
        extras.modifiers = value;
      }
    }
    else {
      // if the key looks like a selector...
      if (Styles.isSelector(key)) {
        value = this.extractStylesFromNested(value);
        type = "selector";
      }
      // push the key-value
      styles.push({
        key: key,
        value: value,
        weight: this.weight,
        type: type || "default",
        valueStr: (type) ? null : value && value.toString()
      });
    }
  }.bind(this));

  // if we have modifiers...
  if (extras.modifiers && description) {
    // for each modifier...
    extras.modifiers.forEach(function(modifier, key) {
      var modifierGrammar = new Grammar(key, Grammar.NO_TYPE, this.allowedTypes);

      // get the word match weight (zero means it's not a match)
      var matchWeight = getMatchWeight(modifierGrammar.description, description);
      // if it is a match...
      if (matchWeight) {
        // get the styles from the modifier definition
        this.current.modifier = modifierGrammar.description;
        styles = this.extractStylesFromDefinition(
          modifier,
          description,
          styles
        );
      }
    }.bind(this));
  }

  return styles;
};

/**
 * resets the current context
 *
 * @this    {Styles}
 */
function resetCurrent() {
  this.current = {
    modifier: null
  };
}

function doesNeedPostMultiValueResolution(value) {
  return util.isMultiValue(value) && doesNeedPostResolution(value.get("@restyle.multivalue"));
}

/**
 * checks whether or not the key/value combination needs nested resolution
 *
 * @param   {*} value - the value
 * @param   {*} key - the key
 * @returns {Boolean} whether or not we need to resolve the nested values
 */
function doesNeedPostNestedResolution(value, key) {
  return !!(value && (RESTYLE_DIRECTIVE_PATTERN.test(key) || Styles.isSelector(key)));
}

/**
 * checks whether or not the key/value needs post resolution
 *
 * @param   {*} value - the value
 * @param   {*} key - the key
 * @returns {Boolean} whether or not we need to resolve the values
 */
function doesNeedPostResolution(value) {
  if (Array.isArray(value)) {
    return value.some(function(val) {
      if (doesNeedPostResolution(val)) {
        return true;
      }
    });
  }
  // check if the value is something that needs post resolution
  return !!(value && (THIS_DIRECTIVE_PATTERN.test(value) || ROOT_DIRECTIVE_PATTERN.test(value) || VAR_DIRECTIVE_PATTERN.test(value)));
}

/**
 * compares whether or not two items are equivalent
 *
 * @param   {*} item1 - the first item
 * @param   {*} item2 - the second item
 * @returns {Boolean} whether or not both items are equivalent
 */

function isEqual(item1, item2) {
  if (typeof item1 !== typeof item2) {
    return false;
  }

  if (Array.isArray(item1)) {
    return !((item1.length !== item2.length) || item1.some(function(item, i) {
      if (!isEqual(item, item2[i])) {
        return true;
      }
    }));
  }

  if (item1 instanceof Map) {
    return isEqualMap(item1, item2) && isEqualObject(item1, item2);
  }

  if (typeof item1 === "object") {
    return isEqualObject(item1, item2);
  }
}

function isEqualObject(item1, item2) {
  var itemOneKeys = Object.keys(item1);
  var itemTwoKeys = Object.keys(item2);
  if (!isEqual(itemOneKeys, itemTwoKeys)) {
    return false;
  }

  return !itemOneKeys.some(function(itemOneValue, i) {
    var itemTwoValue = item2[i];
    if (!isEqual(itemOneValue, itemTwoValue)) {
      return true;
    }
  });
}

function isEqualMap(item1, item2) {
  var isSame = true;
  var itemOneKeys = [];

  if (item1 instanceof Map) {
    if (!(item2 instanceof Map)) {
      return false;
    }

    // check that the items are the same...
    item1.forEach(function(value, key) {
      itemOneKeys.push(key);
      if (!isEqual(value, item2.get(key))) {
        isSame = false;
      }
    });

    if (!isSame) {
      return false;
    }

    // check that the keys are the same...
    item2.forEach(function(value, key) {
      if (itemOneKeys.indexOf(key) === -1) {
        isSame = false;
      }
    });
    return isSame;
  }
  return false;
}

/**
 * removes a set of properties from a styles array
 *
 * @param   {Array} styles - the array of styles
 * @param   {Array<String>|String} props - the property/properties to remove
 * @returns {Array} the styles array after any removals
 */
function removeStyles(styles, props) {
  var states = styles.states;
  var functions = styles.functions;
  var isPropsArray = Array.isArray(props);
  var shouldRemoveProp = isPropsArray ? function(prop) {
    return props.indexOf(prop) !== -1;
  } : function(prop) {
    return props === prop;
  };

  var removeAllSelectors = shouldRemoveProp("selectors");

  // if `all` or `true`, reset the whole thing
  if (props === "all" || props === "true") {
    return [];
  }

  if (shouldRemoveProp("states")) {
    states = null;
  }

  if (shouldRemoveProp("functions")) {
    functions = null;
  }

  // otherwise, reject anything that we're removing
  styles = styles.filter(function(item) {
    var prop = item.key;

    if (removeAllSelectors && Styles.isSelector(prop)) {
      return false;
    }

    return !shouldRemoveProp(prop);
  });

  // restore the states if we have them
  if (states) {
    styles.states = states.filter(function(state) {
      if (isPropsArray) {
        return !props.some(function(prop) {
          if (STATES_DIRECTIVE_PATTERN.test(prop)) {
            prop = prop.replace(STATES_DIRECTIVE_PATTERN, "");
            if (state.key === prop) {
              return true;
            }
          }
        });
      }

      return !(STATES_DIRECTIVE_PATTERN.test(props) && props.replace(STATES_DIRECTIVE_PATTERN, "") === state.key);
    });
  }

  if (functions) {
    styles.functions = functions;
  }

  return styles;
}

/**
 * computes a "match weight" from a given haystack and needles
 *
 * @param   {Array<String>|String} needles - the needles to match for
 * @param   {Array} haystack - the haystack to match within
 * @returns {Integer} the computed weight
 */
function getMatchWeight(needles, haystack) {
  var i = 0;
  var len;

  // if we don't have needles and a haystack, return zero early
  if (!(needles && haystack && haystack.length)) {
    return 0;
  }

  // make sure we're dealing with an array
  if (!Array.isArray(needles)) {
    needles = [].concat(needles);
  }

  // for each needle...
  for (i = 0, len = needles.length; i < len; i++) {
    // if it doesn't match, return zero...
    if (haystack.indexOf(needles[i]) === -1) {
      return 0;
    }
    // otherwise, we continue on
  }

  // return the length (total matches);
  return len * WEIGHT_OFFSET;
}

/**
 * removes any identical items from an array
 *
 * @param   {Array} array - the array to make unique
 * @returns {Array} the unique array
 */
function uniqueArray(array) {
  return array.filter(function(item, i, arr) {
    return arr.indexOf(item) === i;
  });
}

/**
 * lightweight helper for iterating over a Map with escape criteria
 *
 * @param   {Map} map - the Map to iterate over
 * @param   {Array} fn - the callback to invoke for each value/key pair
 */
function someMap(map, fn) {
  var iter = map.entries();
  var item;

  while (iter) {
    item = iter.next();
    if (!item || !item.value || fn(item.value[1], item.value[0]) || item.done) {
      return;
    }
  }
}

module.exports = Styles;
