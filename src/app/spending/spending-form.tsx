"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SpendingCategory, Spending } from "@/lib/db";

interface SpendingFormProps {
  categories: SpendingCategory[];
  spending?: Spending;
  action: (formData: FormData) => Promise<void>;
}

const CURRENCIES = ["EUR", "USD", "GBP"];

export function SpendingForm({ categories, spending, action }: SpendingFormProps) {
  const today = new Date().toISOString().split("T")[0];

  // Group categories by parent
  const parentCategories = categories.filter((c) => c.parentId === null);
  const childrenByParent = new Map<number, SpendingCategory[]>();
  for (const cat of categories) {
    if (cat.parentId !== null) {
      const existing = childrenByParent.get(cat.parentId) || [];
      existing.push(cat);
      childrenByParent.set(cat.parentId, existing);
    }
  }

  // Find initial parent from existing spending
  const getInitialParentId = () => {
    if (!spending?.categoryId) return "";
    const selectedCat = categories.find((c) => c.id === spending.categoryId);
    if (!selectedCat) return "";
    // If it's a parent, return its id
    if (selectedCat.parentId === null) return selectedCat.id.toString();
    // If it's a child, return parent id
    return selectedCat.parentId.toString();
  };

  const [selectedParentId, setSelectedParentId] = useState<string>(getInitialParentId());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(spending?.categoryId?.toString() || "");

  // Get subcategories for selected parent
  const subcategories = selectedParentId ? childrenByParent.get(parseInt(selectedParentId)) || [] : [];

  // When parent changes, reset subcategory selection
  useEffect(() => {
    if (selectedParentId) {
      const subs = childrenByParent.get(parseInt(selectedParentId)) || [];
      if (subs.length === 0) {
        // No subcategories, use parent as category
        setSelectedCategoryId(selectedParentId);
      } else {
        // Has subcategories, check if current selection is valid
        const currentIsValidSub = subs.some((s) => s.id.toString() === selectedCategoryId);
        if (!currentIsValidSub) {
          setSelectedCategoryId("");
        }
      }
    }
  }, [selectedParentId]);

  const selectedParent = parentCategories.find((p) => p.id.toString() === selectedParentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{spending ? "Edit Spending" : "Add Spending"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {/* Hidden input for actual categoryId */}
          <input type="hidden" name="categoryId" value={selectedCategoryId} />

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || "#888" }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory selector - only show if parent has subcategories */}
          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {/* Option to use parent category directly */}
                  <SelectItem value={selectedParentId}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedParent?.color || "#888" }}
                      />
                      {selectedParent?.name} (General)
                    </div>
                  </SelectItem>
                  {subcategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || "#888" }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={spending?.amount}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={spending?.currency || "EUR"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={spending?.date || today}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              name="notes"
              type="text"
              defaultValue={spending?.notes || ""}
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {spending ? "Update" : "Add"} Spending
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
