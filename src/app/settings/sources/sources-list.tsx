"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createSource, updateSource, deleteSource, toggleSourceActive } from "./actions";
import type { EarningSource } from "@/lib/db";
import { slugify } from "@/lib/utils";

interface SourcesListProps {
  sources: EarningSource[];
}

export function SourcesList({ sources }: SourcesListProps) {
  const [editingSource, setEditingSource] = useState<EarningSource | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    const result = await createSource(formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setIsCreateOpen(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingSource) return;
    setError(null);
    const result = await updateSource(editingSource.id, formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setEditingSource(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this source?")) return;
    await deleteSource(id);
  }

  async function handleToggleActive(id: number, currentState: boolean | null) {
    await toggleSourceActive(id, !currentState);
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add Source
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Earning Source</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <SourceForm error={error} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sources List */}
      {sources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No earning sources yet. Add your first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <Card key={source.id} className={!source.isActive ? "opacity-50" : ""}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: source.color || "#gray" }}
                  />
                  <div>
                    <div className="font-medium">{source.name}</div>
                    <div className="text-sm text-muted-foreground">{source.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(source.id, source.isActive)}
                  >
                    {source.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Dialog open={editingSource?.id === source.id} onOpenChange={(open) => !open && setEditingSource(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingSource(source)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Earning Source</DialogTitle>
                      </DialogHeader>
                      <form action={handleUpdate} className="space-y-4">
                        <SourceForm source={source} error={error} />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Save</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceForm({ source, error }: { source?: EarningSource; error?: string | null }) {
  const [name, setName] = useState(source?.name || "");
  const [slug, setSlug] = useState(source?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!source);

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
          placeholder="e.g., Freelance Work"
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
          placeholder="e.g., freelance-work"
          required
        />
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={source?.color || "#3b82f6"}
            className="w-12 h-9 p-1"
          />
          <Input
            name="color"
            defaultValue={source?.color || "#3b82f6"}
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
          defaultValue={source?.icon || ""}
          placeholder="e.g., briefcase, dollar-sign, trending-up"
        />
      </div>
    </>
  );
}
