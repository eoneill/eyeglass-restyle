# reSTYLE [![Build Status][travis-ci-badge]][travis-ci] [![Version][npm-version-badge]][npm-version] [![License][license-badge]][license]

reSTYLE is an [`eyeglass`][eyeglass] framework for authoring configurable, composable UI patterns.

## Installation

```sh
$ npm install --save-dev eyeglass-restyle
````
### Installing eyeglass

reSTYLE depends on `eyeglass` being installed, so check out the [`eyeglass` installation docs][eyeglass-install]

## Usage

```scss
@import "restyle";

// optional configuration
@include restyle-config(...);
```

## Resources

- [reSTYLE Homepage](http://www.restylecss.com)
- [Getting Started](http://www.restylecss.com/documentation/getting-started)
- [Documentation](http://www.restylecss.com/documentation)
- [Configuration](http://www.restylecss.com/documentation/configuration)

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

We can convert this to a reSTYLE definition as follows:

```scss
@import "restyle";

// define our UI pattern...
@include restyle-define(button, (
  // Note that this is different from a Sass $variable. The Sass $variable will
  //  be evaluated at definition time, whereas the special restyle variable is
  //  evaluated at invocation time. This is important for the cascading
  //  behavior of modifiers/states
  restyle-var(border-color): #3079ed,

  display: inline-block,
  padding: 5px 10px,
  font-weight: bold,
  text-align: center,
  vertical-align: middle,
  border: 1px solid restyle-var(border-color),
  border-radius: 2px,
  background-color: #4787ed,
  color: #fff,
  cursor: pointer,

  restyle-states: (
    hover: (
      background-color: #357ae8,
      border-color: #2f5bb7
    ),

    disabled: (
      border-color: restyle-var(border-color),
      // note that we can reference other values within the definition
      background-color: root(background-color),
      color: root(color),
      opacity: 0.8,
      cursor: default
    )
  ),
  restyle-modifiers: (
    secondary: (
      restyle-var(border-color): rgba(0, 0, 0, 0.1),
      border: 1px solid restyle-var(border-color),
      background-color: #f5f5f5,
      color: #444,

      restyle-states: (
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

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](apache-license)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.


[travis-ci]: https://travis-ci.org/eoneill/eyeglass-restyle
[travis-ci-badge]: https://img.shields.io/travis/eoneill/eyeglass-restyle.svg?style=flat-square
[npm-version]: https://www.npmjs.com/package/eyeglass-restyle
[npm-version-badge]: https://img.shields.io/npm/v/eyeglass-restyle.svg?style=flat-square
[license]: ./LICENSE
[license-badge]: https://img.shields.io/npm/l/eyeglass-restyle.svg?style=flat-square
[eyeglass]: https://github.com/sass-eyeglass/eyeglass
[eyeglass-install]: https://github.com/sass-eyeglass/eyeglass#user-content-installing-eyeglass
[apache-license]: http://www.apache.org/licenses/LICENSE-2.0
