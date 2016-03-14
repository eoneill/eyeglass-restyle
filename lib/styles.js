"use strict";

// dependencies
var clone = require("lodash.clone");
var Grammar = require("./grammar");
var util = require("./util");
var lodashIsEqual = require("lodash.isequal");

// constants
var RESTYLE_DIRECTIVE = "@restyle.";
// `@restyle.` `-restyle--` `restyle\`
// `restyle\` is preferred
var RESTYLE_DIRECTIVE_PREFIX_PATTERN = /^[@-]?restyle(?:\.|\\|-|$)+/;

function getSubDirectivePattern(directive) {
  return new RegExp("^" + directive + "(?:(?:\\s+|\\\\)(\\S+)|\\(\\s*(\\S+)\\s*\\))");
}

function getDirectivePattern(directive) {
  return new RegExp("^(?:(?:@" + directive + "\\.|" + directive + "\\\\)(\\S+)|" + (directive === "var" ? "restyle-var" : directive) + "\\(\\s*(\\S+)\\s*\\))");
}

var RESTYLE_VAR_DIRECTIVE_PATTERN = getSubDirectivePattern("var");
var RESTYLE_FUNCTION_DIRECTIVE_PATTERN = getSubDirectivePattern("function");
var RESTYLE_MODIFIER_DIRECTIVE_PATTERN = getSubDirectivePattern("modifier");
var RESTYLE_STATE_DIRECTIVE_PATTERN = getSubDirectivePattern("state");
var RESTYLE_PRIVATE_DIRECTIVE_PATTERN = getSubDirectivePattern("private");

var THIS_DIRECTIVE_PATTERN = getDirectivePattern("this");
var VAR_DIRECTIVE_PATTERN = getDirectivePattern("var");
var ROOT_DIRECTIVE_PATTERN = getDirectivePattern("root");
var PARENT_DIRECTIVE_PATTERN = getDirectivePattern("parent");
var STATES_DIRECTIVE_PATTERN = getDirectivePattern("states");

