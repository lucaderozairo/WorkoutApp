import type { Deal, Headline } from '@shared/contracts';

const CACHE_DURATION_MS = 60 * 60 * 1000;

interface NewsCache {
  headlines: Headline[];
  deals: Deal[];
  timestamp: number;
}

let cache: NewsCache | null = null;
let keyWarningLogged = false;

function getNewsApiKey(): string | undefined {
  try {
    return (import.meta as any).env?.VITE_NEWS_API_KEY;
  } catch {
    return undefined;
  }
}

export async function fetchNews(): Promise<{ headlines: Headline[]; deals: Deal[] }> {
  const apiKey = getNewsApiKey();
  if (!apiKey) return getStubNews();

  // VITE_ env vars are inlined into the client bundle and visible in DevTools.
  // Before shipping with a real key, proxy this call through a serverless function
  // (e.g. Cloudflare Worker) so the key stays server-side.
  if (!(import.meta as any).env?.DEV && !keyWarningLogged) {
    console.warn('[security] VITE_NEWS_API_KEY is exposed in the client bundle. Proxy via a serverless function before production use.');
    keyWarningLogged = true;
  }

  if (cache && Date.now() - cache.timestamp < CACHE_DURATION_MS) return { headlines: cache.headlines, deals: cache.deals };

  try {
    const query = encodeURIComponent('fitness OR workout OR nutrition OR health');
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`News API error: ${response.status}`);
    const data = await response.json();
    const headlines = parseNewsArticles(data.articles ?? []);
    const deals: Deal[] = [];
    cache = { headlines, deals, timestamp: Date.now() };
    return { headlines, deals };
  } catch (error) {
    console.warn('News fetch failed, using stub data:', error);
    return getStubNews();
  }
}

function parseNewsArticles(articles: Array<Record<string, unknown>>): Headline[] {
  return articles
    .filter(a => a.title && a.url && a.publishedAt)
    .map((a, i) => ({
      id: `news-${i}` as any,
      title: a.title as string,
      source: (a.source as Record<string, string>)?.name ?? 'Unknown',
      url: a.url as string,
      publishedAt: new Date(a.publishedAt as string).getTime(),
      isRead: false,
    }));
}

function getStubNews(): { headlines: Headline[]; deals: Deal[] } {
  return {
    headlines: [
      { id: 'h1' as any, title: 'New study shows HIIT improves cardiovascular health', source: 'Fitness Weekly', url: '#', publishedAt: Date.now() - 3600000, isRead: false },
      { id: 'h2' as any, title: 'Best pre-workout nutrition strategies', source: 'Sports Nutrition', url: '#', publishedAt: Date.now() - 7200000, isRead: false },
      { id: 'h3' as any, title: 'Why rest days are crucial for muscle growth', source: 'Health Digest', url: '#', publishedAt: Date.now() - 86400000, isRead: true },
    ],
    deals: [
      { id: 'd1' as any, brand: 'FitGear', title: '20% off resistance bands', url: '#', expiresAt: Date.now() + 86400000 * 7, discountPercent: 20 },
      { id: 'd2' as any, brand: 'RunPro', title: 'Free shipping over $50', url: '#', expiresAt: Date.now() + 86400000 * 14, discountPercent: 0 },
    ],
  };
}
