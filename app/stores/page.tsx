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
  address: string;
  contact: string;
  priceSlice: number;
  priceLoaf: number;
  notes: string;
  status: "active" | "potential";
};

type StoreDraft = {
  name: string;
  address: string;
  contact: string;
  priceSlice: number | "";
  priceLoaf: number | "";
  notes: string;
  status: "active" | "potential";
};

export default function StoresPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeForm, setStoreForm] = useState<StoreDraft>({
    name: "",
    address: "",
    contact: "",
    priceSlice: "",
    priceLoaf: "",
    notes: "",
    status: "active",
  });
  const [editingStoreIndex, setEditingStoreIndex] = useState<
    number | null
  >(null);
  const [storeEdit, setStoreEdit] = useState<StoreDraft | null>(
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
          address: store.address ?? "",
          contact: store.contact ?? "",
          priceSlice: Number(store.priceSlice ?? 0),
          priceLoaf: Number(store.priceLoaf ?? 0),
          notes: store.notes ?? "",
          status: store.status === "potential" ? "potential" : "active",
        }))
      );
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("suitebread-stores", JSON.stringify(stores));
  }, [stores, isHydrated]);

  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;

  const addStore = () => {
    if (!storeForm.name) return;
    const nextStore: Store = {
      name: storeForm.name,
      address: storeForm.address,
      contact: storeForm.contact,
      priceSlice: Number(storeForm.priceSlice || 0),
      priceLoaf: Number(storeForm.priceLoaf || 0),
      notes: storeForm.notes,
      status: storeForm.status,
    };
    setStores([...stores, nextStore]);
    setStoreForm({
      name: "",
      address: "",
      contact: "",
      priceSlice: "",
      priceLoaf: "",
      notes: "",
      status: "active",
    });
  };

  const startEditStore = (index: number) => {
    const store = stores[index];
    setEditingStoreIndex(index);
    setStoreEdit({
      name: store.name,
      address: store.address,
      contact: store.contact,
      priceSlice: store.priceSlice,
      priceLoaf: store.priceLoaf,
      notes: store.notes,
      status: store.status,
    });
  };

  const cancelEditStore = () => {
    setEditingStoreIndex(null);
    setStoreEdit(null);
  };

  const saveEditStore = () => {
    if (editingStoreIndex === null || !storeEdit?.name) return;
    const nextStore: Store = {
      name: storeEdit.name,
      address: storeEdit.address,
      contact: storeEdit.contact,
      priceSlice: Number(storeEdit.priceSlice || 0),
      priceLoaf: Number(storeEdit.priceLoaf || 0),
      notes: storeEdit.notes,
      status: storeEdit.status,
    };
    setStores(
      stores.map((store, i) =>
        i === editingStoreIndex ? nextStore : store
      )
    );
    cancelEditStore();
  };

  const isEditingStore =
    editingStoreIndex !== null && storeEdit !== null;

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
              <p className="eyebrow">Stores</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Store Management
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Maintain location details and pricing.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">{stores.length} locations</div>
            </div>
          </header>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Add Store</h2>
                <p className="text-muted text-sm">
                  Save pricing and contacts for each location.
                </p>
              </div>
              <span className="badge">Entry</span>
            </div>

            <div className="form-grid">
              <input
                placeholder="Store name"
                value={storeForm.name}
                onChange={e =>
                  setStoreForm({ ...storeForm, name: e.target.value })
                }
                className="input-field w-full"
              />

              <input
                placeholder="Address or city"
                value={storeForm.address}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    address: e.target.value,
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Slice price"
                value={storeForm.priceSlice}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    priceSlice:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Loaf price"
                value={storeForm.priceLoaf}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    priceLoaf:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                placeholder="Contact (optional)"
                value={storeForm.contact}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    contact: e.target.value,
                  })
                }
                className="input-field w-full sm:col-span-2"
              />

              <select
                value={storeForm.status}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    status: e.target.value as StoreDraft["status"],
                  })
                }
                className="input-field w-full"
              >
                <option value="active">Active</option>
                <option value="potential">Potential</option>
              </select>

              <textarea
                placeholder="Notes (optional)"
                value={storeForm.notes}
                onChange={e =>
                  setStoreForm({
                    ...storeForm,
                    notes: e.target.value,
                  })
                }
                className="input-field w-full sm:col-span-2"
                rows={3}
              />

              <button
                type="button"
                onClick={addStore}
                className="button-primary sm:col-span-2"
              >
                Add Store
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Store List</h2>
                <p className="text-muted text-sm">
                  Review pricing and contact info.
                </p>
              </div>
              <span className="badge">{stores.length} total</span>
            </div>

            {stores.length === 0 ? (
              <div className="empty-state">
                No stores added yet. Add your first location to get started.
              </div>
            ) : (
              <div className="table-shell">
                <table className="w-full text-sm">
                  <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                    <tr>
                      <th className="px-4 py-3">Store</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">Slice</th>
                      <th className="px-4 py-3">Loaf</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store, i) => (
                      <tr key={`${store.name}-${i}`} className="table-row">
                        <td className="px-4 py-3">
                          <div className="row-edit-cell">
                            <button
                              type="button"
                              className="row-edit-link"
                              onClick={() => startEditStore(i)}
                            >
                              {store.name}
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Edit ${store.name}`}
                              onClick={() => startEditStore(i)}
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
                        <td className="px-4 py-3">{store.address}</td>
                        <td className="px-4 py-3">
                          ${store.priceSlice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          ${store.priceLoaf.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`status-pill ${
                              store.status === "active"
                                ? "status-pill-on"
                                : ""
                            }`}
                          >
                            {store.status === "active"
                              ? "Active"
                              : "Potential"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{store.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {isEditingStore && storeEdit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-store-title"
          onClick={cancelEditStore}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Store</p>
                <h3
                  id="edit-store-title"
                  className="font-display text-2xl"
                >
                  {storeEdit.name || "Store details"}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={cancelEditStore}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              <input
                placeholder="Store name"
                value={storeEdit.name}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <input
                placeholder="Address or city"
                value={storeEdit.address}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev ? { ...prev, address: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <input
                type="number"
                placeholder="Slice price"
                value={storeEdit.priceSlice}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          priceSlice:
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
                placeholder="Loaf price"
                value={storeEdit.priceLoaf}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          priceLoaf:
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
                placeholder="Contact (optional)"
                value={storeEdit.contact}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev ? { ...prev, contact: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <select
                value={storeEdit.status}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          status: e.target.value as StoreDraft["status"],
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              >
                <option value="active">Active</option>
                <option value="potential">Potential</option>
              </select>

              <textarea
                placeholder="Notes (optional)"
                value={storeEdit.notes}
                onChange={e =>
                  setStoreEdit(prev =>
                    prev ? { ...prev, notes: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEditStore}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={saveEditStore}
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
