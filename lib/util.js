"use strict";

function isMultiValue(value) {
  return !!(value && value.get && value.get("@restyle.multivalue") !== undefined);
}

module.exports = {
  isMultiValue: isMultiValue
};
