import { db, earningSources, accounts, spendingCategories } from "./index";

// Initial earning sources from Excel
const initialSources = [
  { name: "Job", slug: "job", color: "#3b82f6", icon: "briefcase", displayOrder: 0 },
  { name: "TubeChef", slug: "tc", color: "#f97316", icon: "youtube", displayOrder: 1 },
  { name: "Elevate", slug: "elevate", color: "#8b5cf6", icon: "trending-up", displayOrder: 2 },
  { name: "Elevate Affiliates YT", slug: "elevate-affiliates-yt", color: "#ec4899", icon: "users", displayOrder: 3 },
];

// Initial spending categories (parent categories + subcategories)
// Parent categories have parentId: null, subcategories reference parent slug
const initialSpendingCategories = [
  // Housing
  { name: "Housing", slug: "housing", parentId: null, color: "#3b82f6", icon: "home", displayOrder: 0 },
  { name: "Rent", slug: "rent", parentSlug: "housing", color: "#60a5fa", icon: "key", displayOrder: 1 },
  { name: "Utilities", slug: "utilities", parentSlug: "housing", color: "#93c5fd", icon: "zap", displayOrder: 2 },
  { name: "Insurance", slug: "insurance-housing", parentSlug: "housing", color: "#bfdbfe", icon: "shield", displayOrder: 3 },

  // Food
  { name: "Food", slug: "food", parentId: null, color: "#f97316", icon: "utensils", displayOrder: 10 },
  { name: "Groceries", slug: "groceries", parentSlug: "food", color: "#fb923c", icon: "shopping-cart", displayOrder: 11 },
  { name: "Restaurants", slug: "restaurants", parentSlug: "food", color: "#fdba74", icon: "utensils-crossed", displayOrder: 12 },
  { name: "Delivery", slug: "delivery", parentSlug: "food", color: "#fed7aa", icon: "package", displayOrder: 13 },

  // Transport
  { name: "Transport", slug: "transport", parentId: null, color: "#8b5cf6", icon: "car", displayOrder: 20 },
  { name: "Gas", slug: "gas", parentSlug: "transport", color: "#a78bfa", icon: "fuel", displayOrder: 21 },
  { name: "Public Transit", slug: "public-transit", parentSlug: "transport", color: "#c4b5fd", icon: "train", displayOrder: 22 },
  { name: "Parking", slug: "parking", parentSlug: "transport", color: "#ddd6fe", icon: "parking-circle", displayOrder: 23 },

  // Entertainment
  { name: "Entertainment", slug: "entertainment", parentId: null, color: "#ec4899", icon: "gamepad-2", displayOrder: 30 },
  { name: "Subscriptions", slug: "subscriptions", parentSlug: "entertainment", color: "#f472b6", icon: "tv", displayOrder: 31 },
  { name: "Games", slug: "games", parentSlug: "entertainment", color: "#f9a8d4", icon: "gamepad", displayOrder: 32 },

  // Health
  { name: "Health", slug: "health", parentId: null, color: "#10b981", icon: "heart-pulse", displayOrder: 40 },
  { name: "Medical", slug: "medical", parentSlug: "health", color: "#34d399", icon: "stethoscope", displayOrder: 41 },
  { name: "Pharmacy", slug: "pharmacy", parentSlug: "health", color: "#6ee7b7", icon: "pill", displayOrder: 42 },

  // Shopping
  { name: "Shopping", slug: "shopping", parentId: null, color: "#06b6d4", icon: "shopping-bag", displayOrder: 50 },
  { name: "Clothing", slug: "clothing", parentSlug: "shopping", color: "#22d3ee", icon: "shirt", displayOrder: 51 },
  { name: "Electronics", slug: "electronics", parentSlug: "shopping", color: "#67e8f9", icon: "laptop", displayOrder: 52 },

  // Other
  { name: "Other", slug: "other", parentId: null, color: "#6b7280", icon: "more-horizontal", displayOrder: 100 },
];

// Initial accounts from Excel
const initialAccounts = [
  { name: "OpenBank", slug: "openbank", type: "bank", currency: "EUR", color: "#10b981", icon: "landmark", displayOrder: 0 },
  { name: "Cajamar", slug: "cajamar", type: "bank", currency: "EUR", color: "#06b6d4", icon: "landmark", displayOrder: 1 },
  { name: "Mercury", slug: "mercury", type: "bank", currency: "USD", color: "#6366f1", icon: "landmark", displayOrder: 2 },
  { name: "Cash", slug: "cash", type: "cash", currency: "EUR", color: "#84cc16", icon: "wallet", displayOrder: 3 },
];

async function seed() {
  console.log("Seeding database...");

  // Insert earning sources
  for (const source of initialSources) {
    try {
      await db.insert(earningSources).values(source).onConflictDoNothing();
      console.log(`  Added earning source: ${source.name}`);
    } catch (error) {
      console.log(`  Skipping ${source.name} (already exists)`);
    }
  }

  // Insert accounts
  for (const account of initialAccounts) {
    try {
      await db.insert(accounts).values(account).onConflictDoNothing();
      console.log(`  Added account: ${account.name}`);
    } catch (error) {
      console.log(`  Skipping ${account.name} (already exists)`);
    }
  }

  // Insert spending categories
  // First pass: insert parent categories (those without parentSlug)
  const slugToId: Record<string, number> = {};

  for (const cat of initialSpendingCategories) {
    if (!("parentSlug" in cat)) {
      try {
        const result = await db.insert(spendingCategories).values({
          name: cat.name,
          slug: cat.slug,
          parentId: null,
          color: cat.color,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
        }).onConflictDoNothing().returning({ id: spendingCategories.id });

        if (result.length > 0) {
          slugToId[cat.slug] = result[0].id;
          console.log(`  Added spending category: ${cat.name}`);
        } else {
          // Already exists, fetch the ID
          const existing = await db.query.spendingCategories.findFirst({
            where: (table, { eq }) => eq(table.slug, cat.slug),
          });
          if (existing) {
            slugToId[cat.slug] = existing.id;
          }
        }
      } catch (error) {
        console.log(`  Skipping ${cat.name} (already exists)`);
      }
    }
  }

  // Second pass: insert subcategories (those with parentSlug)
  for (const cat of initialSpendingCategories) {
    if ("parentSlug" in cat && cat.parentSlug) {
      const parentId = slugToId[cat.parentSlug];
      if (parentId) {
        try {
          await db.insert(spendingCategories).values({
            name: cat.name,
            slug: cat.slug,
            parentId: parentId,
            color: cat.color,
            icon: cat.icon,
            displayOrder: cat.displayOrder,
          }).onConflictDoNothing();
          console.log(`  Added spending subcategory: ${cat.name} (under ${cat.parentSlug})`);
        } catch (error) {
          console.log(`  Skipping ${cat.name} (already exists)`);
        }
      }
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
