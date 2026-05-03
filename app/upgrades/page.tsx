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

type Upgrade = {
  id: string;
  name: string;
  cost: number;
  notes: string;
};

type UpgradeDraft = {
  name: string;
  cost: number | "";
  notes: string;
};

export default function UpgradesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [upgradeForm, setUpgradeForm] = useState<UpgradeDraft>({
    name: "",
    cost: "",
    notes: "",
  });
  const [editingUpgradeIndex, setEditingUpgradeIndex] = useState<
    number | null
  >(null);
  const [upgradeEdit, setUpgradeEdit] = useState<UpgradeDraft | null>(
    null
  );
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

    const savedUpgrades = localStorage.getItem("suitebread-upgrades");
    if (savedUpgrades) {
      const parsed = JSON.parse(savedUpgrades) as Upgrade[];
      setUpgrades(
        parsed.map(upgrade => ({
          id: upgrade.id ?? `${Date.now()}`,
          name: upgrade.name ?? "",
          cost: Number(upgrade.cost ?? 0),
          notes: upgrade.notes ?? "",
        }))
      );
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("suitebread-upgrades", JSON.stringify(upgrades));
  }, [upgrades, isHydrated]);

  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;

  const addUpgrade = () => {
    if (!upgradeForm.name) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const next: Upgrade = {
      id,
      name: upgradeForm.name,
      cost: Number(upgradeForm.cost || 0),
      notes: upgradeForm.notes,
    };
    setUpgrades([next, ...upgrades]);
    setUpgradeForm({ name: "", cost: "", notes: "" });
  };

  const startEditUpgrade = (index: number) => {
    const upgrade = upgrades[index];
    setEditingUpgradeIndex(index);
    setUpgradeEdit({
      name: upgrade.name,
      cost: upgrade.cost,
      notes: upgrade.notes,
    });
  };

  const cancelEditUpgrade = () => {
    setEditingUpgradeIndex(null);
    setUpgradeEdit(null);
  };

  const saveEditUpgrade = () => {
    if (editingUpgradeIndex === null || !upgradeEdit?.name) return;
    const next: Upgrade = {
      id: upgrades[editingUpgradeIndex].id,
      name: upgradeEdit.name,
      cost: Number(upgradeEdit.cost || 0),
      notes: upgradeEdit.notes,
    };
    setUpgrades(
      upgrades.map((upgrade, i) =>
        i === editingUpgradeIndex ? next : upgrade
      )
    );
    cancelEditUpgrade();
  };

  const totalCost = upgrades.reduce(
    (sum, upgrade) => sum + upgrade.cost,
    0
  );
  const isEditingUpgrade =
    editingUpgradeIndex !== null && upgradeEdit !== null;

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
              <p className="eyebrow">Upgrades</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Upgrade Wishlist
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Track equipment or products you want to buy.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">{upgrades.length} items</div>
              <div className="chip">Total ${totalCost.toFixed(2)}</div>
            </div>
          </header>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Add Upgrade</h2>
                <p className="text-muted text-sm">
                  Capture items you plan to purchase.
                </p>
              </div>
              <span className="badge">Entry</span>
            </div>

            <div className="form-grid">
              <input
                placeholder="Product name"
                value={upgradeForm.name}
                onChange={e =>
                  setUpgradeForm({ ...upgradeForm, name: e.target.value })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Estimated cost"
                value={upgradeForm.cost}
                onChange={e =>
                  setUpgradeForm({
                    ...upgradeForm,
                    cost:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                placeholder="Notes (optional)"
                value={upgradeForm.notes}
                onChange={e =>
                  setUpgradeForm({ ...upgradeForm, notes: e.target.value })
                }
                className="input-field w-full sm:col-span-2"
              />

              <button
                type="button"
                onClick={addUpgrade}
                className="button-primary sm:col-span-2"
              >
                Add Upgrade
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Upgrade List</h2>
                <p className="text-muted text-sm">
                  Review upcoming purchases.
                </p>
              </div>
              <span className="badge">{upgrades.length} total</span>
            </div>

            {upgrades.length === 0 ? (
              <div className="empty-state">
                No upgrades added yet.
              </div>
            ) : (
              <div className="table-shell">
                <table className="w-full text-sm">
                  <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upgrades.map((upgrade, i) => (
                      <tr key={upgrade.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="row-edit-cell">
                            <span>{upgrade.name}</span>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Edit ${upgrade.name}`}
                              onClick={() => startEditUpgrade(i)}
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
                        <td className="px-4 py-3">
                          ${upgrade.cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{upgrade.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {isEditingUpgrade && upgradeEdit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-upgrade-title"
          onClick={cancelEditUpgrade}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Upgrade</p>
                <h3
                  id="edit-upgrade-title"
                  className="font-display text-2xl"
                >
                  {upgradeEdit.name || "Upgrade details"}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={cancelEditUpgrade}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              <input
                placeholder="Product name"
                value={upgradeEdit.name}
                onChange={e =>
                  setUpgradeEdit(prev =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <input
                type="number"
                placeholder="Estimated cost"
                value={upgradeEdit.cost}
                onChange={e =>
                  setUpgradeEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          cost:
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
                placeholder="Notes (optional)"
                value={upgradeEdit.notes}
                onChange={e =>
                  setUpgradeEdit(prev =>
                    prev ? { ...prev, notes: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEditUpgrade}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={saveEditUpgrade}
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
