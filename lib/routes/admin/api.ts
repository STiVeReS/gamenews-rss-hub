import type { Handler } from 'hono';

import { addFeed, deleteFeed, getFeed, getFeeds, type CustomFeed } from './storage';

function isAuthorized(ctx: Parameters<Handler>[0]): boolean {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
        return true;
    }
    const fromQuery = ctx.req.query('key');
    const fromHeader = ctx.req.header('authorization')?.replace('Bearer ', '');
    return fromQuery === adminKey || fromHeader === adminKey;
}

export const listFeedsHandler: Handler = async (ctx) => {
    if (!isAuthorized(ctx)) {
        return ctx.json({ error: 'Unauthorized' }, 401);
    }
    const feeds = await getFeeds();
    return ctx.json(feeds);
};

export const createFeedHandler: Handler = async (ctx) => {
    if (!isAuthorized(ctx)) {
        return ctx.json({ error: 'Unauthorized' }, 401);
    }

    let body: { name?: string; url?: string; slug?: string; description?: string };
    try {
        body = await ctx.req.json();
    } catch {
        return ctx.json({ error: 'Invalid JSON body' }, 400);
    }

    const { name, url, slug, description } = body;

    if (!name || !url || !slug) {
        return ctx.json({ error: 'name, url, and slug are required' }, 400);
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return ctx.json({ error: 'slug must contain only lowercase letters, numbers, and hyphens' }, 400);
    }
    try {
        new URL(url);
    } catch {
        return ctx.json({ error: 'Invalid URL' }, 400);
    }

    const existing = await getFeed(slug);
    if (existing) {
        return ctx.json({ error: 'Slug already exists' }, 409);
    }

    const feed: CustomFeed = { slug, name, url, description, addedAt: new Date().toISOString() };
    await addFeed(feed);
    return ctx.json(feed, 201);
};

export const deleteFeedHandler: Handler = async (ctx) => {
    if (!isAuthorized(ctx)) {
        return ctx.json({ error: 'Unauthorized' }, 401);
    }
    const slug = ctx.req.param('slug');
    const deleted = await deleteFeed(slug);
    if (!deleted) {
        return ctx.json({ error: 'Feed not found' }, 404);
    }
    return ctx.json({ success: true });
};
