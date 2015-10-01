# Contributing to reSTYLE

0. Fork **reSTYLE**
  - New to GitHub? Read this great article about [forking and contributing to open-source projects on GitHub](https://help.github.com/articles/fork-a-repo)
0. Update the [Issue Tracker](http://github.com/eoneill/eyeglass-restyle/issues)
  - if there's already an open ticket, feel free to comment on it or ask any follow up questions
  - if there isn't a ticket, create one and let us know what you plan to do
  - we like to keep an open dialog with developers :)
0. Code away!
0. Update or create test cases for your changes
0. Make sure all tests are passing `$ npm test` (or `$ gulp test`)
0. Commit and push your changes (referencing any related issues in the comment)
0. Finally, create a [Pull Request](https://help.github.com/articles/creating-a-pull-request)

## Testing

Don't be **that guy** that broke the build. Tests help us ensure that everything is functioning the way it _should_ be and help us ensure back-compat, or provide a clean migration path.

When making changes to reSTYLE code, there should (almost always) be accompanying test cases. If you're modifying existing functionality, make sure the current tests are passing, or update them to be accurate.
If you're adding new functionality, you must also add test cases to cover it's behavior.

All the test cases live in [`test/`](./test).

To run the test suite, simply run:

```sh
npm test
```

## Coding Standards

### General

- Use two "soft spaces", not tabs for indentation
- Always use proper indentation
- Use `$gulp eclint` and `$gulp eclint:fix` to find and fix any whitespace convention issues, respectively

### Sass

- Functions, mixins, and variables should be lowercase and hyphenated (e.g. `$this-is-awesome`)
- Functions, mixins, and _global_ variables should be prefixed with `-restyle--`.
  - `$-restyle--this-is-global`
  - `@function -restyle--my-func() ...`
  - `@mixin -restyle--my-mixin() ...`
- For public mixins and functions, provide a convenience alias (see [`aliases.scss`](./sass/aliases.scss))
- Use `!default` appropriately
- Use multi-line convention with each rule on a separate line
- Use a semi-colon after every declaration (including the last declaration of a rule)
- Use [SassDoc](http://sassdoc.com/) syntax for documenting all methods

### JavaScript

- Follow the ESLint conventions. You can test syntax via `$ gulp lint`

## Thanks!

Thanks for contributing and helping push the web forward.
