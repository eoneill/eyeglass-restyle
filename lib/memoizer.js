"use strict";

function Memoizer() {
  this.memoized = {};
}
Memoizer.prototype.set = function(name, value) {
  this.memoized[name] = value;
};
Memoizer.prototype.get = function(name) {
  return this.memoized[name];
};

module.exports = Memoizer;
