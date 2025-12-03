import Link from "next/link";
import { db, spending, spendingCategories } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SpendingForm } from "../../spending-form";
import { updateSpending } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSpendingPage({ params }: PageProps) {
  const { id } = await params;
  const spendingId = parseInt(id);

  const [spendingEntry] = await db
    .select()
    .from(spending)
    .where(eq(spending.id, spendingId));

  if (!spendingEntry) {
    notFound();
  }

  const categories = await db
    .select()
    .from(spendingCategories)
    .where(eq(spendingCategories.isActive, true))
    .orderBy(asc(spendingCategories.displayOrder));

  const handleUpdate = async (formData: FormData) => {
    "use server";
    await updateSpending(spendingId, formData);
  };

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
          <h1 className="text-xl font-bold">Edit Spending</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <SpendingForm categories={categories} spending={spendingEntry} action={handleUpdate} />
      </main>
    </div>
  );
}
