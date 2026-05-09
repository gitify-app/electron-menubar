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
  loadURL: Mock = vi.fn();
  on: Mock = vi.fn();
  setVisibleOnAllWorkspaces: Mock = vi.fn();
}

export class Tray {
  on: Mock = vi.fn();
  removeListener: Mock = vi.fn();
  setToolTip: Mock = vi.fn();
}
