"use strict";

var initialValues;

var lodashIsEqual = require("lodash.isequal");

function isMultiValue(value) {
  return !!(value && value.get && value.get("@restyle.multivalue") !== undefined);
}

function strSubstitute(str, data) {
  if (!data) {
    return str;
  }
  return (str || "").replace(/\{([^\}]+)\}/g, function(match, key) {
    return data.hasOwnProperty(key) ? data[key] : (data.has && data.has(key) ? data.get(key) : match);
  });
}

function isNextConfigEnabled(config, keys) {
  if (!keys.length || !config) {
    return false;
  }

  var pivot = keys.shift();

  config = config.get(pivot);

  return (config === true) || isNextConfigEnabled(config, keys) || false;
}

function isLoggingEnabled(config, type) {
  return !!((config && type) && (config === true) || isNextConfigEnabled(config, type.split(":")));
}

function normalizeProperty(property, preservePrefix) {
  property = property.replace(/(?:\{.*\}|\\.*)$/g, "");
  if (!preservePrefix) {
    property = property.replace(/^-[^-]+/, "");
  }
  return property;
}

function getInitialValue(property) {
  property = normalizeProperty(property);
  initialValues = initialValues || require("./css-initial-values.json");

  var value = initialValues[property];
  if (Array.isArray(value)) {
    value.sassSeparator = false;
  }
  return value;
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

  return lodashIsEqual(item1, item2);
}

function isEqualObject(item1, item2) {
  var itemOneKeys = Object.keys(item1);
  var itemTwoKeys = Object.keys(item2);
  if (!isEqual(itemOneKeys.sort(), itemTwoKeys.sort())) {
    return false;
  }

  return !itemOneKeys.some(function(key) {
    var itemOneValue = item1[key];
    var itemTwoValue = item2[key];
    if (!isEqual(itemOneValue, itemTwoValue)) {
      return true;
    }
  });
}

function isEqualMap(item1, item2) {
  var isSame = true;
  var itemOneKeys = [];

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

var logger = {
  warn: console.warn,
  log: console.log,
  error: function(msg) {
    throw new Error(msg);
  }
};

function timer(time) {
  if (time) {
    time = process.hrtime(time);
    // normalize to ms
    return (time[0] * 1000) + (time[1] / 1000000);
  }
  else {
    return process.hrtime();
  }
}

module.exports = {
  isMultiValue: isMultiValue,
  strSubstitute: strSubstitute,
  isLoggingEnabled: isLoggingEnabled,
  getInitialValue: getInitialValue,
  normalizeProperty: normalizeProperty,
  isEqual: isEqual,
  logger: logger,
  timer: timer
};
