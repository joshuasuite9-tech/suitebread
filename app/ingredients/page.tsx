"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";

type Sale = {
  qty: number;
  price: number;
  delivered: boolean;
  paid: boolean;
};

type Store = {
  name: string;
};

type Ingredient = {
  name: string;
  unit: string;
  onHand: number;
  reorderAt: number;
  perLoaf: number;
  purchaseQty: number;
  purchaseCost: number;
  supplier: string;
};

const NOTE_INGREDIENTS: Ingredient[] = [
  {
    name: "Mixed Peel",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 14.175,
    purchaseQty: 200,
    purchaseCost: 29.99,
    supplier: "",
  },
  {
    name: "Flour",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 480,
    purchaseQty: 10000,
    purchaseCost: 59.95,
    supplier: "",
  },
  {
    name: "Milk",
    unit: "box",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 1,
    purchaseQty: 1,
    purchaseCost: 6.66,
    supplier: "",
  },
  {
    name: "Baking Powder",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 16,
    purchaseQty: 454,
    purchaseCost: 12.5,
    supplier: "",
  },
  {
    name: "Baking Soda",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 2.5,
    purchaseQty: 2260,
    purchaseCost: 58.95,
    supplier: "",
  },
  {
    name: "Salt",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 5.9,
    purchaseQty: 2000,
    purchaseCost: 8.95,
    supplier: "",
  },
  {
    name: "Cinnamon",
    unit: "g",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 2.5,
    purchaseQty: 453.6,
    purchaseCost: 43,
    supplier: "",
  },
  {
    name: "Nutmeg",
    unit: "tsp",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 1,
    purchaseQty: 0,
    purchaseCost: 0,
    supplier: "",
  },
  {
    name: "Essence",
    unit: "tsp",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 1,
    purchaseQty: 0,
    purchaseCost: 0,
    supplier: "",
  },
  {
    name: "Bitters",
    unit: "dash",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 1,
    purchaseQty: 0,
    purchaseCost: 0,
    supplier: "",
  },
  {
    name: "Ginger",
    unit: "tbsp",
    onHand: 0,
    reorderAt: 0,
    perLoaf: 1,
    purchaseQty: 0,
    purchaseCost: 0,
    supplier: "",
  },
];

type IngredientDraft = {
  name: string;
  unit: string;
  onHand: number | "";
  reorderAt: number | "";
  perLoaf: number | "";
  purchaseQty: number | "";
  purchaseCost: number | "";
  supplier: string;
};

type InventorySettings = {
  slicesPerLoaf: number;
};

