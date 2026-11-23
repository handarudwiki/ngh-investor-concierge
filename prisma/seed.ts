// Loads the demo workspace (the data shown in docs/screenshots): five team
// members, 14 leads with full conversations, the knowledge base, units,
// templates, audit log and QA reviews. Timestamps are relative to now, so
// re-run `npm run db:seed` to refresh "6m ago"-style activity.

import "dotenv/config";
import { reseed } from "@/lib/db/repo";
import { prisma } from "@/lib/db/prisma";

async function main() {
  await reseed(Date.now());
  const [leads, messages, kb] = await Promise.all([prisma.lead.count(), prisma.message.count(), prisma.kbArticle.count()]);
  console.log(`Seeded ${leads} leads, ${messages} messages, ${kb} knowledge base articles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
