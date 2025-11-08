'use server';

import redis from '@/cache';

const keyFor = (id: string) => `pageviews:article:${id}`;

export async function incrementPageview(articleId: string) {
  const articleKey = keyFor(articleId);
  const newVal = await redis.incr(articleKey);
  return +newVal;
}
