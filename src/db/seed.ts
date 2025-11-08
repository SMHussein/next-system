import { usersSync } from "drizzle-orm/neon";
import { seed } from "drizzle-seed";
import db, { sql } from "@/db/index";
import { articles, articleTags, tags } from "@/db/schema";

const SEED_COUNT = 25;
const SEED = 1337;

const TAG_NAMES = [
  "JavaScript",
  "React",
  "Next.js",
  "TypeScript",
  "AI",
  "CSS",
  "Web Performance",
  "Design Systems",
  "Testing",
  "DevOps",
  "Node.js",
  "Git",
  "Accessibility",
  "Debugging",
  "Frontend",
];

async function main() {
  try {
    console.log(`🌱 Starting DB seed with seed ${SEED}...`);

    // Wipe tables the right way and reset sequences.
    console.log("🧹 Truncating tables and restarting identity...");

    await db.delete(articles);
    await db.delete(tags);
    await db.delete(articleTags);

    console.log("🔎 Querying existing users...");
    const users = await db
      .select({ id: usersSync.id })
      .from(usersSync)
      .orderBy(usersSync.id);
    const ids = users.map((user) => user.id);
    console.log(`👥 Found ${users.length} user(s)`);

    if (users.length === 0) {
      console.error(
        "❌ No users found in the database. Seed cannot assign authorId without existing users.",
      );
      process.exit(1);
    }

    console.log("🍩 Seeding tags...");
    await seed(db, { tags }, { seed: SEED }).refine((funcs) => ({
      tags: {
        count: TAG_NAMES.length,
        columns: {
          name: funcs.valuesFromArray({
            values: TAG_NAMES,
            isUnique: true,
          }),
          slug: funcs.string({ isUnique: true }),
        },
        createdAt: funcs.timestamp(),
        updatedAt: funcs.timestamp(),
      },
    }));

    console.log("📰 Seeding articles...");
    await seed(db, { articles }, { seed: SEED }).refine((funcs) => ({
      articles: {
        count: SEED_COUNT,
        columns: {
          authorId: funcs.valuesFromArray({
            values: ids,
            isUnique: false,
          }),
          content: funcs.valuesFromArray({
            values: [
              "*Sometimes I think the best way to debug JavaScript is to pretend the bug is shy.*\nI whisper `console.log` into its ear and if it doesn't blush I add more `console.log`.\nIf it still won't blush, I rename the file and call it \"ancient wisdom.md\" and hope for the best.",
              "**If a website loads slowly in the forest and no one's there to notice, is it still a performance problem?**\nI like to leave a `TODO: optimize` comment so future me has something to feel guilty about.\nOne day we'll invent a framework that fixes itself, and then we'll all feel obsolete and oddly relieved.",
              "Sometimes I imagine AI as a polite librarian that keeps rearranging your code into mysterious haikus.\nIt writes tests, then writes more tests for the tests, then asks me where it left my keys.\nI rewarded it with a coffee emoji and it returned my `null` reference with a sonnet.",
              'I like to think of CSS as a quiet conspiracy between `div`s and `float`.\nWhen they get together they whisper, "let\'s be unpredictable today," and the layout obliges.\nIf you catch them plotting, throw a `grid` at them and walk away slowly.',
              "There is nothing more spiritual than finally getting `npm install` to finish without errors.\nFor a moment you stand at the terminal and gaze into the dependency graph like it's a small, compliant cosmos.\nThen some transitive package updates and the quiet cosmos becomes chaos again.",
              '*A good commit message is like a fortune cookie: concise, mysterious, and slightly optimistic.*\nI once wrote "fix stuff" and the repo forgave me because the tests passed.\nAt the release party we all toasted with empty energy drink cans and the CI kept humming like a lullaby.',
              'When AI suggests a refactor, I nod like a Jedi and say "use the Force."\nThen I open the PR and watch the humans argue about semicolons.\nIf the argument ends in a 2–1 vote and a bike-shedding session, progress has been made.',
              'The best time to deploy is always after you\'ve gone home, fed your plants, and forgotten that you deployed.\nIf something goes wrong, call it a "surprise feature" and add it to the changelog under `enhancement`.\nEventually your users will love it, or you\'ll rename it to "beta until further notice."',
              "I entered a room once and the whiteboard asked for my opinion on the architecture.\nI drew a smiley face and wrote `microservices` under it because the smiley was clearly decoupled.\nThe next sprint we replaced the smiley with a service and everything worked *but* the coffee machine stopped responding.",
              "If code is poetry, then React is free verse and TypeScript is the editor who insists on footnotes.\nI like writing components that are tiny, honest, and slightly apologetic.\nWhen they render, they clap politely and the browser pretends it wasn't moved to tears.",
            ],
            isUnique: false,
          }),
          title: funcs.loremIpsum({ sentencesCount: 1 }),
          imageUrl: funcs.default({ defaultValue: null }),
          published: funcs.default({ defaultValue: true }),
        },
        updatedAt: funcs.timestamp(),
        createdAt: funcs.timestamp(),
        slug: funcs.string({ isUnique: true }),
      },
    }));

    console.log("🔗 Building article–tag links from REAL IDs...");
    // 1) Read real IDs
    const tagIds = (await db.select({ id: tags.id }).from(tags)).map(
      (r) => r.id,
    );
    const articleIds = (
      await db.select({ id: articles.id }).from(articles)
    ).map((r) => r.id);

    // Guard: if either is empty, bail early
    if (tagIds.length === 0 || articleIds.length === 0) {
      throw new Error(
        "Tags or Articles missing after seeding. Cannot create articleTags.",
      );
    }

    // 2) Build unique pairs (1–3 tags per article)
    function pickRandom<T>(arr: T[], k: number) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, k);
    }

    const seen = new Set<string>();
    const pairs: { articleId: number | string; tagId: number | string }[] = [];

    for (const aId of articleIds) {
      const howMany =
        1 + Math.floor(Math.random() * Math.min(3, tagIds.length));
      for (const tId of pickRandom(tagIds, howMany)) {
        const key = `${aId}:${tId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ articleId: aId, tagId: tId });
      }
    }

    // 3) Insert join rows
    if (pairs.length) {
      // If you defined composite PK (articleId, tagId), this will naturally dedupe.
      // Postgres driver supports .onConflictDoNothing()
      // @ts-expect-error: available in drizzle-pg; ignore type noise for other drivers.
      await db.insert(articleTags).values(pairs).onConflictDoNothing?.();
      console.log(`🧩 Inserted ${pairs.length} articleTags links`);
    } else {
      console.warn("⚠️ No article–tag pairs generated.");
    }

    console.log(`✅ Inserted ${SEED_COUNT} article(s) into the database\n`);

    // Sequence sync (paranoid safety; TRUNCATE RESTART IDENTITY already reset it)
    try {
      await sql.query(
        `SELECT setval(pg_get_serial_sequence('articles','id'), COALESCE((SELECT MAX(id) FROM articles), 1), true);`,
      );
      console.log("✅ Sequence synced after seeding");
    } catch (err) {
      console.warn("⚠️ Failed to sync articles sequence after seeding:", err);
    }
  } catch (err) {
    console.error("💥 Seed failed:", err);
    process.exit(1);
  }
}

void main();
