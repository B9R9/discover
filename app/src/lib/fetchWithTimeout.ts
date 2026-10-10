type Fetch = typeof fetch;

export interface FetchedText {
  ok: boolean;
  status: number;
  text: string;
}

// fetch has no timeout of its own: on a bad network it can hang for good.
const TIMEOUT_MS = 10_000;

// Reads the whole body before the timer stops, so a body that never ends also times out.
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  fetchFn: Fetch = fetch,
): Promise<FetchedText> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchFn(url, { ...init, signal: controller.signal });
    return { ok: response.ok, status: response.status, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}
