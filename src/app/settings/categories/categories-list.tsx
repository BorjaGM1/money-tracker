"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { createCategory, updateCategory, deleteCategory, toggleCategoryActive } from "./actions";
import type { SpendingCategory } from "@/lib/db";
import { slugify } from "@/lib/utils";

interface CategoriesListProps {
  categories: SpendingCategory[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const [editingCategory, setEditingCategory] = useState<SpendingCategory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Separate parents and children
  const parentCategories = categories.filter((c) => c.parentId === null);
  const childrenByParent = new Map<number, SpendingCategory[]>();
  for (const cat of categories) {
    if (cat.parentId !== null) {
      const existing = childrenByParent.get(cat.parentId) || [];
      existing.push(cat);
      childrenByParent.set(cat.parentId, existing);
    }
  }

  async function handleCreate(formData: FormData) {
    setError(null);
    const result = await createCategory(formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setIsCreateOpen(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingCategory) return;
    setError(null);
    const result = await updateCategory(editingCategory.id, formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setEditingCategory(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const result = await deleteCategory(id);
    if (result.error) {
      alert(result.error);
    }
  }

  async function handleToggleActive(id: number, currentState: boolean | null) {
    await toggleCategoryActive(id, !currentState);
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Spending Category</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <CategoryForm parentCategories={parentCategories} error={error} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories List - Hierarchical */}
      {parentCategories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No spending categories yet. Add your first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {parentCategories.map((parent) => {
            const children = childrenByParent.get(parent.id) || [];

            return (
              <div key={parent.id} className="space-y-1">
                {/* Parent Category */}
                <Card className={!parent.isActive ? "opacity-50" : ""}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: parent.color || "#888" }}
                      />
                      <div>
                        <div className="font-medium">{parent.name}</div>
                        <div className="text-sm text-muted-foreground">{parent.slug}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(parent.id, parent.isActive)}
                      >
                        {parent.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Dialog open={editingCategory?.id === parent.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingCategory(parent)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                          </DialogHeader>
                          <form action={handleUpdate} className="space-y-4">
                            <CategoryForm
                              category={parent}
                              parentCategories={parentCategories.filter((p) => p.id !== parent.id)}
                              error={error}
                            />
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button type="submit">Save</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(parent.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Child Categories */}
                {children.map((child) => (
                  <Card key={child.id} className={`ml-6 ${!child.isActive ? "opacity-50" : ""}`}>
                    <CardContent className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: child.color || "#888" }}
                        />
                        <div>
                          <div className="font-medium text-sm">{child.name}</div>
                          <div className="text-xs text-muted-foreground">{child.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(child.id, child.isActive)}
                        >
                          {child.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Dialog open={editingCategory?.id === child.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingCategory(child)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Subcategory</DialogTitle>
                            </DialogHeader>
                            <form action={handleUpdate} className="space-y-4">
                              <CategoryForm
                                category={child}
                                parentCategories={parentCategories}
                                error={error}
                              />
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  parentCategories,
  error,
}: {
  category?: SpendingCategory;
  parentCategories: SpendingCategory[];
  error?: string | null;
}) {
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!category);

  function handleNameChange(value: string) {
    setName(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  }

  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Groceries"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="e.g., groceries"
          required
        />
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parentId">Parent Category (optional)</Label>
        <Select name="parentId" defaultValue={category?.parentId?.toString() || ""}>
          <SelectTrigger>
            <SelectValue placeholder="None (top-level category)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (top-level category)</SelectItem>
            {parentCategories.map((parent) => (
              <SelectItem key={parent.id} value={parent.id.toString()}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: parent.color || "#888" }}
                  />
                  {parent.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={category?.color || "#3b82f6"}
            className="w-12 h-9 p-1"
          />
          <Input
            name="color"
            defaultValue={category?.color || "#3b82f6"}
            placeholder="#3b82f6"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon">Icon (Lucide icon name)</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={category?.icon || ""}
          placeholder="e.g., shopping-cart, home, car"
        />
      </div>
    </>
  );
}
