import { getFeed } from '@/routes/admin/storage';
import type { Route } from '@/types';
import parser from '@/utils/rss-parser';

export const handler = async (ctx: any) => {
    const { slug } = ctx.req.param() as { slug: string };

    const feed = await getFeed(slug);
    if (!feed) {
        ctx.status(404);
        return ctx.json({ error: `Feed "${slug}" not found` });
    }

    let parsed;
    try {
        parsed = await parser.parseURL(feed.url);
    } catch (error) {
        ctx.status(502);
        return ctx.json({ error: `Failed to fetch feed: ${(error as Error).message}` });
    }

    return {
        title: parsed.title || feed.name,
        description: parsed.description || feed.description || '',
        link: parsed.link || feed.url,
        image: parsed.image?.url,
        language: parsed.language,
        item: (parsed.items ?? []).map((item) => ({
            title: item.title,
            description: item.content || item.contentSnippet || item.summary,
            link: item.link,
            pubDate: item.pubDate || item.isoDate,
            author: item.creator || item.author,
            guid: item.guid || item.link,
        })),
    };
};

export const route: Route = {
    path: '/:slug',
    name: 'Custom RSS Proxy',
    maintainers: [],
    handler,
    example: '/proxy/my-feed',
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportRadar: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
};
