import Link from "next/link";
import { db, earnings, earningSources } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EarningForm } from "../../earning-form";
import { updateEarning } from "../../actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEarningPage({ params }: PageProps) {
  const { id } = await params;
  const earningId = parseInt(id);

  const [earning] = await db
    .select()
    .from(earnings)
    .where(eq(earnings.id, earningId));

  if (!earning) {
    notFound();
  }

  const sources = await db
    .select()
    .from(earningSources)
    .where(eq(earningSources.isActive, true))
    .orderBy(asc(earningSources.displayOrder));

  const handleUpdate = async (formData: FormData) => {
    "use server";
    await updateEarning(earningId, formData);
  };

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
          <h1 className="text-xl font-bold">Edit Earning</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <EarningForm sources={sources} earning={earning} action={handleUpdate} />
      </main>
    </div>
  );
}
