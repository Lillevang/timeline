// Encode/decode the DSL for the URL fragment: deflate-raw compressed, base64url encoded.
// Uses the native CompressionStream API — no dependencies.

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(payload: string): Uint8Array {
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encodeDSL(dsl: string): Promise<string> {
  const stream = new Blob([new TextEncoder().encode(dsl)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  const buffer = await new Response(stream).arrayBuffer();
  return bytesToBase64Url(new Uint8Array(buffer));
}

export async function decodeDSL(payload: string): Promise<string> {
  const stream = new Blob([base64UrlToBytes(payload)])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(stream).text();
}

// --- Short-link integration (url-shortener at s.lvang.dev) ---------------
// POST / mints {slug, short_url}; PUT /{slug} repoints an existing slug so the
// short link stays stable while the timeline evolves. We remember our slug in
// localStorage and PUT on subsequent shares, falling back to POST if it's gone.

const SHORTENER_URL: string = import.meta.env.VITE_SHORTENER_URL || 'https://s.lvang.dev';
const SLUG_STORAGE_KEY = 'timeline-share-slug';

export interface ShareResult {
  shortUrl: string;
  created: boolean; // false when an existing short link was repointed
}

async function writeLink(method: 'POST' | 'PUT', path: string, target: string): Promise<Response> {
  return fetch(`${SHORTENER_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, ttl_seconds: 0 }),
  });
}

async function shareError(res: Response): Promise<Error> {
  const body = (await res.text().catch(() => '')).trim();
  return new Error(body ? `${res.status}: ${body}` : `request failed (${res.status})`);
}

export async function shareTimeline(target: string): Promise<ShareResult> {
  const slug = localStorage.getItem(SLUG_STORAGE_KEY);

  if (slug) {
    const res = await writeLink('PUT', `/${slug}`, target);
    if (res.ok) {
      const { short_url } = await res.json();
      return { shortUrl: short_url, created: false };
    }
    if (res.status !== 404) throw await shareError(res);
    // Our slug no longer exists — forget it and mint a fresh one
    localStorage.removeItem(SLUG_STORAGE_KEY);
  }

  const res = await writeLink('POST', '/', target);
  if (!res.ok) throw await shareError(res);
  const { slug: newSlug, short_url } = await res.json();
  localStorage.setItem(SLUG_STORAGE_KEY, newSlug);
  return { shortUrl: short_url, created: true };
}

export function readDSLFromHash(): string | null {
  const match = window.location.hash.match(/^#d=(.+)$/);
  return match ? match[1] : null;
}

export function writeDSLToHash(payload: string): void {
  history.replaceState(null, '', `#d=${payload}`);
}
