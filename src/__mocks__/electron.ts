// https://github.com/electron/electron/issues/3909#issuecomment-190990825

import { type Mock, vi } from 'vitest';

export const MOCK_APP_GETAPPPATH = 'mock.app.getAppPath';

export const app: {
  getAppPath: Mock;
  isReady: () => Promise<void>;
  on: Mock;
  removeListener: Mock;
} = {
  getAppPath: vi.fn(() => MOCK_APP_GETAPPPATH),
  isReady: (): Promise<void> => Promise.resolve(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

export class BrowserWindow {
  destroy: Mock = vi.fn();
  getSize: Mock = vi.fn(() => [400, 400]);
  loadURL: Mock = vi.fn();
  on: Mock = vi.fn();
  setPosition: Mock = vi.fn();
  setVisibleOnAllWorkspaces: Mock = vi.fn();
  show: Mock = vi.fn();
}

export class Tray {
  on: Mock = vi.fn();
  removeListener: Mock = vi.fn();
  setToolTip: Mock = vi.fn();
}

const defaultWorkArea = { x: 0, y: 0, width: 1920, height: 1080 };

export const screen: {
  getCursorScreenPoint: Mock;
  getDisplayMatching: Mock;
  getDisplayNearestPoint: Mock;
} = {
  getCursorScreenPoint: vi.fn(() => ({ x: 0, y: 0 })),
  getDisplayMatching: vi.fn(() => ({ workArea: defaultWorkArea })),
  getDisplayNearestPoint: vi.fn(() => ({ workArea: defaultWorkArea })),
};
