import { HistoryStore, type KeyValueStore } from '../core/history';
import { DEFAULT_CONFIG, type PracticeConfig } from '../core/session';

const CONFIG_KEY = 'mtl.config.v1';

function safeLocalStorage(): KeyValueStore {
  try {
    const probe = '__mtl_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const map = new Map<string, string>();
    return {
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
      removeItem: (k) => void map.delete(k),
    };
  }
}

export const kv = safeLocalStorage();
export const history = new HistoryStore(kv);

export function requestPersistence(): void {
  void navigator.storage?.persist?.().catch(() => undefined);
}

export type SavedConfig = Omit<PracticeConfig, 'presetId'>;

export function loadConfig(): SavedConfig {
  try {
    const raw = kv.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: SavedConfig): void {
  kv.setItem(CONFIG_KEY, JSON.stringify(config));
}