var SIMPLE_SELECTOR_PATTERN = /[\[\*\#\.\&\:\s]/;
var WEIGHT_OFFSET = 1000;

var PRESERVED_PROPERTIES = ["states", "meta"];

/**
  * Converts a given set of grammars into their respective style rules.
  *
  * @constructor
  * @param    {Array<Grammar|Map>} grammars - the grammars to resolve
  * @param    {Array<String>} allowedTypes - the allowed types of items
  * @param    {Array<Map>} registeredComponents - the registered components
  * @param    {Map} aliases - the map of aliases
  * @param    {Array<Map>} contextStack - the stack of grammar contexts
  * @param    {Array} grammarEngines - an array of custom grammar engines
  * @param    {Object} moreSassUtils - the instance of `node-sass-more-utils`
  * @returns  {Map} the resolved styles
  */
function Styles(grammars, allowedTypes, registeredComponents, aliases, contextStack, grammarEngines, moreSassUtils) {
  this.allowedTypes = allowedTypes;
  this.aliases = aliases;
  this.contextStack = contextStack;
  this.grammarEngines = grammarEngines;
  this.registeredComponents = registeredComponents;
  this.moreSassUtils = moreSassUtils;

  this.weight = 0;
  this.type = [];
  this.modifier = [];

  var styles = this.processGrammars(grammars);

  // convert the array of styles to a map
  styles = createStylesMap(styles);

  // resolve any unresolved values
  styles = resolveStyleValues(styles);

  return styles;
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
  * Whether or not a string is a restyle directive
  *
  * @param   {String} value - the string to check
  * @returns {Boolean} whether or not the string matches the conditions of a directive
  */
Styles.isDirective = function(value) {
  return RESTYLE_DIRECTIVE_PREFIX_PATTERN.test(value);
};

/**
  * gets the directive name from a string
  *
  * @param   {String} value - the string to check
  * @returns {String} the directive name of the string
  */
Styles.getDirective = function(value) {
  return RESTYLE_DIRECTIVE_PREFIX_PATTERN.test(value) && value.replace(RESTYLE_DIRECTIVE_PREFIX_PATTERN, "");
};

/**
  * diffs two style maps
  *
  * @param   {Map} original - the original `restyle` map
  * @param   {Map} other - the other `restyle` map to compare
  * @param   {Boolean} isDeep - are the values to be resolved deep
  * @returns {Map} the difference between the maps
  */
Styles.diff = function(original, other, isDeep) {
  // if there's no original...
  if (!original) {
    // just return the other
    return other;
  }

  if (!other) {
    return null;
  }

  var styles = new Map();

  original.forEach(function(value, key) {
    var otherValue = other.get(key);
    var directive =  Styles.getDirective(key);
    if (directive || Styles.isSelector(key) || isDeep) {
      styles.set(key, Styles.diff(value, otherValue, directive === "states"));
    }
    else if (!lodashIsEqual(otherValue, value)) {
      // if the otherValue is `null`, look up the `initial` value for the property
      if (otherValue === null) {
        otherValue = util.getInitialValue(key);
      }
      styles.set(key, otherValue);
    }
  });

  other.forEach(function(value, key) {
    if (!(original.has(key) || styles.has(key))) {
      styles.set(key, value);
    }
  });

  return styles;
};

/**
  * Processes the grammar into an array of style rules
  *
  * @param   {Array<Grammar|Map>} grammars - the grammars to process
  * @param   {Integer} [weight = 0] - the weight to offset the rules
  * @returns {Array<Object>} an array that represents the individual style rules and nested styles
  */
Styles.prototype.processGrammars = function(grammars) {
  this.modifier.pop();

  var allStyles = [];

  // for each grammar...
  grammars.forEach(function(grammar) {
    this.weight += Math.pow(WEIGHT_OFFSET, 2);
    // extract the type and description from the grammar
    var isGrammarMap = (grammar instanceof Map);
    var type = isGrammarMap ? grammar.get("type") : grammar.type;
    var description = isGrammarMap ? grammar.get("description") : grammar.description;

    this.type.push(type);

    // get the registered component definition
    var component = this.getComponentDefinition(type);

    // get the styles from the component definition
    var styles = this.extractStylesFromDefinition(component, description);

    // merge all the new styles we got back into the master collection
    mergeStyles(allStyles, styles);

    this.type.pop();
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

function getKeysFromMap(map) {
  var keys = [];
  map.forEach(function(value, key) {
    keys.push(key);
  });
  return keys;
}

/**
  * Given a set of styles (as an array), creates a Map that represents the style rules
  *
  * @param   {Array<Object>} styles - the array of styles
  * @param   {Object} [variables] - the scope of variables to consume
  * @param   {Map} [parent] - the parent style Map
  * @param   {Map} [proxy] - the proxy to `self`
  * @returns {Map} the created styles Map
  */
function createStylesMap(styles, variables, parent, proxy) {
  styles = sortByWeight(styles);

  variables = variables && clone(variables) || {};

  var stylesMap = new Map();

  var selectors;

  stylesMap.self = proxy || stylesMap;
  stylesMap.parent = parent || (proxy && proxy.parent);
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

        // if it's a function, to do some additional processing
        if (item.type === "function") {
          // create a styles map from the value
          item.value = createStylesMap(item.value, variables, null, stylesMap);
        }

        // if the item value needs to be resolved later
        if (doesNeedPostResolution(item.value)) {
          map.keysToResolve = map.keysToResolve || [];
          // stash it
          map.keysToResolve.push(item.key);
        }
        // if requires nested resolution...
        else if (doesNeedPostNestedResolution(item.value)) {
          // augment the value
          item.value.needsNestedResolution = true;
          item.value.self = stylesMap.self;
          item.value.parent = stylesMap.parent;
          item.value.variables = stylesMap.variables;
          item.value.keysToResolve = getKeysFromMap(item.value);

          map.nestedKeysToResolve = map.nestedKeysToResolve || [];
          // stash it
          map.nestedKeysToResolve.push(item.key);
        }

        // set the key-value onto the map
        map.set(item.key, item.value);
      }

      return map;
    }, stylesMap);

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
            // if we have a new state value, we need to merge it
            if (state.value) {
              propObj[state.key] = (propObj[state.key] || []).concat(state.value);
            }
            // otherwise, remove the state entirely
            else {
              propObj[state.key] = null;
            }
          });
          Object.keys(propObj).forEach(function(key) {
            propObj[key] = createStylesMap(propObj[key], variables, stylesMap);
          });
        }
        // other props are ignored
        else {
          return;
        }

        stylesMap.set(RESTYLE_DIRECTIVE + prop, propObj);
        // keep track of it
        stylesMap.nestedKeysToResolve = stylesMap.nestedKeysToResolve || [];
        stylesMap.nestedKeysToResolve.push(RESTYLE_DIRECTIVE + prop);
      }
    });
  }

  return stylesMap;
}

