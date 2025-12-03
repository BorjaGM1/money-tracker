import Link from "next/link";
import { db, spendingCategories } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SpendingForm } from "../spending-form";
import { createSpending } from "../actions";

export default async function NewSpendingPage() {
  const categories = await db
    .select()
    .from(spendingCategories)
    .where(eq(spendingCategories.isActive, true))
    .orderBy(asc(spendingCategories.displayOrder));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/spending">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Add Spending</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <SpendingForm categories={categories} action={createSpending} />
      </main>
    </div>
  );
}
