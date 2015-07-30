"use strict";

var Grammar = require("../lib/grammar");
var assert = require("assert");

var knownTypes = ["button", "close-button", "dialog", "container", "window"];

var ERRORS = {
  noType: /A type could not be found in the description .*\. Please specify one of the registered types: .*/,
  ambiguous: /The description .* is incomplete and cannot be understood\. Ambiguous word .* found but no type was found\./
};

var testData = [
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
  }
];



describe("grammar", function() {
  function testGrammar(test) {
    return new Grammar(test.data.description, test.data.type, knownTypes);
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
