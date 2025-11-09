"use server";

import redis from "@/cache";
import sendCelebrationEmail from "@/email/celebration-email";

const mileStones = [10, 50, 100, 1000];
const keyFor = (id: string) => `pageviews:article:${id}`;

export async function incrementPageview(articleId: string) {
  const articleKey = keyFor(articleId);
  const newVal = await redis.incr(articleKey);

  if (mileStones.includes(newVal)) {
    sendCelebrationEmail(articleId, newVal);
  }

  return newVal;
}
