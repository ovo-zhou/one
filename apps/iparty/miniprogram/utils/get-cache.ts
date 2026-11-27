const ttl = 5 * 60_000;
const maxCachedResponses = 100;

export type GetCacheOptions = {
  group: string;
  refresh?: boolean;
  validateHit?: () => Promise<void>;
};

type Address = { baseUrl: string; token: string; path: string };
type Entry = { baseUrl: string; group: string } & (
  | { pending: Promise<unknown> }
  | { data: unknown; expiresAt: number }
);

const entries = new Map<string, Entry>();

export function clearGetCache(): void {
  entries.clear();
}

export function invalidateGetCache(baseUrl: string, groups: readonly string[]): void {
  for (const [key, entry] of entries) {
    if (
      entry.baseUrl === baseUrl &&
      groups.some((group) => entry.group === group || entry.group.startsWith(`${group}/`))
    ) {
      entries.delete(key);
    }
  }
}

function pruneResponses(): void {
  const now = Date.now();
  const freshKeys: string[] = [];
  for (const [key, entry] of entries) {
    if ("pending" in entry) continue;
    if (entry.expiresAt <= now) entries.delete(key);
    else freshKeys.push(key);
  }
  for (const key of freshKeys.slice(0, Math.max(0, freshKeys.length - maxCachedResponses))) {
    entries.delete(key);
  }
}

export async function readCachedGet<T>(
  address: Address,
  options: GetCacheOptions,
  load: () => Promise<T>,
  isCurrentSession: () => boolean,
): Promise<T> {
  const { baseUrl, token, path } = address;
  const { group, refresh, validateHit } = options;
  const key = JSON.stringify([baseUrl, token, path]);
  if (refresh) {
    // Start pagination from a fresh snapshot; do not append pages from before the refresh.
    for (const [entryKey, entry] of entries) {
      if (
        entry.baseUrl === baseUrl &&
        entry.group === group &&
        !(entryKey === key && "pending" in entry)
      ) {
        entries.delete(entryKey);
      }
    }
  }

  const existing = entries.get(key);
  if (existing && "pending" in existing) return existing.pending as Promise<T>;
  if (existing && existing.expiresAt > Date.now()) {
    if (validateHit) await validateHit();
    if (!isCurrentSession()) throw new Error("登录状态已变化，请重试");
    if (entries.get(key) !== existing || existing.expiresAt <= Date.now()) {
      return readCachedGet(address, { ...options, refresh: false }, load, isCurrentSession);
    }
    entries.delete(key);
    entries.set(key, existing);
    return existing.data as T;
  }

  const entry = {
    baseUrl,
    group,
    pending: Promise.resolve()
      .then(load)
      .then((data) => {
        if (!isCurrentSession()) throw new Error("登录状态已变化，请重试");
        // A GET started before a write or session change must not refill the cache.
        if (entries.get(key) === entry) {
          entries.delete(key);
          entries.set(key, { baseUrl, group, data, expiresAt: Date.now() + ttl });
          pruneResponses();
        }
        return data;
      })
      .finally(() => {
        if (entries.get(key) === entry) entries.delete(key);
      }),
  };
  entries.set(key, entry);
  return entry.pending;
}
