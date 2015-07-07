"use strict";

var WORD_DELIM = " ";
var WORD_DELIM_PATTERN = /\s+/;
var PREFIX_DELIM = "-";
var PLACEHOLDER = "&";
var WORDS = {
  extra: "on with without".split(WORD_DELIM),
  ignored: "a an and or also the this that is was it".split(WORD_DELIM),
  context: {
    in: "in",
    within: "within",
    child: ">"
  }
};

var NO_TYPE = "NO_TYPE";

/**
 * Creates an instance of Grammar.
 *
 * @constructor
 * @param   {String|Array<String>} description - the description to be converted to a grammar
 * @param   {String} [type] - the type associated with the description. if not provided, the type is extracted from the description
 * @param   {Array<String>} allowedTypes - the allowed types of items
 */
function Grammar(description, type, allowedTypes) {
  this.description = description;
  this.type = type;

  allowedTypes = allowedTypes || [];

  // normalize the description
  normalizeDescription.call(this);

  // if we don't have a type but have a description...
  if (!type && description) {
    // then extract the type from the description
    extractTypeFromDescription.call(this, allowedTypes);
  }

  // if we still don't have a type, then throw an exception
  if (!this.type) {
    throw new Error("A type could not be found in the description `" + this.description.join(WORD_DELIM) + "`. Please specify one of the registered types: " + allowedTypes.join(", "));
  }

  // process the description
  processDescription.call(this, allowedTypes);
}

/**
 * the delimeter used to separate words
 *
 * @constant {String}
*/
Grammar.WORD_DELIM = WORD_DELIM;

/**
 * the no type identifier
 *
 * @constant {String}
*/
Grammar.NO_TYPE = NO_TYPE;

/**
 * checks whether or not an item is within a collection
 *
 * @param   {Array} haystack - the collection to look within
 * @param   {*} needle - the item to check for
 * @returns {Boolean} - whether or not the needle was found in the haystack
 */
function includes(haystack, needle) {
  return (haystack.indexOf(needle) !== -1);
}

/**
 * extracts the type from the description if the type is not already set
 *
 * @this    {Grammar}
 *
 * @param   {Array<String>} allowedTypes - the allowed types of items
 */
function extractTypeFromDescription(allowedTypes) {
  var ambiguousWords = [].concat(WORDS.extra, WORDS.context.in, WORDS.context.within);

  // if we already have a type, we can skip all of this
  if (!this.type) {
    // find the type and filter it out of the description
    this.description = this.description.filter(function(word) {
      if (!this.type) {
        // check for ambiguous statements...
        if (includes(ambiguousWords, word)) {
          // if we found one, throw an error
          throw new Error("The description `" + this.description.join(WORD_DELIM) + "` is incomplete and cannot be understood. Ambiguous word `" + word + "` found but no type was found.");
        }

        // if it's an allowedType, use it as the `type` and remove it from the description
        if (includes(allowedTypes, word)) {
          this.type = word;
          return false;
        }
      }

      // otherwise keep it...
      return true;
    }.bind(this));
  }

  this.type = this.type || null;
}

/**
 * converts `parent > child` syntax into `child in parent`
 *
 * @this    {Grammar}
 */
function adjustChildContext() {
  // split the entire description on the child context word
  var fragments = this.description.join(WORD_DELIM).split(WORDS.context.child);

  // if there's only one fragment, then there's no child context and nothing more to do here, so just return
  if (fragments.length === 1) {
    return;
  }

  // reverse the order of the fragments
  fragments = fragments.reverse();

  // join them with the context switch
  fragments = fragments.join(WORD_DELIM + WORDS.context.in + WORD_DELIM);

  // trim and split
  this.description = fragments.trim().split(WORD_DELIM_PATTERN);
}

/**
 * converts the description/type into a properly formatted grammar
 *
 * @this    {Grammar}
 *
 * @param   {Array<String>} allowedTypes - the allowed types of items
 */
