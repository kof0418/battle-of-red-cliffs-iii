/** Optional native bridge; the same build still runs in an ordinary browser. */
declare global {
  interface Window {
    __TAURI__?: { core: { invoke<T = void>(command: string, args?: Record<string, unknown>): Promise<T> } };
  }
}
export const desktop = window.__TAURI__?.core;