export default function IngredientsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientForm, setIngredientForm] = useState<IngredientDraft>({
    name: "",
    unit: "lb",
    onHand: "",
    reorderAt: "",
    perLoaf: "",
    purchaseQty: "",
    purchaseCost: "",
    supplier: "",
  });
  const [editingIngredientIndex, setEditingIngredientIndex] =
    useState<number | null>(null);
  const [ingredientEdit, setIngredientEdit] =
    useState<IngredientDraft | null>(null);
  const [settings, setSettings] = useState<InventorySettings>({
    slicesPerLoaf: 10,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedSales = localStorage.getItem("suitebread-sales");
    if (savedSales) {
      const parsed = JSON.parse(savedSales) as Sale[];
      setSales(
        parsed.map(sale => ({
          qty: Number(sale.qty ?? 0),
          price: Number(sale.price ?? 0),
          delivered: Boolean(sale.delivered),
          paid: Boolean(sale.paid),
        }))
      );
    }

    const savedStores = localStorage.getItem("suitebread-stores");
    if (savedStores) {
      const parsed = JSON.parse(savedStores) as Store[];
      setStores(
        parsed.map(store => ({
          name: store.name ?? "",
        }))
      );
    }

    const savedIngredients = localStorage.getItem(
      "suitebread-ingredients"
    );
    let nextIngredients: Ingredient[] = [];
    if (savedIngredients) {
      const parsed = JSON.parse(savedIngredients) as Ingredient[];
      nextIngredients = parsed.map(item => {
        const legacyCost = Number((item as any).cost ?? 0);
        const purchaseQty = Number(item.purchaseQty ?? 0);
        const purchaseCost = Number(item.purchaseCost ?? 0);
        return {
          name: item.name ?? "",
          unit: item.unit ?? "lb",
          onHand: Number(item.onHand ?? 0),
          reorderAt: Number(item.reorderAt ?? 0),
          perLoaf: Number(item.perLoaf ?? 0),
          purchaseQty:
            purchaseQty === 0 && legacyCost > 0 ? 1 : purchaseQty,
          purchaseCost:
            purchaseCost === 0 && legacyCost > 0
              ? legacyCost
              : purchaseCost,
          supplier: item.supplier ?? "",
        };
      });
    }

    const seededKey = "suitebread-notes-seeded";
    const hasSeeded =
      localStorage.getItem(seededKey) === "true";
    if (!hasSeeded) {
      const existingNames = new Set(
        nextIngredients.map(item =>
          item.name.trim().toLowerCase()
        )
      );
      const toAdd = NOTE_INGREDIENTS.filter(
        item =>
          !existingNames.has(item.name.trim().toLowerCase())
      );
      if (toAdd.length > 0) {
        nextIngredients = [...nextIngredients, ...toAdd];
      }
      localStorage.setItem(seededKey, "true");
    }

    setIngredients(nextIngredients);

    const savedSettings = localStorage.getItem(
      "suitebread-settings"
    );
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as InventorySettings;
      setSettings({
        slicesPerLoaf:
          typeof parsed.slicesPerLoaf === "number" &&
          parsed.slicesPerLoaf > 0
            ? parsed.slicesPerLoaf
            : 10,
      });
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "suitebread-ingredients",
      JSON.stringify(ingredients)
    );
  }, [ingredients, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "suitebread-settings",
      JSON.stringify(settings)
    );
  }, [settings, isHydrated]);

  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;

  const addIngredient = () => {
    if (!ingredientForm.name) return;
    const nextIngredient: Ingredient = {
      name: ingredientForm.name,
      unit: ingredientForm.unit,
      onHand: Number(ingredientForm.onHand || 0),
      reorderAt: Number(ingredientForm.reorderAt || 0),
      perLoaf: Number(ingredientForm.perLoaf || 0),
      purchaseQty: Number(ingredientForm.purchaseQty || 0),
      purchaseCost: Number(ingredientForm.purchaseCost || 0),
      supplier: ingredientForm.supplier,
    };
    setIngredients([...ingredients, nextIngredient]);
    setIngredientForm({
      name: "",
      unit: "lb",
      onHand: "",
      reorderAt: "",
      perLoaf: "",
      purchaseQty: "",
      purchaseCost: "",
      supplier: "",
    });
  };

  const startEditIngredient = (index: number) => {
    const ingredient = ingredients[index];
    setEditingIngredientIndex(index);
    setIngredientEdit({
      name: ingredient.name,
      unit: ingredient.unit,
      onHand: ingredient.onHand,
      reorderAt: ingredient.reorderAt,
      perLoaf: ingredient.perLoaf,
      purchaseQty: ingredient.purchaseQty,
      purchaseCost: ingredient.purchaseCost,
      supplier: ingredient.supplier,
    });
  };

  const cancelEditIngredient = () => {
    setEditingIngredientIndex(null);
    setIngredientEdit(null);
  };

  const saveEditIngredient = () => {
    if (editingIngredientIndex === null || !ingredientEdit?.name) {
      return;
    }
    const nextIngredient: Ingredient = {
      name: ingredientEdit.name,
      unit: ingredientEdit.unit,
      onHand: Number(ingredientEdit.onHand || 0),
      reorderAt: Number(ingredientEdit.reorderAt || 0),
      perLoaf: Number(ingredientEdit.perLoaf || 0),
      purchaseQty: Number(ingredientEdit.purchaseQty || 0),
      purchaseCost: Number(ingredientEdit.purchaseCost || 0),
      supplier: ingredientEdit.supplier,
    };
    setIngredients(
      ingredients.map((ingredient, i) =>
        i === editingIngredientIndex ? nextIngredient : ingredient
      )
    );
    cancelEditIngredient();
  };

  const deleteIngredient = () => {
    if (editingIngredientIndex === null) return;
    const targetName =
      ingredientEdit?.name || ingredients[editingIngredientIndex]?.name;
    if (
      !window.confirm(
        `Delete ${targetName || "this ingredient"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setIngredients(
      ingredients.filter((_, i) => i !== editingIngredientIndex)
    );
    cancelEditIngredient();
  };

  const getUnitCost = (ingredient: Ingredient) =>
    ingredient.purchaseQty > 0
      ? ingredient.purchaseCost / ingredient.purchaseQty
      : 0;
  const lowStockCount = ingredients.filter(
    ingredient => ingredient.onHand <= ingredient.reorderAt
  ).length;
  const costPerLoaf = ingredients.reduce(
    (sum, ingredient) =>
      sum + ingredient.perLoaf * getUnitCost(ingredient),
    0
  );
  const costPerSlice =
    settings.slicesPerLoaf > 0
      ? costPerLoaf / settings.slicesPerLoaf
      : 0;
  const isEditingIngredient =
    editingIngredientIndex !== null && ingredientEdit !== null;
  return (
    <main className="app-root">
      <div className="app-glow app-glow-right" />
      <div className="app-glow app-glow-left" />

      <div className="app-shell">
        <AppSidebar>
          <div className="sidebar-footer">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Outstanding
              </p>
              <p className="font-display text-2xl">
                ${unpaidRevenue.toFixed(2)}
              </p>
              <p className="text-muted text-xs">
                {outstandingCount} deliveries unpaid
              </p>
            </div>
            <div className="sidebar-divider" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Active Stores
              </p>
              <p className="font-display text-2xl">{stores.length}</p>
              <p className="text-muted text-xs">
                Keep locations up to date
              </p>
            </div>
          </div>
        </AppSidebar>

        <div className="content grid gap-6">
          <header className="topbar card">
            <div>
              <p className="eyebrow">Inventory</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Ingredients Inventory
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Track on-hand ingredients and reorder points.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">{ingredients.length} items</div>
              <div className="chip">{lowStockCount} low stock</div>
              <div className="chip">
                Cost/Loaf ${costPerLoaf.toFixed(2)}
              </div>
              <div className="chip">
                Cost/Slice ${costPerSlice.toFixed(2)}
              </div>
            </div>
          </header>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Add Ingredient</h2>
                <p className="text-muted text-sm">
                  Capture current stock and reorder thresholds.
                </p>
              </div>
              <span className="badge">Entry</span>
            </div>

            <div className="form-grid">
              <input
                placeholder="Ingredient name"
                value={ingredientForm.name}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    name: e.target.value,
                  })
                }
                className="input-field w-full"
              />

              <select
                value={ingredientForm.unit}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    unit: e.target.value,
                  })
                }
                className="input-field w-full"
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
                <option value="oz">oz</option>
                <option value="g">g</option>
                <option value="gal">gal</option>
                <option value="L">L</option>
                <option value="units">units</option>
              </select>

              <input
                type="number"
                placeholder="On hand"
                value={ingredientForm.onHand}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    onHand:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Reorder at"
                value={ingredientForm.reorderAt}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    reorderAt:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Per loaf"
                value={ingredientForm.perLoaf}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    perLoaf:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Order qty"
                value={ingredientForm.purchaseQty}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    purchaseQty:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Order cost (total)"
                value={ingredientForm.purchaseCost}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    purchaseCost:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <p className="text-muted text-xs sm:col-span-2">
                Per loaf is the units used per loaf. If you use 1 per slice,
                enter {settings.slicesPerLoaf}.
              </p>

              <input
                placeholder="Supplier"
                value={ingredientForm.supplier}
                onChange={e =>
                  setIngredientForm({
                    ...ingredientForm,
                    supplier: e.target.value,
                  })
                }
                className="input-field w-full sm:col-span-2"
              />

              <p className="text-muted text-xs sm:col-span-2">
                Unit cost: $
                {Number(ingredientForm.purchaseQty || 0) > 0
                  ? (
                      Number(ingredientForm.purchaseCost || 0) /
                      Number(ingredientForm.purchaseQty || 0)
                    ).toFixed(4)
                  : "0.0000"}
              </p>

              <button
                type="button"
                onClick={addIngredient}
                className="button-primary sm:col-span-2"
              >
                Add Ingredient
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Inventory List</h2>
                <p className="text-muted text-sm">
                  Update counts as inventory moves.
                </p>
              </div>
              <span className="badge">{lowStockCount} low</span>
            </div>

            {ingredients.length === 0 ? (
              <div className="empty-state">
                No ingredients tracked yet. Add flour, yeast, salt, and butter
                to start monitoring stock levels.
              </div>
            ) : (
              <div className="table-shell">
                <table className="w-full text-sm">
                  <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                    <tr>
                      <th className="px-4 py-3">Ingredient</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">On Hand</th>
                      <th className="px-4 py-3">Reorder At</th>
                      <th className="px-4 py-3">Per Loaf</th>
                      <th className="px-4 py-3">Order Qty</th>
                      <th className="px-4 py-3">Order Cost</th>
                      <th className="px-4 py-3">Cost / Slice</th>
                      <th className="px-4 py-3">Supplier</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ingredient, i) => {
                      const isLow =
                        ingredient.onHand <= ingredient.reorderAt;
                      const unitCost = getUnitCost(ingredient);
                      const perSliceContribution =
                        settings.slicesPerLoaf > 0
                          ? (ingredient.perLoaf * unitCost) /
                            settings.slicesPerLoaf
                          : 0;
                      return (
                        <tr key={`${ingredient.name}-${i}`} className="table-row">
                          <td className="px-4 py-3">
                            <div className="row-edit-cell">
                              <span>{ingredient.name}</span>
                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Edit ${ingredient.name}`}
                                onClick={() => startEditIngredient(i)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 17.25V21h3.75L19.81 7.94l-3.75-3.75L3 17.25z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M14.06 4.19l3.75 3.75"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">{ingredient.unit}</td>
                          <td className="px-4 py-3">{ingredient.onHand}</td>
                          <td className="px-4 py-3">{ingredient.reorderAt}</td>
                          <td className="px-4 py-3">{ingredient.perLoaf}</td>
                          <td className="px-4 py-3">{ingredient.purchaseQty}</td>
                          <td className="px-4 py-3">
                            ${ingredient.purchaseCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            ${perSliceContribution.toFixed(4)}
                          </td>
                          <td className="px-4 py-3">{ingredient.supplier}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`status-pill ${
                                isLow ? "status-pill-on" : ""
                              }`}
                            >
                              {isLow ? "Reorder" : "Ok"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {ingredients.length > 0 && (
              <p className="text-muted mt-3 text-sm">
                {lowStockCount} items at or below reorder point.
              </p>
            )}
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Bakery Settings</h2>
                <p className="text-muted text-sm">
                  Controls used for costing calculations.
                </p>
              </div>
              <span className="badge">Background</span>
            </div>

            <div className="form-grid">
              <input
                type="number"
                min={1}
                placeholder="Slices per loaf"
                value={settings.slicesPerLoaf}
                onChange={e =>
                  setSettings({
                    slicesPerLoaf: Math.max(
                      1,
                      Number(e.target.value)
                    ),
                  })
                }
                className="input-field w-full"
              />
            </div>
            <p className="text-muted mt-2 text-sm">
              Used to calculate cost per slice. Default is 10.
            </p>
          </section>
        </div>
      </div>

      {isEditingIngredient && ingredientEdit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-ingredient-title"
          onClick={cancelEditIngredient}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Ingredient</p>
                <h3
                  id="edit-ingredient-title"
                  className="font-display text-2xl"
                >
                  {ingredientEdit.name || "Ingredient details"}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={cancelEditIngredient}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              <input
                placeholder="Ingredient name"
                value={ingredientEdit.name}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <select
                value={ingredientEdit.unit}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev ? { ...prev, unit: e.target.value } : prev
                  )
                }
                className="input-field w-full"
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
                <option value="oz">oz</option>
                <option value="g">g</option>
                <option value="gal">gal</option>
                <option value="L">L</option>
                <option value="units">units</option>
              </select>

              <input
                type="number"
                placeholder="On hand"
                value={ingredientEdit.onHand}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          onHand:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Reorder at"
                value={ingredientEdit.reorderAt}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          reorderAt:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Per loaf"
                value={ingredientEdit.perLoaf}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          perLoaf:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Order qty"
                value={ingredientEdit.purchaseQty}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          purchaseQty:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Order cost (total)"
                value={ingredientEdit.purchaseCost}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          purchaseCost:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                placeholder="Supplier"
                value={ingredientEdit.supplier}
                onChange={e =>
                  setIngredientEdit(prev =>
                    prev
                      ? { ...prev, supplier: e.target.value }
                      : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <p className="text-muted text-xs span-2">
                Unit cost: $
                {Number(ingredientEdit.purchaseQty || 0) > 0
                  ? (
                      Number(ingredientEdit.purchaseCost || 0) /
                      Number(ingredientEdit.purchaseQty || 0)
                    ).toFixed(4)
                  : "0.0000"}
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={deleteIngredient}
              >
                Delete
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEditIngredient}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={saveEditIngredient}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
