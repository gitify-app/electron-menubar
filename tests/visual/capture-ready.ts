export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  tray: Rect;
  window: Rect;
  scale: number;
}

interface FixtureState {
  ready: boolean;
  windowShown: boolean;
  bounds: Bounds | null;
  exited: boolean;
}

// App readiness precedes showWindow() and the fixture's delayed bounds report.
// Waiting must yield to the event loop: synchronous screenshot tools otherwise
// block stdout delivery and can turn a passing capture into an unmasked PNG.
export async function waitForCaptureReady(
  getState: () => FixtureState,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<Bounds> {
  const deadline = Date.now() + timeoutMs;
  const poll = async (): Promise<Bounds> => {
    const { ready, windowShown, bounds, exited } = getState();
    if (exited) throw new Error('fixture exited before capture readiness');
    if (
      ready &&
      windowShown &&
      bounds &&
      Number.isFinite(bounds.scale) &&
      bounds.scale > 0 &&
      Number.isFinite(bounds.window.x) &&
      Number.isFinite(bounds.window.y) &&
      Number.isFinite(bounds.window.width) &&
      Number.isFinite(bounds.window.height) &&
      bounds.window.width > 0 &&
      bounds.window.height > 0
    ) {
      return bounds;
    }
    if (Date.now() >= deadline) {
      throw new Error(
        'fixture did not report a shown window with valid bounds',
      );
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    return poll();
  };
  return poll();
}
