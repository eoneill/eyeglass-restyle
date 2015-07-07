# restyle

[![Build Status](https://travis-ci.org/eoneill/eyeglass-restyle.svg)](https://travis-ci.org/eoneill/eyeglass-restyle)
[![Version](https://img.shields.io/npm/v/eyeglass-restyle.svg)](https://www.npmjs.com/package/eyeglass-restyle)
[![License](https://img.shields.io/npm/l/eyeglass-restyle.svg)](./LICENSE)

`restyle` is an [`eyeglass`](/sass-eyeglass/eyeglass) framework for authoring configurable, composable UI definitions.

## Installation

```sh
$ npm install --save-dev eyeglass-restyle
````
### Installing eyeglass

`restyle` depends on `eyeglass` being installed, so check out the [`eyeglass` installation docs](/sass-eyeglass/eyeglass)

## Usage

```scss
@import "restyle";

// optional configuration
@include restyle-config(...);
```

## Quick Example
Take the following button styles...

```css
.btn {
  display: inline-block;
  padding: 5px 10px;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #3079ed;
  border-radius: 2px;
  background-color: #4787ed;
  color: #fff;
  cursor: pointer;
}
.btn:hover {
   background-color: #357ae8;
   border-color: #2f5bb7;
}
.btn[disabled] {
  border-color: #3079ed;
  background-color: #4787ed;
  color: #fff;
  opacity: 0.8;
  cursor: default;
}


.btn.secondary {
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
  color: #444444;
}
.btn.secondary:hover {
  background-color: #e0e0e0;
  color: #333333;
}
.btn.secondary[disabled] {
  border-color: rgba(0, 0, 0, 0.1);
  background-color: #f5f5f5;
  color: #444444;
}
```

We can convert this to a `restyle` definition as follows:

```scss
@import "restyle";

// define our UI element...
@include restyle-add(button, (
  // Note that this is different from a Sass $variable. The Sass $variable will
  //  be evaluated at definition time, whereas the special restyle variable is
  //  evaluated at invocation time. This is important for the cascading
  //  behavior of modifiers/states
  '@restyle.var border-color': #3079ed,

  display: inline-block,
  padding: 5px 10px,
  font-weight: bold,
  text-align: center,
  vertical-align: middle,
  border: 1px solid '@var.border-color',
  border-radius: 2px,
  background-color: #4787ed,
  color: #fff,
  cursor: pointer,

  '@restyle.states': (
    hover: (
      background-color: #357ae8,
      border-color: #2f5bb7
    ),

    disabled: (
      border-color: '@var.border-color',
      // note that we can reference other values within the definition
      background-color: '@root.background-color',
      color: '@root.color',
      opacity: 0.8,
      cursor: default
    )
  ),
  '@restyle.modifiers': (
    secondary: (
      '@restyle.var border-color': rgba(0, 0, 0, 0.1),
      border: 1px solid '@var.border-color',
      background-color: #f5f5f5,
      color: #444,

      '@restyle.states': (
        hover: (
          background-color: #e0e0e0,
          border-color: null,
          color: #333
        )
      )
    )
  )
));

// register the states (note that this would be a "per app" configuration)
@include restyle-add-state((
  hover: '&:hover',
  disabled: '&[disabled]'
));

// ...

// now invoke it...
.btn {
  @include restyle(button);
  &.secondary {
    @include restyle(secondary button);
  }
}
```

This is probably a bit complex for everyone, so stay tuned for some additional elaboration.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
