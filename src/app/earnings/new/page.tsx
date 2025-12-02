import Link from "next/link";
import { db, earningSources } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EarningForm } from "../earning-form";
import { createEarning } from "../actions";

export default async function NewEarningPage() {
  const sources = await db
    .select()
    .from(earningSources)
    .where(eq(earningSources.isActive, true))
    .orderBy(asc(earningSources.displayOrder));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/earnings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Add Earning</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <EarningForm sources={sources} action={createEarning} />
      </main>
    </div>
  );
}
