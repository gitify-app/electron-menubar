# Changelog

All notable changes to this project will be documented in this file. Releases are managed by [release-please](https://github.com/googleapis/release-please) from [Conventional Commits](https://www.conventionalcommits.org/).

## [10.0.1](https://github.com/gitify-app/menubar/compare/v10.0.0...v10.0.1) (2026-06-04)


### Bug Fixes

* position window beside tray on left taskbars ([#15](https://github.com/gitify-app/menubar/issues/15)) ([05fdfba](https://github.com/gitify-app/menubar/commit/05fdfba196bdb6157a74455e565b964c56e56c99))
* reposition window on resize so setSize doesn't clip under taskbar ([#7](https://github.com/gitify-app/menubar/issues/7)) ([ad07479](https://github.com/gitify-app/menubar/commit/ad07479e6035d951b9f903028e92ab426b2bceb1))
* **visual:** make sway respect window size and stop GNOME painting it blue ([#34](https://github.com/gitify-app/menubar/issues/34)) ([03f4b78](https://github.com/gitify-app/menubar/commit/03f4b785f9d6a534f11b3c1a3bb7f8397e0fc886))
* **visual:** stop fixture window from covering Linux bottom panels ([#32](https://github.com/gitify-app/menubar/issues/32)) ([a0c0890](https://github.com/gitify-app/menubar/commit/a0c0890bb02c4e77c23e6d8fd67f403e240b3041))
* **visual:** stop MinimizeAll from hiding our menubar window on Windows ([#26](https://github.com/gitify-app/menubar/issues/26)) ([1aab5fd](https://github.com/gitify-app/menubar/commit/1aab5fd899cebf4123a8fb6eacc0b536c3e95b2d))


### Refactor

* rename package to electron-menubar and slim published bundle ([#41](https://github.com/gitify-app/menubar/issues/41)) ([ce3b40c](https://github.com/gitify-app/menubar/commit/ce3b40c7c3fd15bbcbdbd7e73984cee242d67f3e))


### Build

* migrate package manager from bun to pnpm ([#40](https://github.com/gitify-app/menubar/issues/40)) ([f5791f3](https://github.com/gitify-app/menubar/commit/f5791f3f61db1d78c1bc194ed5d7f42e1bf330bb))
* pin vite-plus toolchain and bump electron dev dependency ([#47](https://github.com/gitify-app/menubar/issues/47)) ([c8ab465](https://github.com/gitify-app/menubar/commit/c8ab46546cba524ea50cb725cc4632b150b8ac47))


### CI

* migrate from standard-version to release-please ([#43](https://github.com/gitify-app/menubar/issues/43)) ([ebda924](https://github.com/gitify-app/menubar/commit/ebda924bef7f02fd30a216ca2cf2a3a31c4f8cc3))
* **visual:** cache apt packages for heavy Linux DEs ([#29](https://github.com/gitify-app/menubar/issues/29)) ([f2ddd8e](https://github.com/gitify-app/menubar/commit/f2ddd8ec1ae0c8d2d80b66b0d640727d03706957))
* **visual:** commit screenshots and link them as collapsibles in PLATFORMS.md ([#18](https://github.com/gitify-app/menubar/issues/18)) ([b58b028](https://github.com/gitify-app/menubar/commit/b58b028572a50e29eefe179060625da9f53c0bf9))
* **visual:** mark linux-gnome experimental until Mutter blue-paint is fixed ([#36](https://github.com/gitify-app/menubar/issues/36)) ([47a855d](https://github.com/gitify-app/menubar/commit/47a855d0c098bc79f03f4e1af59e653c110b5c67))
* **visual:** pin time on screenshots to remove clock-driven diff noise ([#22](https://github.com/gitify-app/menubar/issues/22)) ([d06293d](https://github.com/gitify-app/menubar/commit/d06293d06c60fb2d2768ba4bd8efccbe68291a20))
* **visual:** raise screenshot diff budget to stop empty churn PRs ([#48](https://github.com/gitify-app/menubar/issues/48)) ([3aff2ab](https://github.com/gitify-app/menubar/commit/3aff2ab1a3163612103abac6498ecdb3d4e57d5c))
* **visual:** real per-platform clock suppression (v2) ([#25](https://github.com/gitify-app/menubar/issues/25)) ([cf87380](https://github.com/gitify-app/menubar/commit/cf873807db1ca702e4bd23884278803c4a755e29))
* **visual:** stop churn PRs from non-deterministic tray screenshots ([#39](https://github.com/gitify-app/menubar/issues/39)) ([04cd05f](https://github.com/gitify-app/menubar/commit/04cd05f87cba119ec465407df8fae36b124b182d))


### Documentation

* drop manually maintained legacy platform tables from PLATFORMS.md ([#21](https://github.com/gitify-app/menubar/issues/21)) ([335fea4](https://github.com/gitify-app/menubar/commit/335fea41e8051da98c296c28bdc4744bb8ae59ec))
* refresh visual tray rendering table ([#17](https://github.com/gitify-app/menubar/issues/17)) ([5029d7b](https://github.com/gitify-app/menubar/commit/5029d7bdfc58a405c583539e563f6b6d330c2e74))
* refresh visual tray rendering table ([#19](https://github.com/gitify-app/menubar/issues/19)) ([0859faf](https://github.com/gitify-app/menubar/commit/0859faff4069a84308f96a2a8ea57c0df3520e9d))
* refresh visual tray rendering table ([#20](https://github.com/gitify-app/menubar/issues/20)) ([267d037](https://github.com/gitify-app/menubar/commit/267d0374b9f0bc36f6abd44a6fd1147ee0ef2bdc))
* refresh visual tray rendering table ([#23](https://github.com/gitify-app/menubar/issues/23)) ([3b69182](https://github.com/gitify-app/menubar/commit/3b69182054867bb1e3826bdb3a91122df8690093))
* refresh visual tray rendering table ([#27](https://github.com/gitify-app/menubar/issues/27)) ([c8f74e4](https://github.com/gitify-app/menubar/commit/c8f74e4c0118d4504fe74fa4397c4afc7829b013))
* refresh visual tray rendering table ([#30](https://github.com/gitify-app/menubar/issues/30)) ([dd0dd27](https://github.com/gitify-app/menubar/commit/dd0dd27c920eda188bf04f5d3a8016895a74c363))
* refresh visual tray rendering table ([#33](https://github.com/gitify-app/menubar/issues/33)) ([3fed6a3](https://github.com/gitify-app/menubar/commit/3fed6a3a03c175312c959b7ff1133fa363595e56))
* refresh visual tray rendering table ([#35](https://github.com/gitify-app/menubar/issues/35)) ([5aef134](https://github.com/gitify-app/menubar/commit/5aef13404be514416cb967349817562ebf24972c))
* refresh visual tray rendering table ([#37](https://github.com/gitify-app/menubar/issues/37)) ([3aad2cd](https://github.com/gitify-app/menubar/commit/3aad2cddd78101ab521dcbadf3b024dfe6ac69f7))
* refresh visual tray rendering table ([#38](https://github.com/gitify-app/menubar/issues/38)) ([6ce09d6](https://github.com/gitify-app/menubar/commit/6ce09d69823bf1e76a278da27fc4e96ab0bd44ba))
* refresh visual tray rendering table ([#42](https://github.com/gitify-app/menubar/issues/42)) ([c757166](https://github.com/gitify-app/menubar/commit/c7571661a62de918e3385193c84cbe89f91aa510))

## [10.0.0](https://github.com/gitify-app/menubar/compare/v9.5.2...v10.0.0) (2026-05-11)

First release under the `@gitify/menubar` scope. This is a hard fork of [`menubar`](https://github.com/maxogden/menubar), now independently maintained by the Gitify team with its own roadmap, release cadence, and toolchain. New package name, new repository, new owners.

### Rebrand

* Renamed package from `menubar` to `@gitify/menubar` ([#2](https://github.com/gitify-app/menubar/issues/2))
* Repository moved to [`gitify-app/menubar`](https://github.com/gitify-app/menubar)
* Default branch renamed from `master` to `main` ([#3](https://github.com/gitify-app/menubar/issues/3))

### Features

* Import menubar patterns from Gitify: `hideOnClose`, `contextMenu`, `globalShortcut`, plus helpers ([#13](https://github.com/gitify-app/menubar/pull/13))
* Add `trigger` option for tray event binding ([#6](https://github.com/gitify-app/menubar/pull/6))
* Add `destroy()` method for tearing down a menubar instance ([#5](https://github.com/gitify-app/menubar/pull/5))

### Refactor

* Inline `Positioner` and drop the `electron-positioner` dependency ([#12](https://github.com/gitify-app/menubar/pull/12))

### Build

* Migrate toolchain to bun + Vite+ ([#4](https://github.com/gitify-app/menubar/pull/4))
* Ship dual ESM/CJS output with separate type declarations
* Modernize `tsconfig.json` to ES2022 with bundler resolution
* Switch lint/format from biome to oxlint + oxfmt via `vp check`
* Replace jest with vitest

### CI

* E2E matrix smoke tests with auto-updating `PLATFORMS.md` ([#8](https://github.com/gitify-app/menubar/pull/8))
* Visual tray rendering matrix across macOS, Linux DEs, and Windows ([#10](https://github.com/gitify-app/menubar/pull/10))
* Publish workflow for npm releases on tag push
* PR title validation against Conventional Commits

### [9.5.2](https://github.com/maxogden/menubar/compare/v9.5.1...v9.5.2) (2025-10-10)

### [9.5.1](https://github.com/maxogden/menubar/compare/v9.5.0...v9.5.1) (2024-10-11)

## [9.5.0](https://github.com/maxogden/menubar/compare/v9.4.0...v9.5.0) (2024-06-25)


### Features

* widen electron support ([#473](https://github.com/maxogden/menubar/issues/473)) ([bd3beb2](https://github.com/maxogden/menubar/commit/bd3beb2c2bc9700f4738a4e0f25085aa8a0f5e86))


### Bug Fixes

* Fix for Broken Native Menubar Example ([#471](https://github.com/maxogden/menubar/issues/471)) ([b000c86](https://github.com/maxogden/menubar/commit/b000c86777cb0cf6fa883fb0256410981e154ce1))
* win32 position ([#479](https://github.com/maxogden/menubar/issues/479)) ([9e5cb86](https://github.com/maxogden/menubar/commit/9e5cb86a276f29efd36d10a07e27fa820343f880))

## [9.4.0](https://github.com/maxogden/menubar/compare/v9.3.0...v9.4.0) (2023-11-28)


### Features

* Update electron to 27 ([#458](https://github.com/maxogden/menubar/issues/458)) ([f3dbac6](https://github.com/maxogden/menubar/commit/f3dbac66582baa322c2c8caa5027f1b8ef480e67))


### Bug Fixes

* Avoid setVisibleOnAllWorkspaces from destroying the original visible state of app.dock ([#442](https://github.com/maxogden/menubar/issues/442)) ([d8df2ab](https://github.com/maxogden/menubar/commit/d8df2ab4b65564c8ec58dc7156128bfd53fab2c9))

## [9.3.0](https://github.com/maxogden/menubar/compare/v9.2.3...v9.3.0) (2023-02-13)


### Features

* add electron 22 support ([#414](https://github.com/maxogden/menubar/issues/414)) ([a39382f](https://github.com/maxogden/menubar/commit/a39382fe843953395bf99267ee83102def70b06e))

### [9.2.3](https://github.com/maxogden/menubar/compare/v9.2.2...v9.2.3) (2022-10-05)


### Features

* electron 21 support ([#382](https://github.com/maxogden/menubar/issues/382)) ([c9d5b61](https://github.com/maxogden/menubar/commit/c9d5b61da2b55e20e9b2d0f4c0181c57f33a27c3))

### [9.2.2](https://github.com/maxogden/menubar/compare/v9.2.1...v9.2.2) (2022-09-05)


### Features

* Add Electron 20 as a peerDependency ([#379](https://github.com/maxogden/menubar/issues/379)) ([4c027b2](https://github.com/maxogden/menubar/commit/4c027b22499c7c83a4d87b9aa17d5e86f3172b68))


### Bug Fixes

* arrow example problem ([#342](https://github.com/maxogden/menubar/issues/342)) ([64b80d5](https://github.com/maxogden/menubar/commit/64b80d5f49ebb367b75e21e88af15fdc874cda86))

### [9.2.1](https://github.com/maxogden/menubar/compare/v9.2.0...v9.2.1) (2022-07-11)


### Bug Fixes

* Add support for electron 19 ([#376](https://github.com/maxogden/menubar/issues/376)) ([6d0feb0](https://github.com/maxogden/menubar/commit/6d0feb0e492681200966dde10a63a73cfb503138))

## [9.2.0](https://github.com/maxogden/menubar/compare/v9.1.2...v9.2.0) (2022-04-11)


### Features

* add `before-load` event ([#370](https://github.com/maxogden/menubar/issues/370)) ([3247986](https://github.com/maxogden/menubar/commit/3247986f164d8b2fb2912ab33beb25c9c6d8ece3))

### [9.1.2](https://github.com/maxogden/menubar/compare/v9.1.1...v9.1.2) (2022-03-29)


### Bug Fixes

* Add electron 17 support ([#373](https://github.com/maxogden/menubar/issues/373)) ([fafc29f](https://github.com/maxogden/menubar/commit/fafc29f168e91369ad5d60a61abc0363076c303a))

### [9.1.1](https://github.com/maxogden/menubar/compare/v9.1.0...v9.1.1) (2021-12-09)


### Bug Fixes

* Add electron 16 support ([#364](https://github.com/maxogden/menubar/issues/364)) ([325e151](https://github.com/maxogden/menubar/commit/325e1517cfc407bc0ccc98be776d8d9590d6f119))

## [9.1.0](https://github.com/maxogden/menubar/compare/v9.0.6...v9.1.0) (2021-10-27)


### Features

* add option activateWithApp to allow not activate with this event ([#361](https://github.com/maxogden/menubar/issues/361)) ([8384bf2](https://github.com/maxogden/menubar/commit/8384bf24abe6138aded26fcd7bd6d1d7a325f319))

### [9.0.6](https://github.com/maxogden/menubar/compare/v9.0.5...v9.0.6) (2021-10-15)


### Bug Fixes

* Add support for electron 14 and 15 ([#358](https://github.com/maxogden/menubar/issues/358)) ([8eaba8c](https://github.com/maxogden/menubar/commit/8eaba8cdfcd3ce9427ee3ffd65b3426c62f65048))

### [9.0.5](https://github.com/maxogden/menubar/compare/v9.0.4...v9.0.5) (2021-06-28)


### Bug Fixes

* Add support for Electron 13 ([#347](https://github.com/maxogden/menubar/issues/347)) ([fbf07bd](https://github.com/maxogden/menubar/commit/fbf07bd0bd24b2aac26cdd1db61eb55924f3ee63))
* window position on linux & windows when taskbar is on the left ([#343](https://github.com/maxogden/menubar/issues/343)) ([5d8e0c8](https://github.com/maxogden/menubar/commit/5d8e0c89996f67b58f059ec767a87db104a90292))

### [9.0.4](https://github.com/maxogden/menubar/compare/v9.0.3...v9.0.4) (2021-05-03)


### Bug Fixes

* Add support for Electron 12 ([#332](https://github.com/maxogden/menubar/issues/332)) ([c1f055d](https://github.com/maxogden/menubar/commit/c1f055daed76be2d0f408fda5d4835defcd59dcc))

### [9.0.3](https://github.com/maxogden/menubar/compare/v9.0.2...v9.0.3) (2021-02-24)


### Bug Fixes

* Add support for Electron 10 and 11 ([#321](https://github.com/maxogden/menubar/issues/321)) ([4a89656](https://github.com/maxogden/menubar/commit/4a8965628a0a1a7a14602fef3add7bef436a508f))

### [9.0.2](https://github.com/maxogden/menubar/compare/v9.0.1...v9.0.2) (2021-01-20)


### Bug Fixes

* Improve 'windows' OS detection of taskbar location ([#307](https://github.com/maxogden/menubar/issues/307)) ([4726584](https://github.com/maxogden/menubar/commit/4726584664148a57656c40872836ebba2d030980))

### [9.0.1](https://github.com/maxogden/menubar/compare/v9.0.0...v9.0.1) (2020-05-28)


### Bug Fixes

* calling showWindow() prevents menubar window from closing ([#287](https://github.com/maxogden/menubar/issues/287)) ([53d8f82](https://github.com/maxogden/menubar/commit/53d8f82b604ad5555f59108a97234ebf32e43f80))

## [9.0.0](https://github.com/maxogden/menubar/compare/v8.0.2...v9.0.0) (2020-05-27)


### ⚠ BREAKING CHANGES

* Please use Electron 9 with this menubar version.

### Features

* Support Electron 9 ([#286](https://github.com/maxogden/menubar/issues/286)) ([44cf1b1](https://github.com/maxogden/menubar/commit/44cf1b1e6cce83f9e63a39f1d32fbb664396e7bc))

### [8.0.2](https://github.com/maxogden/menubar/compare/v8.0.1...v8.0.2) (2020-04-27)


### Bug Fixes

* Show window on dock icon click ([#279](https://github.com/maxogden/menubar/issues/279)) ([a8607fa](https://github.com/maxogden/menubar/commit/a8607fa708d229d9124471127482fe461198f1f3))
* update prevent flicker on Windows (fixes [#274](https://github.com/maxogden/menubar/issues/274)) ([#276](https://github.com/maxogden/menubar/issues/276)) ([9592f34](https://github.com/maxogden/menubar/commit/9592f3437ce3660b6464f5b436ed111291eb75d3))

### [8.0.1](https://github.com/maxogden/menubar/compare/v8.0.0...v8.0.1) (2020-03-14)


### Bug Fixes

* **deps:** [Security] bump acorn from 6.1.1 to 6.4.1 ([#272](https://github.com/maxogden/menubar/issues/272)) ([1332b77](https://github.com/maxogden/menubar/commit/1332b774372de69c04e2a098833ae35775c35cad))

## [8.0.0](https://github.com/maxogden/menubar/compare/v7.2.0...v8.0.0) (2020-02-10)


### ⚠ BREAKING CHANGES

* Menubar's recommended peer dependency is `electron@^8.0.0`

### Features

* Support Electron 8 ([#268](https://github.com/maxogden/menubar/issues/268)) ([ad99c5a](https://github.com/maxogden/menubar/commit/ad99c5add02ab6d0d751cf6bda8a2c96c674620f))

## [7.2.0](https://github.com/maxogden/menubar/compare/v7.1.0...v7.2.0) (2020-01-16)


### Features

* Adding a loadUrlOptions option ([#263](https://github.com/maxogden/menubar/issues/263)) ([8e6bd01](https://github.com/maxogden/menubar/commit/8e6bd0154aaee02a5d601bbe37c51c55065c3923))

## [7.1.0](https://github.com/maxogden/menubar/compare/v7.0.0...v7.1.0) (2019-11-25)


### Features

* Allow skipping loadUrl ([#257](https://github.com/maxogden/menubar/issues/257)) ([095486a](https://github.com/maxogden/menubar/commit/095486ab338df26fc4d6a1e7a658cfa9fa4a69b7))

# [7.0.0](https://github.com/maxogden/menubar/compare/v6.0.8...v7.0.0) (2019-10-23)


* feat!: Support Electron 7 (#250) ([b54dce5](https://github.com/maxogden/menubar/commit/b54dce5)), closes [#250](https://github.com/maxogden/menubar/issues/250)


### BREAKING CHANGES

* - Drop support for Electron 4, 5, and 6.
- Remove deprecated passing string argument to `menubar`, use `dir` field instead
```diff
- menubar('/home/me/MY_ABSOLUTE_PATH');
+ menubar({ dir: '/home/me/MY_ABSOLUTE_PATH' });
```
- Remove deprecated passing `x`, `y`, `height`, `width`, `alwaysOnTop` fields to `menubar`, pass them instead into the `browserWindow` field
```diff
- menubar({
-   x: 12,
-   y: 34,
-   height: 500,
-   width: 320,
-   alwaysOnTop: true
- });
+ menubar({
+   browserWindow: {
+     x: 12,
+     y: 34,
+     height: 500,
+     width: 320,
+     alwaysOnTop: true
+  }
+ });
```



## [6.0.8](https://github.com/maxogden/menubar/compare/v6.0.7...v6.0.8) (2019-09-16)


### Bug Fixes

* Move doc tool to `devDependencies` ([#245](https://github.com/maxogden/menubar/issues/245)) ([2756c7a](https://github.com/maxogden/menubar/commit/2756c7a))



## [6.0.7](https://github.com/maxogden/menubar/compare/v6.0.6...v6.0.7) (2019-07-31)


### Bug Fixes

* Support Electron 6 ([#242](https://github.com/maxogden/menubar/issues/242)) ([1fd9bd7](https://github.com/maxogden/menubar/commit/1fd9bd7))



## [6.0.6](https://github.com/maxogden/menubar/compare/v6.0.5...v6.0.6) (2019-07-02)


### Bug Fixes

* Fix crash on windows position ([#235](https://github.com/maxogden/menubar/issues/235)) ([cbbe175](https://github.com/maxogden/menubar/commit/cbbe175))



## [6.0.5](https://github.com/maxogden/menubar/compare/v6.0.4...v6.0.5) (2019-06-11)


### Bug Fixes

* Remove postinstall, export taskbarLocation ([#226](https://github.com/maxogden/menubar/issues/226)) ([941b3be](https://github.com/maxogden/menubar/commit/941b3be))



## [6.0.4](https://github.com/maxogden/menubar/compare/v6.0.3...v6.0.4) (2019-06-11)


### Bug Fixes

* Correct position on Windows & multi-taskbar ([#217](https://github.com/maxogden/menubar/issues/217)) ([4f29fe2](https://github.com/maxogden/menubar/commit/4f29fe2)), closes [#196](https://github.com/maxogden/menubar/issues/196)
* Fix double 'after-hide' event ([#216](https://github.com/maxogden/menubar/issues/216)) ([a4d900e](https://github.com/maxogden/menubar/commit/a4d900e))



## [6.0.3](https://github.com/maxogden/menubar/compare/v6.0.2...v6.0.3) (2019-06-05)


### Bug Fixes

* Fix accessing Menubar.window ([#214](https://github.com/maxogden/menubar/issues/214)) ([cd5ef73](https://github.com/maxogden/menubar/commit/cd5ef73))



## [6.0.2](https://github.com/maxogden/menubar/compare/v6.0.1...v6.0.2) (2019-05-31)


### Bug Fixes

* Use cat icon if no icon provided ([#205](https://github.com/maxogden/menubar/issues/205)) ([fc02e02](https://github.com/maxogden/menubar/commit/fc02e02))



## [6.0.1](https://github.com/maxogden/menubar/compare/v6.0.0...v6.0.1) (2019-05-31)


### Bug Fixes

* Fix changelog links ([#204](https://github.com/maxogden/menubar/issues/204)) ([de96756](https://github.com/maxogden/menubar/commit/de96756))



# [6.0.0](https://github.com/maxogden/menubar/compare/v5.2.3...v6.0.0) (2019-05-31)


### Bug Fixes

* Update to Electron 5 ([#15](https://github.com/amaurym/g/menubar/issues/15)) ([ce86216](https://github.com/maxogden/menubar/commit/ce86216))
* Window does not show when already app is ready ([#8](https://github.com/amaurym/g/menubar/issues/8)) ([251fb21](https://github.com/maxogden/menubar/commit/251fb21))


### Code Refactoring

* Convert all codebase to typescript ([#2](https://github.com/amaurym/g/menubar/issues/2)) ([820d41a](https://github.com/maxogden/menubar/commit/820d41a))


### Features

* Add `browserWindow` field in options, deprecate `height`, `width`, `x`, `y`, `alwaysOnTop` in favor of `browserWindow` ([#18](https://github.com/amaurym/g/menubar/issues/18)) ([0b2d897](https://github.com/maxogden/menubar/commit/0b2d897))
* Support Electron.NativeImage icon argument ([#7](https://github.com/amaurym/g/menubar/issues/7)) ([03d67f3](https://github.com/maxogden/menubar/commit/03d67f3))


### BREAKING CHANGES

* We're using a named export in Typescript now:
```diff
- var menubar = require('menubar');
+ var { menubar } = require('menubar');
```

Alternatively, using ES6/TS syntax:
```javascript
import { menubar } from 'menubar';
```
