# Platforms where `menubar` is known to work

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

_Continuously verified by [visual tray rendering tests](.github/workflows/visual-tray.yml). Each run boots the menubar fixture, screenshots the OS panel, and asserts both the tray icon and the popover window are painted. These checks confirm rendering, not tray-anchored placement. See [Window positioning on Linux](#window-positioning-on-linux)._

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

## Window positioning on Linux

The checks above confirm that the tray icon and popover window render. They do **not** assert that the popover is positioned next to the tray icon.

On **native Wayland**, tray-anchored positioning is not possible, and there is nothing the library can do about it. Two protocol limitations stack up: an application cannot set the position of its own window (`setPosition` is a no-op, `getPosition` reads back `[0, 0]`), and the tray icon, hosted by the panel via StatusNotifierItem, reports no coordinates. The compositor decides where the popover appears, which is usually the center of the screen. `menubar` logs a one-time warning when it detects the window could not be positioned.

Under **X11 / XWayland**, an application can position its own window, so the popover is placed where `menubar` computes it. (Some Linux panels still report no tray-icon coordinates over StatusNotifierItem, in which case the window falls back to a screen corner rather than sitting exactly under the icon.)

If a Wayland session places the popover in the wrong spot, running under XWayland with `--ozone-platform=x11` restores positioning.
