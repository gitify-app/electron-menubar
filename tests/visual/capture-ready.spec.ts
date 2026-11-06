import { afterEach, describe, expect, it, vi } from 'vitest';

import { type Bounds, waitForCaptureReady } from './capture-ready';

const bounds: Bounds = {
  tray: { x: 775, y: 0, width: 38, height: 30 },
  window: { x: 400, y: 200, width: 200, height: 100 },
  scale: 1,
};

function fixtureState() {
  return {
    ready: true,
    windowShown: false,
    bounds: null as Bounds | null,
    exited: false,
  };
}

describe('waitForCaptureReady', () => {
  afterEach(() => vi.useRealTimers());

  it('waits for delayed window readiness instead of capturing at app ready', async () => {
    vi.useFakeTimers();
    const state = fixtureState();
    const resolved = vi.fn();
    const pending = waitForCaptureReady(() => state, 30_000, 100).then(
      resolved,
    );

    // Reproduce macOS taking longer than the old 3-second post-ready delay.
    await vi.advanceTimersByTimeAsync(5_000);
    expect(resolved).not.toHaveBeenCalled();
    state.bounds = bounds;
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).not.toHaveBeenCalled();
    state.windowShown = true;
    await vi.advanceTimersByTimeAsync(100);
    await pending;
    expect(resolved).toHaveBeenCalledWith(bounds);
  });

  it('requires bounds even when window-shown has arrived', async () => {
    vi.useFakeTimers();
    const state = { ...fixtureState(), windowShown: true };
    const pending = waitForCaptureReady(() => state, 500, 100);
    const assertion = expect(pending).rejects.toThrow('valid bounds');
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it('accepts zero tray bounds used by Linux SNI panels', async () => {
    const linuxBounds = {
      ...bounds,
      tray: { x: 0, y: 0, width: 0, height: 0 },
    };
    await expect(
      waitForCaptureReady(
        () => ({ ...fixtureState(), windowShown: true, bounds: linuxBounds }),
        500,
        100,
      ),
    ).resolves.toEqual(linuxBounds);
  });

  it.each([
    { ...bounds, window: { x: 0, y: 0, width: 0, height: 0 } },
    { ...bounds, window: { ...bounds.window, width: Number.NaN } },
    { ...bounds, scale: 0 },
  ])('rejects invalid window bounds or scale: %j', async (invalidBounds) => {
    vi.useFakeTimers();
    const pending = waitForCaptureReady(
      () => ({ ...fixtureState(), windowShown: true, bounds: invalidBounds }),
      500,
      100,
    );
    const assertion = expect(pending).rejects.toThrow('valid bounds');
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it('stops waiting when the fixture exits', async () => {
    await expect(
      waitForCaptureReady(
        () => ({ ...fixtureState(), exited: true }),
        30_000,
        100,
      ),
    ).rejects.toThrow('fixture exited');
  });
});
