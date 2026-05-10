import { type BrowserWindow, type Rectangle, screen } from 'electron';

/**
 * Named anchor points for placing the menubar window. The `tray*` values are
 * relative to the tray icon's bounds; the rest are relative to the work area
 * of the display containing the cursor (or the tray, when bounds are given).
 */
export type WindowPosition =
  | 'trayLeft'
  | 'trayBottomLeft'
  | 'trayRight'
  | 'trayBottomRight'
  | 'trayCenter'
  | 'trayBottomCenter'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'topCenter'
  | 'bottomCenter'
  | 'leftCenter'
  | 'rightCenter'
  | 'center';

/**
 * Computes `{x, y}` coordinates for placing a {@link BrowserWindow} at a named
 * position, optionally relative to a tray icon's bounds. Ported from
 * `electron-positioner@4.1.0` to drop the unmaintained runtime dependency.
 */
export class Positioner {
  private readonly browserWindow: BrowserWindow;

  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  calculate(
    position?: WindowPosition,
    trayBounds?: Rectangle,
  ): { x: number; y: number } {
    if (!position) {
      throw new TypeError(
        'Positioner.calculate: a `position` argument is required.',
      );
    }

    const screenSize = trayBounds
      ? screen.getDisplayMatching(trayBounds).workArea
      : screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
    const [windowWidth, windowHeight] = this.browserWindow.getSize();
    const trayX = trayBounds?.x ?? Number.NaN;
    const trayWidth = trayBounds?.width ?? Number.NaN;

    const positions: Record<WindowPosition, { x: number; y: number }> = {
      trayLeft: {
        x: Math.floor(trayX),
        y: screenSize.y,
      },
      trayBottomLeft: {
        x: Math.floor(trayX),
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      trayRight: {
        x: Math.floor(trayX - windowWidth + trayWidth),
        y: screenSize.y,
      },
      trayBottomRight: {
        x: Math.floor(trayX - windowWidth + trayWidth),
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      trayCenter: {
        x: Math.floor(trayX - windowWidth / 2 + trayWidth / 2),
        y: screenSize.y,
      },
      trayBottomCenter: {
        x: Math.floor(trayX - windowWidth / 2 + trayWidth / 2),
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      topLeft: {
        x: screenSize.x,
        y: screenSize.y,
      },
      topRight: {
        x: Math.floor(screenSize.x + (screenSize.width - windowWidth)),
        y: screenSize.y,
      },
      bottomLeft: {
        x: screenSize.x,
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      bottomRight: {
        x: Math.floor(screenSize.x + (screenSize.width - windowWidth)),
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      topCenter: {
        x: Math.floor(screenSize.x + (screenSize.width / 2 - windowWidth / 2)),
        y: screenSize.y,
      },
      bottomCenter: {
        x: Math.floor(screenSize.x + (screenSize.width / 2 - windowWidth / 2)),
        y: Math.floor(screenSize.height - (windowHeight - screenSize.y)),
      },
      leftCenter: {
        x: screenSize.x,
        y:
          screenSize.y +
          Math.floor(screenSize.height / 2) -
          Math.floor(windowHeight / 2),
      },
      rightCenter: {
        x: Math.floor(screenSize.x + (screenSize.width - windowWidth)),
        y:
          screenSize.y +
          Math.floor(screenSize.height / 2) -
          Math.floor(windowHeight / 2),
      },
      center: {
        x: Math.floor(screenSize.x + (screenSize.width / 2 - windowWidth / 2)),
        y: Math.floor(
          (screenSize.height + screenSize.y) / 2 - windowHeight / 2,
        ),
      },
    };

    const coords = positions[position];

    // On Windows, a tray-relative position can push the window past the right
    // edge of the work area. Snap back to `topRight` x in that case so it stays
    // visible. See https://github.com/jenslind/electron-positioner.
    if (position.startsWith('tray')) {
      if (coords.x + windowWidth > screenSize.width + screenSize.x) {
        return { x: positions.topRight.x, y: coords.y };
      }
    }

    return coords;
  }
}
