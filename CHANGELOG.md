<a name="1.0.8"></a>
## [1.0.8](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.7...v1.0.8) (2016-05-24)


### Features

* **dynamic-modifiers:** add support for dynamic modifiers ([10b698b](https://github.com/eoneill/eyeglass-restyle/commit/10b698b))
* **restyle-meta:** add support for required modifiers ([2343e3e](https://github.com/eoneill/eyeglass-restyle/commit/2343e3e))
* **user-variables:** allow user provided variables ([9da8c79](https://github.com/eoneill/eyeglass-restyle/commit/9da8c79))
* **var-constraints:** add support for variable constraints ([7743ecb](https://github.com/eoneill/eyeglass-restyle/commit/7743ecb))



<a name="1.0.7"></a>
## [1.0.7](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.6...v1.0.7) (2016-03-15)


### Bug Fixes

* **restyle-meta:** correctly handle meta values when they are preserved ([f19e668](https://github.com/eoneill/eyeglass-restyle/commit/f19e668))



<a name="1.0.6"></a>
## [1.0.6](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.5...v1.0.6) (2016-03-14)


### Features

* **restyle-private:** add support for private modifiers ([3d34ece](https://github.com/eoneill/eyeglass-restyle/commit/3d34ece))



<a name="1.0.5"></a>
## [1.0.5](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.4...v1.0.5) (2016-02-20)


### Bug Fixes

* **package.json:** update eyeglass:needs to <1.0 for now ([0ab4655](https://github.com/eoneill/eyeglass-restyle/commit/0ab4655))



<a name="1.0.4"></a>
## [1.0.4](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.3...v1.0.4) (2016-01-25)


### Bug Fixes

* update for eyeglass 0.8.x compatibility ([bc1f2b5](https://github.com/eoneill/eyeglass-restyle/commit/bc1f2b5))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.2...v1.0.3) (2015-11-10)


### Bug Fixes

* **media:** media queries should be treated as selectors ([24ebcd3](https://github.com/eoneill/eyeglass-restyle/commit/24ebcd3))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.1...v1.0.2) (2015-11-07)


### Bug Fixes

* **functions:** preserve the order of function output. fixes #2) ([12d434a](https://github.com/eoneill/eyeglass-restyle/commit/12d434a)), closes [#2](https://github.com/eoneill/eyeglass-restyle/issues/2)



<a name="1.0.1"></a>
## [1.0.1](https://github.com/eoneill/eyeglass-restyle/compare/v1.0.0...v1.0.1) (2015-11-06)


### Bug Fixes

* lock node-sass version to 3.3.3 until issues are resolved ([a35311f](https://github.com/eoneill/eyeglass-restyle/commit/a35311f))
* use a Set for custom grammar engines to avoid duplicate methods ([a94362c](https://github.com/eoneill/eyeglass-restyle/commit/a94362c))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.11...v1.0.0) (2015-10-13)


### Bug Fixes

* **Styles:** properties listed after selectors were incorrectly handled ([1dd4b1e](https://github.com/eoneill/eyeglass-restyle/commit/1dd4b1e))



<a name="0.2.11"></a>
## [0.2.11](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.10...v0.2.11) (2015-10-12)


### Features

* **restyle-with-config:** add restyle-with-config mixin ([d6eada2](https://github.com/eoneill/eyeglass-restyle/commit/d6eada2))

### Performance Improvements

* **styles:** use sass methods over js methods if possible ([df04e72](https://github.com/eoneill/eyeglass-restyle/commit/df04e72))



<a name="0.2.10"></a>
## [0.2.10](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.9...v0.2.10) (2015-10-07)


### Bug Fixes

* **no-value:** fix no-value reference to use $-restyle--undefined ([4d1b737](https://github.com/eoneill/eyeglass-restyle/commit/4d1b737))
* **resolver:** fix the parent() resolver, add test case ([9b3ff19](https://github.com/eoneill/eyeglass-restyle/commit/9b3ff19))



<a name="0.2.9"></a>
## [0.2.9](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.8...v0.2.9) (2015-10-05)


### Performance Improvements

* **styles-from-grammar:** use shallow map conversion until we know the type ([205397e](https://github.com/eoneill/eyeglass-restyle/commit/205397e))



<a name="0.2.8"></a>
## [0.2.8](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.7...v0.2.8) (2015-10-01)


### Build

* attempt to fix release tagging ([62452c10d32b227a0e6f9b0ac860114f2d913b78](https://github.com/eoneill/eyeglass-restyle/commit/62452c10d32b227a0e6f9b0ac860114f2d913b78))
* attempt to fix release tagging ([e0345ffaf9d792dfd6e08319ebb2bd1dda9d0bf7](https://github.com/eoneill/eyeglass-restyle/commit/e0345ffaf9d792dfd6e08319ebb2bd1dda9d0bf7))
* fix changelog update order in release ([61d027a6915d48d664ac15630fc62db68ee2be29](https://github.com/eoneill/eyeglass-restyle/commit/61d027a6915d48d664ac15630fc62db68ee2be29))
* Fix release tagging  ([b03224e260dc1cb2d38aedbbc39da628c4fadde5](https://github.com/eoneill/eyeglass-restyle/commit/b03224e260dc1cb2d38aedbbc39da628c4fadde5))
* Fix release tagging  ([bd80c46af472648ef9de9a0b5958c65df827f394](https://github.com/eoneill/eyeglass-restyle/commit/bd80c46af472648ef9de9a0b5958c65df827f394))
* Fix release task and tagging for realz ([98358ddc17999bd094c4cc391d226ba9a21569f7](https://github.com/eoneill/eyeglass-restyle/commit/98358ddc17999bd094c4cc391d226ba9a21569f7))



<a name="0.2.7"></a>
## [0.2.7](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.6...v0.2.7) (2015-10-01)


### Build

* fix changelog update order in release ([247e9c415eccbb7108544e7ff0559756f6837ded](https://github.com/eoneill/eyeglass-restyle/commit/247e9c415eccbb7108544e7ff0559756f6837ded))



<a name="0.2.6"></a>
## [0.2.6](https://github.com/eoneill/eyeglass-restyle/compare/v0.2.5...v0.2.6) (2015-10-01)


### Build

* Add conventional-changelog to release task ([5529575bcea6bd00a182f1ee74ef6e5283d91d09](https://github.com/eoneill/eyeglass-restyle/commit/5529575bcea6bd00a182f1ee74ef6e5283d91d09))

