import { db, spendingCategories } from "@/lib/db";
import { asc } from "drizzle-orm";
import { CategoriesList } from "./categories-list";

export default async function CategoriesPage() {
  const categories = await db
    .select()
    .from(spendingCategories)
    .orderBy(asc(spendingCategories.displayOrder), asc(spendingCategories.name));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Spending Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage your spending categories (housing, food, transport, etc.)
          </p>
        </div>
      </div>

      <CategoriesList categories={categories} />
    </div>
  );
}
