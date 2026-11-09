// https://github.com/electron/electron/issues/3909#issuecomment-190990825

import { type Mock, vi } from 'vitest';

export const MOCK_APP_GETAPPPATH = 'mock.app.getAppPath';

export const app: {
  getAppPath: Mock;
  isReady: () => Promise<void>;
  on: Mock;
  removeListener: Mock;
  dock: { hide: Mock; show: Mock; isVisible: Mock };
} = {
  getAppPath: vi.fn(() => MOCK_APP_GETAPPPATH),
  isReady: (): Promise<void> => Promise.resolve(),
  on: vi.fn(),
  removeListener: vi.fn(),
  dock: {
    hide: vi.fn(),
    show: vi.fn(),
    isVisible: vi.fn(() => false),
  },
};

export const autoUpdater: {
  on: Mock;
  removeListener: Mock;
} = {
  on: vi.fn(),
  removeListener: vi.fn(),
};

export class BrowserWindow {
  private _position: [number, number] = [0, 0];
  private _size: [number, number] = [400, 400];
  destroy: Mock = vi.fn();
  getBounds: Mock = vi.fn(() => {
    const [x, y] = this.getPosition() as [number, number];
    const [width, height] = this.getSize() as [number, number];
    return { x, y, width, height };
  });
  getPosition: Mock = vi.fn(() => this._position);
  getSize: Mock = vi.fn(() => this._size);
  hide: Mock = vi.fn();
  isAlwaysOnTop: Mock = vi.fn(() => false);
  isDestroyed: Mock = vi.fn(() => false);
  setAlwaysOnTop: Mock = vi.fn((value: boolean) => {
    this.isAlwaysOnTop.mockReturnValue(value);
  });
  loadURL: Mock = vi.fn();
  on: Mock = vi.fn();
  setBounds: Mock = vi.fn(
    (bounds: { x: number; y: number; width: number; height: number }) => {
      this._position = [bounds.x, bounds.y];
      this._size = [bounds.width, bounds.height];
    },
  );
  setPosition: Mock = vi.fn((x: number, y: number) => {
    this._position = [x, y];
  });
  setVisibleOnAllWorkspaces: Mock = vi.fn();
  show: Mock = vi.fn();
  webContents: { on: Mock; isDevToolsOpened: Mock } = {
    on: vi.fn(),
    isDevToolsOpened: vi.fn(() => false),
  };
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
    scaleFactor: 1,
  })),
  getDisplayNearestPoint: vi.fn(() => ({
    bounds: { ...defaultBounds },
    workArea: { ...defaultWorkArea },
  })),
};
