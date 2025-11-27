import { unstable_cache } from 'next/cache';

type Primitive = string | number | boolean | null | undefined;

type CacheOptions = {
  revalidate?: number;
  tags?: string[];
};

const DEFAULT_REVALIDATE = 60; // seconds

export function buildCacheKey(parts: Primitive[]): string[] {
  return parts.map((part) => (part === undefined ? 'undefined' : part === null ? 'null' : String(part)));
}

export async function cached<T>(keyParts: Primitive[], fn: () => Promise<T>, options?: CacheOptions) {
  const cacheKey = buildCacheKey(keyParts);
  const cachedFn = unstable_cache(fn, cacheKey, {
    revalidate: options?.revalidate ?? DEFAULT_REVALIDATE,
    tags: options?.tags,
  });
  return cachedFn();
}
