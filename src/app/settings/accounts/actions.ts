"use server";

import { db, accounts } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  type: z.enum(["bank", "investment", "crypto", "cash"]).default("bank"),
  currency: z.string().default("EUR"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function createAccount(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    type: formData.get("type") as string || "bank",
    currency: formData.get("currency") as string || "EUR",
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = accountSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.insert(accounts).values(data);
    revalidatePath("/settings/accounts");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to create account"] } };
  }
}

export async function updateAccount(id: number, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    type: formData.get("type") as string || "bank",
    currency: formData.get("currency") as string || "EUR",
    color: formData.get("color") as string || null,
    icon: formData.get("icon") as string || null,
  };

  const result = accountSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }

  try {
    await db.update(accounts).set(data).where(eq(accounts.id, id));
    revalidatePath("/settings/accounts");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return { error: { slug: ["This slug already exists"] } };
    }
    return { error: { _form: ["Failed to update account"] } };
  }
}

export async function deleteAccount(id: number) {
  try {
    await db.delete(accounts).where(eq(accounts.id, id));
    revalidatePath("/settings/accounts");
    return { success: true };
  } catch {
    return { error: "Failed to delete account" };
  }
}

export async function toggleAccountActive(id: number, isActive: boolean) {
  try {
    await db.update(accounts).set({ isActive }).where(eq(accounts.id, id));
    revalidatePath("/settings/accounts");
    return { success: true };
  } catch {
    return { error: "Failed to update account" };
  }
}
