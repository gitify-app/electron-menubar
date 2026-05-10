import type { BrowserWindow, Display, Rectangle } from 'electron';
import { screen } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Positioner, type WindowPosition } from './Positioner';

vi.mock('electron', () => import('./__mocks__/electron'));

const WORK_AREA = { x: 0, y: 0, width: 1920, height: 1080 };
// Picked so no `tray*` position triggers the Windows overflow guard; that case
// has its own dedicated test below.
const TRAY_BOUNDS: Rectangle = { x: 1000, y: 0, width: 32, height: 22 };

function createWindow(size: [number, number] = [400, 400]): BrowserWindow {
  return { getSize: vi.fn(() => size) } as unknown as BrowserWindow;
}

const displayWith = (workArea: Rectangle): Display =>
  ({ workArea }) as unknown as Display;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(screen.getDisplayMatching).mockReturnValue(displayWith(WORK_AREA));
  vi.mocked(screen.getDisplayNearestPoint).mockReturnValue(
    displayWith(WORK_AREA),
  );
  vi.mocked(screen.getCursorScreenPoint).mockReturnValue({ x: 0, y: 0 });
});

describe('Positioner.calculate', () => {
  const expected: Record<WindowPosition, { x: number; y: number }> = {
    trayLeft: { x: 1000, y: 0 },
    trayBottomLeft: { x: 1000, y: 680 },
    trayRight: { x: 632, y: 0 },
    trayBottomRight: { x: 632, y: 680 },
    trayCenter: { x: 816, y: 0 },
    trayBottomCenter: { x: 816, y: 680 },
    topLeft: { x: 0, y: 0 },
    topRight: { x: 1520, y: 0 },
    bottomLeft: { x: 0, y: 680 },
    bottomRight: { x: 1520, y: 680 },
    topCenter: { x: 760, y: 0 },
    bottomCenter: { x: 760, y: 680 },
    leftCenter: { x: 0, y: 340 },
    rightCenter: { x: 1520, y: 340 },
    center: { x: 760, y: 340 },
  };

  for (const [position, coords] of Object.entries(expected) as Array<
    [WindowPosition, { x: number; y: number }]
  >) {
    it(`computes ${position}`, () => {
      const positioner = new Positioner(createWindow());
      expect(positioner.calculate(position, TRAY_BOUNDS)).toEqual(coords);
    });
  }

  it('resolves screen via getDisplayMatching when tray bounds are provided', () => {
    const positioner = new Positioner(createWindow());
    positioner.calculate('trayCenter', TRAY_BOUNDS);
    expect(screen.getDisplayMatching).toHaveBeenCalledWith(TRAY_BOUNDS);
    expect(screen.getDisplayNearestPoint).not.toHaveBeenCalled();
  });

  it('falls back to the cursor display when no tray bounds are given', () => {
    const positioner = new Positioner(createWindow());
    positioner.calculate('center');
    expect(screen.getCursorScreenPoint).toHaveBeenCalled();
    expect(screen.getDisplayNearestPoint).toHaveBeenCalled();
    expect(screen.getDisplayMatching).not.toHaveBeenCalled();
  });

  it('snaps tray positions back to topRight.x when they overflow the right edge', () => {
    const positioner = new Positioner(createWindow());
    const overflowing: Rectangle = { x: 1900, y: 0, width: 32, height: 22 };
    expect(positioner.calculate('trayRight', overflowing)).toEqual({
      x: 1520,
      y: 0,
    });
  });

  it('leaves non-tray positions alone even when their x would overflow', () => {
    const positioner = new Positioner(createWindow([3000, 400]));
    expect(positioner.calculate('topRight')).toEqual({ x: -1080, y: 0 });
  });

  it('throws a TypeError when called without a position', () => {
    const positioner = new Positioner(createWindow());
    expect(() =>
      (positioner as unknown as { calculate: () => unknown }).calculate(),
    ).toThrow(TypeError);
  });
});
