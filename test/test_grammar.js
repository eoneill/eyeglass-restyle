"use strict";

var Grammar = require("../lib/grammar");
var assert = require("assert");

var knownTypes = ["button", "close-button", "dialog", "container", "window"];

var aliases = new Map();
aliases.set("alias1", "button");
aliases.set("alias2", ["small", "button"]);

var grammarEngines = [
  function splitOnDots(Grammar) {
    if (this.description) {
      this.description = this.description.join(Grammar.WORD_DELIM).replace(/\.+/g, Grammar.WORD_DELIM).split(Grammar.WORD_DELIM);
    }
  },

  function btnsAreButtons(Grammars, allowedTypes) {
    if (!this.type && this.description && allowedTypes.indexOf("button") !== -1) {
      this.description = this.description.filter(function(word) {
        if (word === "btn") {
          this.type = "button";
          return false;
        }
        return true;
      }.bind(this));
    }
  }
];

var ERRORS = {
  noType: /A type could not be found in the description .*\. Please specify one of the registered types: .*/,
  ambiguous: /The description .* is incomplete and cannot be understood\. Ambiguous word .* found but no type was found\./
};

var testData = [
  {
    name: "single type",
    data: {
      description: "button"
    },
    expectedGrammar: {
      description: null,
      type: "button"
    }
  },
  {
    name: "description only (Array)",
    data: {
      description: ["a", "large", "primary", "button"]
    },
    expectedGrammar: {
      description: ["large", "primary"],
      type: "button"
    }
  },
  {
    name: "description only (String)",
    data: {
      description: "a large primary button"
    },
    expectedGrammar: {
      description: ["large", "primary"],
      type: "button"
    }
  },
  {
    name: "description only (String)",
    data: {
      description: "a large primary button"
    },
    expectedGrammar: {
      description: ["large", "primary"],
      type: "button"
    }
  },
  {
    name: "description + type",
    data: {
      description: "something else",
      type: "my-type"
    },
    expectedGrammar: {
      description: ["something", "else"],
      type: "my-type"
    }
  },
  {
    name: "description only with a context",
    data: {
      description: "a large primary button in a dialog"
    },
    expectedGrammar: {
      description: ["large", "primary", "in-dialog"],
      type: "button"
    }
  },
  {
    name: "description with a context (in)",
    data: {
      description: "a large primary button in a dialog"
    },
    expectedGrammar: {
      description: ["large", "primary", "in-dialog"],
      type: "button"
    }
  },
  {
    name: "description with a context (within)",
    data: {
      description: "a large primary button within a dialog"
    },
    expectedGrammar: {
      description: ["large", "primary", "within-dialog"],
      type: "button"
    }
  },
  {
    name: "description with multiple context",
    data: {
      description: "a large primary button in a container within a dialog"
    },
    expectedGrammar: {
      description: ["large", "primary", "in-container", "within-dialog"],
      type: "button"
    }
  },
  {
    name: "description with direct descendant",
    data: {
      description: "dialog > a large primary button"
    },
    expectedGrammar: {
      description: ["large", "primary", "in-dialog"],
      type: "button"
    }
  },
  {
    name: "description with direct descendant",
    data: {
      description: "dialog > a large primary button"
    },
    expectedGrammar: {
      description: ["large", "primary", "in-dialog"],
      type: "button"
    }
  },
  {
    name: "simple `on` in description",
    data: {
      description: "leaf button on a dialog"
    },
    expectedGrammar: {
      description: ["leaf", "on-dialog"],
      type: "button"
    }
  },
  {
    name: "multiple contexts (in with)",
    data: {
      description: "close-button with a shadow in a modeless dialog with a header"
    },
    expectedGrammar: {
      description: ["with-shadow", "in-dialog-modeless", "in-dialog", "in-dialog-with-header"],
      type: "close-button"
    }
  },
  {
    name: "multiple contexts (in in)",
    data: {
      description: "close-button in a dialog in a window"
    },
    expectedGrammar: {
      description: ["in-dialog", "in-dialog-in-window"],
      type: "close-button"
    }
  },
  {
    name: "multiple contexts (in with within with)",
    data: {
      description: "button in a dialog with a shadow within a window with a box"
    },
    expectedGrammar: {
      description: ["in-dialog", "in-dialog-with-shadow", "within-window", "within-window-with-box"],
      type: "button"
    }
  },
  {
    name: "multiple contexts (in with and in)",
    data: {
      description: "button in a dialog with a shadow and a box in a window"
    },
    expectedGrammar: {
      description: ["in-dialog", "in-dialog-with-shadow", "in-dialog-with-box", "in-dialog-in-window"],
      type: "button"
    }
  },
  {
    name: "invalid description without a recognized type",
    data: {
      description: "something else"
    },
    expectedError: ERRORS.noType
  },
  {
    name: "invalid description with ambiguous words",
    data: {
      description: "something else in a window"
    },
    expectedError: ERRORS.ambiguous
  },
  {
    name: "simple alias (as description)",
    data: {
      description: "alias1"
    },
    expectedGrammar: {
      description: null,
      type: "button"
    }
  },
  {
    name: "simple alias (as type)",
    data: {
      type: "alias1"
    },
    expectedGrammar: {
      description: null,
      type: "button"
    }
  },
  {
    name: "alias with modifier",
    data: {
      description: "small alias1"
    },
    expectedGrammar: {
      description: ["small"],
      type: "button"
    }
  },
  {
    name: "complex alias with modifier",
    data: {
      description: "super alias2"
    },
    expectedGrammar: {
      description: ["super", "small"],
      type: "button"
    }
  },
  {
    name: "custom grammar engine",
    data: {
      description: "this will test.a.custom.engine button"
    },
    expectedGrammar: {
      description: ["will", "test", "custom", "engine"],
      type: "button"
    }
  },
  {
    name: "custom grammar engine 2",
    data: {
      description: "custom btn"
    },
    expectedGrammar: {
      description: ["custom"],
      type: "button"
    }
  }
];



describe("grammar", function() {
  function testGrammar(test) {
    return new Grammar(test.data.description, test.data.type, knownTypes, aliases, grammarEngines);
  }

  testData.forEach(function(test) {
    var testGrammarFn = testGrammar.bind(testGrammar, test);

    it(test.name, function() {
      if (test.expectedError) {
        assert.throws(testGrammarFn, test.expectedError, "should throw an error");
      }
      else {
        assert.deepEqual(testGrammarFn(), test.expectedGrammar, "the grammar should match");
      }
    });
  });
});
