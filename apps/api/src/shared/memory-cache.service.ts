import { Injectable } from '@nestjs/common';

type Entry = { exp: number; value: unknown };

@Injectable()
export class MemoryCacheService {
  private readonly store = new Map<string, Entry>();

  get<T>(key: string): T | null {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (hit.exp < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlMs = 60_000) {
    this.store.set(key, { exp: Date.now() + ttlMs, value });
  }

  delPrefix(prefix: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear() {
    this.store.clear();
  }
}
