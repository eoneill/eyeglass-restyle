"use strict";

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

module.exports = {
  isMultiValue: isMultiValue,
  strSubstitute: strSubstitute,
  isLoggingEnabled: isLoggingEnabled
};
