// https://github.com/electron/electron/issues/3909#issuecomment-190990825

import { vi } from 'vitest';

export const MOCK_APP_GETAPPPATH = 'mock.app.getAppPath';

export const app = {
  getAppPath: vi.fn(() => MOCK_APP_GETAPPPATH),
  isReady: (): Promise<void> => Promise.resolve(),
  on: (): void => {
    /* Do nothing */
  },
  removeListener: (): void => {
    /* Do nothing */
  },
};

export class BrowserWindow {
  destroy(): void {
    // Do nothing
  }

  loadURL(): void {
    // Do nothing
  }

  on(): void {
    // Do nothing
  }

  setVisibleOnAllWorkspaces(): void {
    // Do nothing
  }
}

export class Tray {
  on(): void {
    // Do nothing
  }

  removeListener(): void {
    // Do nothing
  }

  setToolTip(): void {
    // Do nothing
  }
}
