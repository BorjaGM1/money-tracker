import { db, earningSources } from "@/lib/db";
import { asc } from "drizzle-orm";
import { SourcesList } from "./sources-list";

export default async function SourcesPage() {
  const sources = await db
    .select()
    .from(earningSources)
    .orderBy(asc(earningSources.displayOrder), asc(earningSources.name));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Earning Sources</h2>
          <p className="text-sm text-muted-foreground">
            Manage your income sources (job, freelance, investments, etc.)
          </p>
        </div>
      </div>

      <SourcesList sources={sources} />
    </div>
  );
}
