import cacheModule from '@/utils/cache';

const FEEDS_KEY = 'gamenews:custom-feeds';

export interface CustomFeed {
    slug: string;
    name: string;
    url: string;
    description?: string;
    addedAt: string;
}

// In-memory fallback when Redis is not available
let memoryFeeds: CustomFeed[] = [];

function getRedisClient() {
    const clients = (cacheModule as any).clients as { redisClient?: any };
    return clients?.redisClient ?? null;
}

export async function getFeeds(): Promise<CustomFeed[]> {
    const redis = getRedisClient();
    if (redis) {
        const raw = await redis.get(FEEDS_KEY);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                return [];
            }
        }
        return [];
    }
    return memoryFeeds;
}

async function saveFeeds(feeds: CustomFeed[]): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
        await redis.set(FEEDS_KEY, JSON.stringify(feeds));
    } else {
        memoryFeeds = feeds;
    }
}

export async function addFeed(feed: CustomFeed): Promise<void> {
    const feeds = await getFeeds();
    feeds.push(feed);
    await saveFeeds(feeds);
}

export async function deleteFeed(slug: string): Promise<boolean> {
    const feeds = await getFeeds();
    const updated = feeds.filter((f) => f.slug !== slug);
    if (updated.length === feeds.length) {
        return false;
    }
    await saveFeeds(updated);
    return true;
}

export async function getFeed(slug: string): Promise<CustomFeed | undefined> {
    const feeds = await getFeeds();
    return feeds.find((f) => f.slug === slug);
}
