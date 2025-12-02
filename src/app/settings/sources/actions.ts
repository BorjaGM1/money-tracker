"use server";

import { db, earningSources } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const sourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function createSource(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = sourceSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.insert(earningSources).values(data);
    revalidatePath("/settings/sources");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to create source"] } };
  }
}

export async function updateSource(id: number, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = sourceSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.update(earningSources).set(data).where(eq(earningSources.id, id));
    revalidatePath("/settings/sources");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to update source"] } };
  }
}

export async function deleteSource(id: number) {
  try {
    await db.delete(earningSources).where(eq(earningSources.id, id));
    revalidatePath("/settings/sources");
    return { success: true };
  } catch {
    return { error: "Failed to delete source" };
  }
}

export async function toggleSourceActive(id: number, isActive: boolean) {
  try {
    await db.update(earningSources).set({ isActive }).where(eq(earningSources.id, id));
    revalidatePath("/settings/sources");
    return { success: true };
  } catch {
    return { error: "Failed to update source" };
  }
}