function processDescription(allowedTypes) {
  // if we don't have a description, then there's nothing to do here
  if (!this.description) {
    this.description = null;
    return;
  }

  var newDescription = [];
  var pendingWords = [];

  var prefix = "";
  var extraPrefix = "";
  var contextType = null;
  var hasNewContext;

  /**
   * asserts that there are no pending words
   *
   * @throws  An Error if there are pending words
   */
  function assertNoUnusedWords() {
    // if there are unused (pending) words, throw an error
    if (pendingWords.length) {
      throw new Error("The description `" + this.description.join(WORD_DELIM) + "` could not be understood. The following words were found without being bound to a type: " + pendingWords.join(", "));
    }
  }

  /**
   * adds a word to the new description
   *
   * @param   {String} word - the word to add
   * @param   {Boolean} [withoutPrefix] - if true, word is not prefixed, otherwise it is
   */
  function addWord(word, withoutPrefix) {
    if (word && !includes(newDescription, word)) {
      word = withoutPrefix ? word : prefixWord(word);
      newDescription.push(word);
    }
  }

  /**
   * begins a new context
   *
   * @param   {String} newPrefix - the new prefix for the context
   * @param   {Boolean} [shouldAppend] - if true, the newPrefix is appended to the old prefix
   */
  function startNewContext(newPrefix, shouldAppend) {
    prefix = (shouldAppend && prefix) ? prefix + PREFIX_DELIM + newPrefix : newPrefix;
    contextType = null;
    assertNoUnusedWords();
    pendingWords = [];
    hasNewContext = true;
    extraPrefix = "";
  }

  /**
   * prefixes a given word with the current prefix
   *
   * @param   {String} word - word to be prefixed
   * @returns {String} the prefixed word
   */
  function prefixWord(word) {
    word = word || "";
    word = (extraPrefix ? (extraPrefix + PREFIX_DELIM) : "") + word;
    return prefix ? prefix + (word ? PREFIX_DELIM + word : word) : word;
  }

  // with each word in the description...
  this.description.forEach(function(word) {
    // if the word is empty or ignored, just skip it all together
    if (!word || includes(WORDS.ignored, word)) {
      return;
    }

    // if the word changes the context
    if (word === WORDS.context.in || word === WORDS.context.within) {
      // start a new context with it
      startNewContext(
        (word + PREFIX_DELIM + PLACEHOLDER),  // the prefix
        (word === WORDS.context.in)           // if it's `in`, we append to the existing prefix
      );
    }

    // if it changes the association (e.g. `with`, `without`, etc)
    else if (includes(WORDS.extra, word)) {
      // keep it in the extraPrefix
      extraPrefix = word;
    }

    // if we have already started a new context...
    else if (hasNewContext) {
      // if we already know the new context just push the new word...
      if (contextType) {
        addWord(word);
      }
      // otherwise, if the word is a known type...
      else if (includes(allowedTypes, word)) {
        // update the context type
        contextType = word;
        // update the prefix placeholder
        prefix = prefix.replace(PLACEHOLDER, word);

        // now that we know the type, go back over any pending words we found...
        pendingWords.forEach(function(uWord) {
          addWord(uWord);
        });
        // reset the pending words
        pendingWords = [];

        // add the prefix type directly onto the description
        addWord(prefix, true);
      }
      else {
        pendingWords.push(word);
      }
    }
    // otherwise, add the word with any prefix we currently have
    else {
      addWord(word);
    }

  });

  // assert that we don't have any unused (pending) words at the end
  assertNoUnusedWords();

  // set the new description
  this.description = (newDescription && newDescription.length) ? newDescription : null;
}

/**
 * normalizes the description
 *
 * @this    {Grammar}
 */
function normalizeDescription() {
  if (!this.description) {
    this.description = null;
    return;
  }

  if (typeof this.description === "string") {
    this.description = this.description.split(WORD_DELIM_PATTERN);
  }

  adjustChildContext.call(this);

  this.description = this.description && this.description.length ? this.description : null;
}

module.exports = Grammar;