/**
  * Given a Map of styles, resolved pending values (this, var, root, etc)
  *
  * @param   {Map} stylesMap - the styles Map
  * @returns {Map} the resolved styles Map
  */
function resolveStyleValues(stylesMap) {
  var END_MARKER = "END" + Date.now();

  var key;
  var value;

  // resolver for `this` values
  function resolveThisPrefixValue(val) {
    // `this(root(*))` is the same as `root(*)`
    if (ROOT_DIRECTIVE_PATTERN.test(val)) {
      return resolveRootPrefixValue(val.replace(ROOT_DIRECTIVE_PATTERN, "$1$2"));
    }

    var map = stylesMap;
    // handle any `parent`
    while (map && PARENT_DIRECTIVE_PATTERN.test(val)) {
      val = val.replace(PARENT_DIRECTIVE_PATTERN, "$1$2");
      map = map.parent;
    }

    return map && map.self && map.self.get(val);
  }

  function resolveParentPrefixValue(val) {
    return resolveThisPrefixValue("parent(" + val + ")");
  }

  // resolver for `root` values
  function resolveRootPrefixValue(val) {
    var map = stylesMap;
    while (map && map.parent) {
      map = map.parent;
    }
    return map && map.self && map.self.get(val);
  }

  // resolver for `var` values
  function resolveVarPrefixValue(val, map) {
    map = map || stylesMap;
    return map && map.variables && map.variables[val];

  }

  // if we have keys that need resolving...
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
        if (stylesMap.unresolvedStyleValues.length && util.isEqual(stylesMap.unresolvedStyleValues, stylesMap.previousUnresolvedStyleValues)) {
          // this means we're trying to resolve the same things again, but will never find them
          // so throw an error...
          util.logger.error("could not resolve values: " + uniqueArray(stylesMap.unresolvedStyleValues).join(", "));
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

        // handle `this` values...
        [
          {
            pattern: THIS_DIRECTIVE_PATTERN,
            resolver: resolveThisPrefixValue
          },
          {
            pattern: PARENT_DIRECTIVE_PATTERN,
            resolver: resolveParentPrefixValue
          },
          {
            pattern: ROOT_DIRECTIVE_PATTERN,
            resolver: resolveRootPrefixValue
          },
          {
            pattern: VAR_DIRECTIVE_PATTERN,
            resolver: resolveVarPrefixValue
          }
        ].forEach(function(resolver) {
          resolveStyleValue(resolver.pattern, resolver.resolver, value, key, stylesMap);
        });
      }
    }
  }

  // if it has nested styles that need resolution, process them
  if (stylesMap.nestedKeysToResolve && stylesMap.nestedKeysToResolve.length) {
    stylesMap.nestedKeysToResolve.forEach(function(k) {
      var val = stylesMap.get(k);
      if (Styles.isDirective(k) && !(val instanceof Map)) {
        Object.keys(val).forEach(function(i) {
          val[i] = resolveStyleValues(val[i]);
        });
      }
      else {
        stylesMap.set(k, resolveStyleValues(val));
      }
    });
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
  var mustUpdate;
  var wasArray;
  var nestedArraySeparator;

  if (value) {
    wasArray = Array.isArray(value);

    if (!wasArray) {
      value = [value];
    }

    value.some(function(item) {
      var resolvedItem = item;
      // if the pattern matches...
      if (typeof item === "string" && pattern.test(item)) {
        mustUpdate = true;
        // run the resolver function to get the resolved value
        resolvedItem = resolverFn(item.replace(pattern, "$1$2"));

        // if we got nothing back, try again later...
        if (resolvedItem === undefined) {
          stylesMap.unresolvedStyleValues.push(wasArray ? value : value[0]);
          stylesMap.keysToResolve.push(key);
          mustUpdate = false;
          // exit early
          return;
        }
        else {
          stylesMap.unresolvedStyleValues.pop();
        }
      }
      else {
        if (Array.isArray(item)) {
          nestedArraySeparator = item.sassSeparator;
          mustUpdate = true;
          // run the resolver function to get the resolved value
          resolvedItem = item.map(function(deepItem) {
            var rndKey = Math.random();
            resolveStyleValue(pattern, resolverFn, deepItem, rndKey, stylesMap);
            var rItem = stylesMap.get(rndKey);
            stylesMap.set(rndKey);
            return (rItem === undefined) ? deepItem : rItem;
          });
          resolvedItem.sassSeparator = nestedArraySeparator;
        }
      }
      resolvedValue.push(resolvedItem);
    });

    if (mustUpdate) {
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
  var originType = currentItem(this.type);
  var modifier = clone(currentItem(this.modifier));

  this.modifier.pop();

  // adjust the description to remove the current key (which is being aliased)
  description = description.filter(function(item) {
    return modifier.indexOf(item) === -1;
  });

  // merge the new alias onto the description
  description = description.concat(alias).join(Grammar.WORD_DELIM);
  // replace any self reference
  description = description.replace(/(^|\s)this(\s|$)/, "$1" + currentItem(this.type) + "$2");

  // get the grammar
  var grammar = new Grammar(description, null, this.allowedTypes, this.aliases, this.contextStack, this.grammarEngines);

  // find the component
  var component = this.getComponentDefinition(grammar.type);
  this.type.push(grammar.type);

  // get the styles for our new thing
  return this.extractStylesFromDefinition(component, grammar.description, null, grammar.type === originType);
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
  * @param   {Boolean} isPrivateAllowed - whether or not to allow private matches
  * @returns {Array<Object>} the styles
  */
Styles.prototype.extractStylesFromDefinition = function(definition, description, styles, isPrivateAllowed) {
  if (!definition) {
    return null;
  }
  var extras = {};

  styles = styles || [];
  // iterate over _some_ of the definition
  // this is like `definition.forEach()` but gives us an escape valve to exit early given a condition
  someMap(definition, function(value, key) {

    var grammars;
    var type;

    this.weight++;
    // if the key is a directive
    if (Styles.isDirective(key)) {
      key = Styles.getDirective(key);

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
            return new Grammar(grammar, null, this.allowedTypes, this.aliases, this.contextStack, this.grammarEngines);
          }.bind(this));

          mergeStyles(styles, this.processGrammars(grammars));
        }
      }
      else if (key === "meta") {
        styles = addMetaData.call(this, styles, value);
      }
      // if it's `remove`...
      else if (key === "remove") {
        // remove the specified values from the styles
        styles = removeStyles(styles, value);
      }
      // if it's `inherit` or `extends`...
      else if (key === "inherit" || key === "extends") {
        // we have to augment the value to include the current type
        // if it's an array, add the current type to the front of the array
        if (Array.isArray(value)) {
          value.unshift(currentItem(this.type));
        }
        // otherwise, concat to the front of the string
        else {
          value = currentItem(this.type) + " " + value;
        }
        // extract the styles for the alias
        var newStyles = this.extractStylesFromAlias(value, description);
        // if it was from an alias, we should drop any styles we currently have
        if (newStyles.wasFromAlias) {
          styles = newStyles;
        }
        // otherwise merge the styles
        else {
          mergeStyles(styles, newStyles);
        }
      }
      // if it's `alias`...
      else if (key === "alias") {
        // reset the extras
        extras = {};
        // extract the styles for the alias
        styles = this.extractStylesFromAlias(value, description);
        // keep track that this was the result of an alias
        styles.wasFromAlias = true;
        // and exit early
        return true;
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
      // if it's `modifiers`
      else if (key === "modifiers") {
        if (extras.modifiers) {
          value.forEach(function(v, k) {
            extras.modifiers.set(k, v);
          });
        }
        else {
          extras.modifiers = value;
        }
      }
      // if it's `function()`...
      else if (RESTYLE_FUNCTION_DIRECTIVE_PATTERN.test(key)) {
        key = key.replace(RESTYLE_FUNCTION_DIRECTIVE_PATTERN, "$1$2");

        styles.push({
          key: RESTYLE_DIRECTIVE + "function\\" + key,
          // convert it into a styles entry to later handle via createStylesMap
          value: [{
            key: key,
            value: value,
            weight: 0,
            type: "default"
          }],
          weight: this.weight,
          type: "function"
        });
      }
      // if it's `var()`...
      else if (RESTYLE_VAR_DIRECTIVE_PATTERN.test(key)) {
        styles.push({
          key: key.replace(RESTYLE_VAR_DIRECTIVE_PATTERN, "$1$2"),
          value: value,
          weight: this.weight,
          type: "variable"
        });
      }
      // if it's `modifier()`...
      else if (RESTYLE_MODIFIER_DIRECTIVE_PATTERN.test(key)) {
        key = key.replace(RESTYLE_MODIFIER_DIRECTIVE_PATTERN, "$1$2");
        extras.modifiers = extras.modifiers || new Map();
        extras.modifiers.set(key, value);
      }
      // if it's `state()`...
      else if (RESTYLE_STATE_DIRECTIVE_PATTERN.test(key)) {
        styles.states = styles.states || [];
        styles.states.push({
          key: key.replace(RESTYLE_STATE_DIRECTIVE_PATTERN, "$1$2"),
          value: this.extractStylesFromNested(value),
          weight: this.weight,
          type: "state"
        });
      }
      else {
        styles.push({
          key: RESTYLE_DIRECTIVE + key,
          value: value,
          weight: this.weight,
          type: "default"
        });
      }
    }
    else {
      // if the key looks like a selector...
      if (Styles.isSelector(key) || util.normalizeProperty(key) === "@media") {
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
      var modifierGrammar = new Grammar(key, Grammar.NO_TYPE, this.allowedTypes, this.aliases, this.contextStack, this.grammarEngines);

      // adjust all the words we got back as needed
      modifierGrammar.description = modifierGrammar.description.reduce(function(filteredDescription, word) {
        var directive = Styles.getDirective(word);
        // if the word is a `private` directive
        if (RESTYLE_PRIVATE_DIRECTIVE_PATTERN.test(directive)) {
          // and only if privates are allowed...
          if (isPrivateAllowed) {
            // keep the cleaned private word
            filteredDescription.push(directive.replace(RESTYLE_PRIVATE_DIRECTIVE_PATTERN, "$2"));
          }
        }
        else {
          filteredDescription.push(word);
        }
        return filteredDescription;
      }, []);

      // get the word match weight (zero means it's not a match)
      var matchWeight = getMatchWeight(modifierGrammar.description, description);
      // if it is a match...
      if (matchWeight) {
        // get the styles from the modifier definition
        this.modifier.push(modifierGrammar.description);
        styles = this.extractStylesFromDefinition(
          modifier,
          description,
          styles,
          isPrivateAllowed
        );
      }
    }.bind(this));
  }

  return styles;
};

Styles.prototype.getComponentDefinition = function(type) {
  var component = this.registeredComponents.get(type);
  if (component && !(component instanceof Map)) {
    component = this.moreSassUtils.toJS(component);
    this.registeredComponents.set(type, component);
  }
  return component;
};

/**
  * checks whether or not the key/value combination needs nested resolution
  *
  * @param   {*} value - the value
  * @param   {*} type - the type
  * @returns {Boolean} whether or not we need to resolve the nested values
  */
function doesNeedPostNestedResolution(value) {
  return value instanceof Map;
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
  return !!(value && (THIS_DIRECTIVE_PATTERN.test(value) || PARENT_DIRECTIVE_PATTERN.test(value) || ROOT_DIRECTIVE_PATTERN.test(value) || VAR_DIRECTIVE_PATTERN.test(value)));
}

function addMetaData(styles, data) {
  if (data instanceof Map) {
    styles.meta = styles.meta || {};
    if (data.has("class")) {
      addClassification(this, styles.meta, data.get("class"), data.get("description"), data.get("allow-conflicts"));
    }
  }
  return styles;
}

function addClassification(ctx, meta, classification, description, allowConflicts) {
  var modifier = currentItem(ctx.modifier);
  var isCompoundClassification = Array.isArray(classification);
  var isCompoundModifier = modifier && modifier.length > 1;

  var classifications = isCompoundClassification ? classification : [classification];
  meta.classes = meta.classes || [];
  classifications.forEach(function(type) {
    // we won't validate compound classifications for now...
    if (!(isCompoundClassification || isCompoundModifier || allowConflicts)) {
      // for each known classification...
      meta.classes.forEach(function(item) {
        // if it's the same...
        if (item.type === type && !item.allowConflicts) {
          // throw a warning
          util.logger.warn("[restyle] a conflict was found for `" + currentItem(ctx.type) + "`. It can't be both `" + modifier.join(" ") + "` and `" + item.modifier.join(" ") + "` as they both describe the " + type);
          [
            {
              description: description,
              modifier: modifier
            },
            item
          ].forEach(function(i) {
            if (i.description) {
              util.logger.warn("\t" + i.modifier.join(" ") + ": " + (Array.isArray(i.description) ? i.description.join(" ") : i.description));
            }
          });
        }
      });
    }
    // push the new classification...
    meta.classes.push({
      type: type,
      description: description,
      modifier: modifier,
      allowConflicts: allowConflicts
    });
  });
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
  var meta = styles.meta;
  var isPropsArray = Array.isArray(props);
  var shouldRemoveProp = isPropsArray ? function(prop) {
    return props.indexOf(prop) !== -1;
  } : function(prop) {
    return props === prop;
  };

  var removeAllSelectors = shouldRemoveProp("selectors");
  var removeAllFunctions = shouldRemoveProp("functions");

  // if `all` or `true`, reset the whole thing
  if (props === "all" || props === "true") {
    return [];
  }

  if (shouldRemoveProp("states")) {
    states = null;
  }

  // otherwise, reject anything that we're removing
  styles = styles.filter(function(item) {
    var prop = item.key;

    if (removeAllSelectors && Styles.isSelector(prop)) {
      return false;
    }

    if (removeAllFunctions && item.type === "function") {
      return false;
    }

    return !shouldRemoveProp(prop);
  });

  // restore the states if we have them
  if (states) {
    // TODO - this probably needs to preserve properties
    styles.states = states.filter(function(state) {
      if (isPropsArray) {
        return !props.some(function(prop) {
          if (STATES_DIRECTIVE_PATTERN.test(prop)) {
            prop = prop.replace(STATES_DIRECTIVE_PATTERN, "$1$2");
            if (state.key === prop) {
              return true;
            }
          }
        });
      }

      return !(STATES_DIRECTIVE_PATTERN.test(props) && props.replace(STATES_DIRECTIVE_PATTERN, "$1$2") === state.key);
    });
  }

  if (meta) {
    styles.meta = meta;
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
  //if (!(needles && haystack && haystack.length)) {
  //  return 0;
  //}

  // make sure we're dealing with an array
  //if (!Array.isArray(needles)) {
  //  needles = [].concat(needles);
  //}

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

/**
  * gets the current most (last) item from an array
  *
  * @param   {Array} array - the array to look in
  * @returns {*} whatever is found at array.length - 1
  */
function currentItem(array) {
  return array[array.length - 1];
}

module.exports = Styles;
