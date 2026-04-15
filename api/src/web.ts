/**
 * Web Search & Fetch Provider Clients
 *
 * Stateless helpers for web search (Tavily) and page content fetching (Jina Reader).
 * Mirrors the pattern of daytona.ts — all functions take env bindings as a parameter
 * and use provider API keys from Bindings.
 *
 * The API contract is provider-agnostic: Tavily/Jina could be swapped for Exa
 * or another provider without changing the route schemas.
 */

import type { Bindings } from './types';

// ── Types ──────────────────────────────────────────────────────────

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  answer?: string;
}

export interface WebFetchResponse {
  url: string;
  content: string;
}

// ── Web Search (Tavily) ────────────────────────────────────────────

/**
 * Search the web using the Tavily Search API.
 *
 * @param query   Search query string
 * @param maxResults  Maximum number of results (1–20, default 5)
 * @param env     Worker bindings (must contain TAVILY_API_KEY)
 */
export async function searchWeb(
  query: string,
  maxResults: number,
  env: Bindings,
): Promise<WebSearchResponse> {
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      include_answer: true,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Tavily search failed: HTTP ${resp.status} — ${text.slice(0, 200)}`);
  }

  const data = await resp.json() as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
    }>;
    answer?: string;
  };

  const results: WebSearchResult[] = (data.results ?? []).map((r) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    snippet: r.content ?? '',
  }));

  return {
    results,
    answer: data.answer,
  };
}

// ── Web Fetch (Jina Reader) ────────────────────────────────────────

/**
 * Fetch and extract clean content from a web page using Jina Reader.
 *
 * @param url     The URL to fetch
 * @param format  Response format: 'markdown', 'text', or 'html'
 * @param env     Worker bindings (must contain JINA_API_KEY)
 */
export async function fetchPage(
  url: string,
  format: string,
  env: Bindings,
): Promise<WebFetchResponse> {
  // Jina Reader uses URL path prefix: https://r.jina.ai/{url}
  // Accept header controls output format
  const jinaUrl = `https://r.jina.ai/${url}`;

  const acceptMap: Record<string, string> = {
    markdown: 'text/markdown',
    text: 'text/plain',
    html: 'text/html',
  };

  const resp = await fetch(jinaUrl, {
    headers: {
      'Authorization': `Bearer ${env.JINA_API_KEY}`,
      'Accept': acceptMap[format] ?? 'text/markdown',
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Jina Reader failed: HTTP ${resp.status} — ${text.slice(0, 200)}`);
  }

  const content = await resp.text();

  return { url, content };
}