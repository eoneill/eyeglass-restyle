"use strict";

var Grammar = require("../lib/grammar");
var assert = require("assert");
var Testutils = require("eyeglass-dev-testutils");
var testutils = new Testutils({
  engines: {
    sass: require("node-sass"),
    eyeglass: require("eyeglass")
  }
});

var defaultKnownTypes = ["button", "close-button", "dialog", "container", "window"];

var nestedContextStack = [
  [
    new Map([
      ["description", ["small"]],
      ["type", "window"]
    ]),
    new Map([
      ["description", ["large"]],
      ["type", "window"]
    ])
  ],
  [
    new Map([
      ["type", "dialog"]
    ])
  ]
];

var defaultAliases = new Map();
defaultAliases.set("alias1", "button");
defaultAliases.set("alias2", ["small", "button"]);

var defaultGrammarEngines = [
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
  ambiguous: /The description .* is incomplete and cannot be understood\. Ambiguous word .* found but no type was found\./,
  unused: /The description .* could not be understood\. The following words were found without being bound to a type: .*/
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
    name: "empty description",
    data: {
      description: [],
      type: "my-type"
    },
    expectedGrammar: {
      description: null,
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
    name: "remove duplicate words",
    data: {
      description: "small small small primary button"
    },
    expectedGrammar: {
      description: ["small", "primary"],
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
    name: "invalid description with unused words",
    data: {
      description: "button in a car in a window"
    },
    expectedError: ERRORS.unused
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
    name: "alias without aliases",
    data: {
      description: "alias1",
      aliases: []
    },
    expectedError: ERRORS.noType
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
  },
  {
    name: "no custom grammar engine",
    data: {
      description: "custom btn",
      grammarEngines: []
    },
    expectedError: ERRORS.noType
  },
  {
    name: "without knownTypes arg",
    data: {
      description: "a button",
      knownTypes: null
    },
    expectedError: ERRORS.noType
  },
  {
    name: "nested context",
    data: {
      type: "button",
      contextStack: nestedContextStack
    },
    expectedGrammar: {
      description: ["within-window-small", "within-window", "within-window-large", "within-dialog"],
      type: "button"
    }
  },
  {
    name: "nested context",
    data: {
      type: "button",
      description: ["small"],
      contextStack: nestedContextStack
    },
    expectedGrammar: {
      description: ["small", "within-window-small", "within-window", "within-window-large", "within-dialog"],
      type: "button"
    }
  }
];


describe("grammar", function() {
  function testGrammar(test) {
    return new Grammar(
      test.data.description,
      test.data.type,
      test.data.knownTypes === undefined ? defaultKnownTypes : test.data.knownTypes,
      test.data.aliases === undefined ? defaultAliases : test.data.aliases,
      test.data.contextStack || [],
      test.data.grammarEngines === undefined ? defaultGrammarEngines : test.data.grammarEngines
    );
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

describe("adding custom grammar engine", function() {
  var data = "@import 'restyle'; @include restyle-define(test); /* #{inspect(-restyle--grammar(simple test))} */";
  var expectedCSS = "/* (description: custom, type: test) */";

  function customGrammarEngine() {
    this.description = ["custom"];
  }

  it("should allow a custom engine via options", function(done) {
    var options = {
      data: data,
      restyle: {
        grammarEngines: [customGrammarEngine]
      }
    };
    testutils.assertCompiles(options, expectedCSS, done);
  });

  it("should allow a custom engine via #addGrammarEngine", function(done) {
    // create a new instance of eyeglass
    var Eyeglass = testutils.engines.eyeglass;
    var eyeglass = new Eyeglass({
      data: data
    });
    // find the restyle module
    var restyle = eyeglass.modules.find("restyle");
    // invoke the addGrammarEngine
    restyle.addGrammarEngine(customGrammarEngine);

    testutils.assertCompiles(eyeglass.options, expectedCSS, done);
  });
});
