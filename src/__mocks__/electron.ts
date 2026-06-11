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
  private _position: [number, number] = [0, 0];
  destroy: Mock = vi.fn();
  getPosition: Mock = vi.fn(() => this._position);
  getSize: Mock = vi.fn(() => [400, 400]);
  hide: Mock = vi.fn();
  isAlwaysOnTop: Mock = vi.fn(() => false);
  loadURL: Mock = vi.fn();
  on: Mock = vi.fn();
  setPosition: Mock = vi.fn((x: number, y: number) => {
    this._position = [x, y];
  });
  setVisibleOnAllWorkspaces: Mock = vi.fn();
  show: Mock = vi.fn();
  webContents: { on: Mock } = { on: vi.fn() };
}

export const globalShortcut: {
  isRegistered: Mock;
  register: Mock;
  unregister: Mock;
} = {
  isRegistered: vi.fn(() => false),
  register: vi.fn(() => true),
  unregister: vi.fn(),
};

export class Tray {
  getBounds: Mock = vi.fn(() => ({ x: 0, y: 0, width: 32, height: 32 }));
  isDestroyed: Mock = vi.fn(() => false);
  on: Mock = vi.fn();
  popUpContextMenu: Mock = vi.fn();
  removeListener: Mock = vi.fn();
  setContextMenu: Mock = vi.fn();
  setIgnoreDoubleClickEvents: Mock = vi.fn();
  setToolTip: Mock = vi.fn();
}

const defaultWorkArea = { x: 0, y: 0, width: 1920, height: 1080 };
const defaultBounds = { x: 0, y: 0, width: 1920, height: 1080 };

export const screen: {
  getCursorScreenPoint: Mock;
  getDisplayMatching: Mock;
  getDisplayNearestPoint: Mock;
} = {
  getCursorScreenPoint: vi.fn(() => ({ x: 0, y: 0 })),
  getDisplayMatching: vi.fn(() => ({
    bounds: { ...defaultBounds },
    workArea: { ...defaultWorkArea },
  })),
  getDisplayNearestPoint: vi.fn(() => ({
    bounds: { ...defaultBounds },
    workArea: { ...defaultWorkArea },
  })),
};
