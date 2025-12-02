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
import { createAccount, updateAccount, deleteAccount, toggleAccountActive } from "./actions";
import type { Account } from "@/lib/db";
import { slugify } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank Account" },
  { value: "investment", label: "Investment" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "cash", label: "Cash" },
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY", "BTC", "ETH"];

interface AccountsListProps {
  accounts: Account[];
}

export function AccountsList({ accounts }: AccountsListProps) {
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    const result = await createAccount(formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setIsCreateOpen(false);
    }
  }

  async function handleUpdate(formData: FormData) {
    if (!editingAccount) return;
    setError(null);
    const result = await updateAccount(editingAccount.id, formData);
    if (result.error) {
      const errors = result.error as Record<string, string[]>;
      setError(Object.values(errors).flat().join(", "));
    } else {
      setEditingAccount(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this account?")) return;
    await deleteAccount(id);
  }

  async function handleToggleActive(id: number, currentState: boolean | null) {
    await toggleAccountActive(id, !currentState);
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <AccountForm error={error} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No accounts yet. Add your first one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <Card key={account.id} className={!account.isActive ? "opacity-50" : ""}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: account.color || "#gray" }}
                  />
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.type} · {account.currency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(account.id, account.isActive)}
                  >
                    {account.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Dialog open={editingAccount?.id === account.id} onOpenChange={(open) => !open && setEditingAccount(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingAccount(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                      </DialogHeader>
                      <form action={handleUpdate} className="space-y-4">
                        <AccountForm account={account} error={error} />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Save</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
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

function AccountForm({ account, error }: { account?: Account; error?: string | null }) {
  const [name, setName] = useState(account?.name || "");
  const [slug, setSlug] = useState(account?.slug || "");
  const [autoSlug, setAutoSlug] = useState(!account);

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
          placeholder="e.g., Savings Account"
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
          placeholder="e.g., savings-account"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue={account?.type || "bank"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={account?.currency || "EUR"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={account?.color || "#10b981"}
            className="w-12 h-9 p-1"
          />
          <Input
            name="color"
            defaultValue={account?.color || "#10b981"}
            placeholder="#10b981"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon">Icon (Lucide icon name)</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={account?.icon || ""}
          placeholder="e.g., landmark, wallet, bitcoin"
        />
      </div>
    </>
  );
}
