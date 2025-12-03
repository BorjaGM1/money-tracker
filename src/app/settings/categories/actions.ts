"use server";

import { db, spendingCategories } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  parentId: z.number().nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  const parentIdStr = formData.get("parentId") as string;
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    parentId: parentIdStr && parentIdStr !== "" ? parseInt(parentIdStr) : null,
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.insert(spendingCategories).values(data);
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to create category"] } };
  }
}

export async function updateCategory(id: number, formData: FormData) {
  const parentIdStr = formData.get("parentId") as string;
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    parentId: parentIdStr && parentIdStr !== "" ? parseInt(parentIdStr) : null,
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.update(spendingCategories).set(data).where(eq(spendingCategories.id, id));
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to update category"] } };
  }
}

export async function deleteCategory(id: number) {
  try {
    // First check if this category has children
    const children = await db.query.spendingCategories.findFirst({
      where: (table, { eq }) => eq(table.parentId, id),
    });

    if (children) {
      return { error: "Cannot delete category with subcategories. Delete subcategories first." };
    }

    // Check if there are spending entries using this category
    const hasSpending = await db.query.spending.findFirst({
      where: (table, { eq }) => eq(table.categoryId, id),
    });

    if (hasSpending) {
      return { error: "Cannot delete category that has spending entries. Consider disabling it instead." };
    }

    await db.delete(spendingCategories).where(eq(spendingCategories.id, id));
    revalidatePath("/settings/categories");
    return { success: true };
  } catch {
    return { error: "Failed to delete category" };
  }
}

export async function toggleCategoryActive(id: number, isActive: boolean) {
  try {
    await db.update(spendingCategories).set({ isActive }).where(eq(spendingCategories.id, id));
    revalidatePath("/settings/categories");
    return { success: true };
  } catch {
    return { error: "Failed to update category" };
  }
}
