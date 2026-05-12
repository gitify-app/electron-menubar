# Platforms where `menubar` is known to work

This document is still a work-in-progress. If you have tested `menubar` with a platform that is not listed under here, I would greatly appreciate a PR!

<!-- platforms:start -->

_Continuously verified by [E2E smoke tests](.github/workflows/e2e.yml)._

| Platform | Status |
| -------- | ------ |
| macOS 14 (Sonoma) | ✅ Pass |
| macOS 15 (Sequoia) | ✅ Pass |
| macOS 26 (Tahoe) | ✅ Pass |
| Ubuntu 22.04 | ✅ Pass |
| Ubuntu 24.04 | ✅ Pass |
| Windows Server 2022 | ✅ Pass |
| Windows Server 2025 | ✅ Pass |

<!-- platforms:end -->

<!-- visual:start -->

_Continuously verified by [visual tray rendering tests](.github/workflows/visual-tray.yml). Each run boots the menubar fixture, screenshots the OS panel, and asserts both the tray icon and the popover window are painted._

| Platform | Tray + Window | Screenshot |
| -------- | ------------- | ---------- |
| Linux (Budgie) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-budgie.png" width="600" alt="linux-budgie screenshot"></details> |
| Linux (Cinnamon) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-cinnamon.png" width="600" alt="linux-cinnamon screenshot"></details> |
| Linux (GNOME) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-gnome.png" width="600" alt="linux-gnome screenshot"></details> |
| Linux (KDE Plasma) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-kde.png" width="600" alt="linux-kde screenshot"></details> |
| Linux (LXQt) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-lxqt.png" width="600" alt="linux-lxqt screenshot"></details> |
| Linux (MATE) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-mate.png" width="600" alt="linux-mate screenshot"></details> |
| Linux (Sway/Waybar) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-sway.png" width="600" alt="linux-sway screenshot"></details> |
| Linux (Tint2) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-tint2.png" width="600" alt="linux-tint2 screenshot"></details> |
| Linux (Xfce) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/linux-xfce.png" width="600" alt="linux-xfce screenshot"></details> |
| macOS 14 (Sonoma) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/macos-14.png" width="600" alt="macos-14 screenshot"></details> |
| macOS 15 (Sequoia) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/macos-15.png" width="600" alt="macos-15 screenshot"></details> |
| macOS 26 (Tahoe) | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/macos-26.png" width="600" alt="macos-26 screenshot"></details> |
| Windows Server 2022 | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/windows-2022.png" width="600" alt="windows-2022 screenshot"></details> |
| Windows Server 2025 | ✅ Pass | <details><summary>view</summary><img src=".github/visual-screenshots/windows-2025.png" width="600" alt="windows-2025 screenshot"></details> |

<!-- visual:end -->

## macOS

| Version           | Working Status | Known Issues                                                                                                   |
| ----------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| 14.15 Sonoma      | ✅ Good        |                                                                                                                |
| 10.14 Mojave      | ✅ Good        | [#147](https://github.com/maxogden/menubar/issues/147), [#215](https://github.com/maxogden/menubar/issues/215) |
| 10.13 High Sierra | ✅ Good        |                                                                                                                |

## Windows

| Version    | Working Status | Known Issues |
| ---------- | -------------- | ------------ |
| Windows 11 | ✅ Good        |              |
| Windows 10 | ✅ Good        |              |
| Windows 8  | ✅ Good        |              |

## Linux

| Distribution  | Desktop Environment | Working Status | Known Issues                                           |
| ------------- | ------------------- | -------------- | ------------------------------------------------------ |
| openSUSE 13.1 | Xfce 4.10.1         | ❌ Bad         | [#123](https://github.com/maxogden/menubar/issues/123) |
| Ubuntu 18.04  | Unity               | ✅ Good        |                                                        |
| Ubuntu 14.04  | Unity               | ❌ Bad         | [#68](https://github.com/maxogden/menubar/issues/68)   |
