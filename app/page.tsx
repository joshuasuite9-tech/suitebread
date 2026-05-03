"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AppSidebar } from "./components/AppSidebar";

type SaleParty = "store" | "individual";

type Sale = {
  date: string;
  location: string;
  customerType: SaleParty;
  unit: "slice" | "loaf";
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

type MarketingTracker = {
  sampleSlices: number;
  sampleLoaves: number;
  wastageSlices: number;
  wastageLoaves: number;
};

type SalesMonthGroup = {
  monthKey: string;
  label: string;
  revenue: number;
  units: number;
  entries: Array<{
    sale: Sale;
    index: number;
  }>;
};

type SaleEditMode = "edit" | "duplicate";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState<Sale>({
    date: new Date().toISOString().slice(0, 10),
    location: "",
    customerType: "store",
    unit: "slice",
    qty: 1,
    price: 0,
    delivered: false,
    paid: false,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [dataMessage, setDataMessage] = useState<string | null>(
    null
  );
  const [editingSaleIndex, setEditingSaleIndex] = useState<
    number | null
  >(null);
  const [saleEdit, setSaleEdit] = useState<Sale | null>(null);
  const [saleEditMode, setSaleEditMode] = useState<SaleEditMode>(
    "edit"
  );
  const [draggingSaleIndex, setDraggingSaleIndex] = useState<
    number | null
  >(null);
  const [draggingSaleMonthKey, setDraggingSaleMonthKey] = useState<
    string | null
  >(null);
  const [dragOverSaleIndex, setDragOverSaleIndex] = useState<
    number | null
  >(null);
  const [expandedSalesMonths, setExpandedSalesMonths] = useState<
    Record<string, boolean>
  >({});

  const normalizeSale = (sale: Sale | Partial<Sale>): Sale => ({
    date: sale.date ?? new Date().toISOString().slice(0, 10),
    location: sale.location ?? "",
    customerType:
      sale.customerType === "individual" ? "individual" : "store",
    unit: sale.unit === "loaf" ? "loaf" : "slice",
    qty: Number(sale.qty ?? 0),
    price: Number(sale.price ?? 0),
    delivered: Boolean(sale.delivered),
    paid: Boolean(sale.paid),
  });

  const normalizeStore = (
    store: Store | Partial<Store>
  ): Store => ({
    name: store.name ?? "",
    address: store.address ?? "",
    contact: store.contact ?? "",
    priceSlice: Number(store.priceSlice ?? 0),
    priceLoaf: Number(store.priceLoaf ?? 0),
    notes: store.notes ?? "",
    status: store.status === "potential" ? "potential" : "active",
  });

  const normalizeMarketingTracker = (
    tracker: MarketingTracker | Partial<MarketingTracker>
  ): MarketingTracker => ({
    sampleSlices: Math.max(0, Number(tracker.sampleSlices ?? 0)),
    sampleLoaves: Math.max(0, Number(tracker.sampleLoaves ?? 0)),
    wastageSlices: Math.max(0, Number(tracker.wastageSlices ?? 0)),
    wastageLoaves: Math.max(0, Number(tracker.wastageLoaves ?? 0)),
  });

  const formatSaleDate = (value: string) => {
    const parts = value.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (
        year.length === 4 &&
        month.length === 2 &&
        day.length === 2
      ) {
        return `${day}-${month}-${year.slice(-2)}`;
      }
    }

    return value;
  };

  const getSaleMonthKey = (value: string) => {
    const parts = value.split("-");
    if (parts.length >= 2) {
      const [year, month] = parts;
      if (year.length === 4 && month.length === 2) {
        return `${year}-${month}`;
      }
    }

    return value;
  };

  const formatSaleMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    if (year?.length === 4 && month?.length === 2) {
      return new Date(
        Number(year),
        Number(month) - 1,
        1
      ).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    return monthKey;
  };

  const sortSalesChronologically = (nextSales: Sale[]) =>
    nextSales
      .map((sale, originalIndex) => ({
        sale,
        originalIndex,
      }))
      .sort((a, b) => {
        const dateCompare = a.sale.date.localeCompare(b.sale.date);
        return dateCompare || a.originalIndex - b.originalIndex;
      })
      .map(({ sale }) => sale);

  // load saved sales + stores
  useEffect(() => {
    const savedSales = localStorage.getItem("suitebread-sales");
    if (savedSales) {
      const parsed = JSON.parse(savedSales) as Sale[];
      setSales(sortSalesChronologically(parsed.map(normalizeSale)));
    }

    const savedStores = localStorage.getItem("suitebread-stores");
    if (savedStores) {
      const parsed = JSON.parse(savedStores) as Store[];
      setStores(parsed.map(normalizeStore));
    }

    setIsHydrated(true);
  }, []);

  // save on change
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("suitebread-sales", JSON.stringify(sales));
  }, [sales, isHydrated]);

  // save stores on change
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("suitebread-stores", JSON.stringify(stores));
  }, [stores, isHydrated]);

  const addSale = () => {
    if (!form.location || form.qty <= 0) return;
    setSales(sortSalesChronologically([...sales, { ...form }]));
    setForm({ ...form, location: "", qty: 1 });
  };

  const startEditSale = (index: number) => {
    setEditingSaleIndex(index);
    setSaleEdit({ ...sales[index] });
    setSaleEditMode("edit");
  };

  const cancelEditSale = () => {
    setEditingSaleIndex(null);
    setSaleEdit(null);
    setSaleEditMode("edit");
  };

  const saveEditSale = () => {
    if (!saleEdit?.location) return;

    if (saleEditMode === "duplicate") {
      setSales(
        sortSalesChronologically([...sales, { ...saleEdit }])
      );
      cancelEditSale();
      return;
    }

    if (editingSaleIndex === null) return;

    setSales(
      sortSalesChronologically(
        sales.map((sale, i) =>
          i === editingSaleIndex ? saleEdit : sale
        )
      )
    );
    cancelEditSale();
  };

  const startDuplicateSale = () => {
    if (!saleEdit) return;
    setEditingSaleIndex(null);
    setSaleEdit({ ...saleEdit });
    setSaleEditMode("duplicate");
  };

  const exportData = () => {
    const savedMarketing = localStorage.getItem(
      "suitebread-marketing-tracker"
    );
    const marketingTracker = savedMarketing
      ? normalizeMarketingTracker(
          JSON.parse(savedMarketing) as MarketingTracker
        )
      : normalizeMarketingTracker({});
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sales,
      stores,
      marketingTracker,
    };
    const fileName = `suitebread-data-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDataMessage("Export complete.");
  };

  const handleImport = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        sales?: Sale[];
        stores?: Store[];
        marketingTracker?: MarketingTracker;
      };
      const nextSales = Array.isArray(parsed.sales)
        ? sortSalesChronologically(parsed.sales.map(normalizeSale))
        : [];
      const nextStores = Array.isArray(parsed.stores)
        ? parsed.stores.map(normalizeStore)
        : [];
      const nextMarketingTracker = parsed.marketingTracker
        ? normalizeMarketingTracker(parsed.marketingTracker)
        : normalizeMarketingTracker({});
      setSales(nextSales);
      setStores(nextStores);
      localStorage.setItem(
        "suitebread-marketing-tracker",
        JSON.stringify(nextMarketingTracker)
      );
      setDataMessage("Import complete. Data replaced.");
    } catch {
      setDataMessage("Import failed. Invalid file format.");
    } finally {
      event.target.value = "";
    }
  };

  const updateSale = (index: number, patch: Partial<Sale>) => {
    setSales(
      sales.map((sale, i) =>
        i === index ? { ...sale, ...patch } : sale
      )
    );
  };

  const moveSale = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= sales.length ||
      toIndex >= sales.length
    ) {
      return;
    }

    setSales(prev => {
      const next = [...prev];
      const [movedSale] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, movedSale);
      return sortSalesChronologically(next);
    });

    setEditingSaleIndex(current => {
      if (current === null) return current;
      if (current === fromIndex) return toIndex;
      if (fromIndex < toIndex) {
        return current > fromIndex && current <= toIndex
          ? current - 1
          : current;
      }
      return current >= toIndex && current < fromIndex
        ? current + 1
        : current;
    });
  };

  const startSaleDrag = (
    event: DragEvent<HTMLTableRowElement>,
    index: number,
    monthKey: string
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    setDraggingSaleIndex(index);
    setDraggingSaleMonthKey(monthKey);
    setDragOverSaleIndex(index);
  };

  const allowSaleDrop = (
    event: DragEvent<HTMLTableRowElement>,
    index: number,
    monthKey: string
  ) => {
    if (draggingSaleMonthKey !== monthKey) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverSaleIndex !== index) {
      setDragOverSaleIndex(index);
    }
  };

  const dropSale = (
    event: DragEvent<HTMLTableRowElement>,
    index: number,
    monthKey: string
  ) => {
    if (draggingSaleMonthKey !== monthKey) {
      endSaleDrag();
      return;
    }

    event.preventDefault();
    const rawSourceIndex = event.dataTransfer.getData("text/plain");
    const sourceIndex =
      draggingSaleIndex ?? Number.parseInt(rawSourceIndex, 10);

    if (!Number.isNaN(sourceIndex)) {
      moveSale(sourceIndex, index);
    }

    endSaleDrag();
  };

  const endSaleDrag = () => {
    setDraggingSaleIndex(null);
    setDraggingSaleMonthKey(null);
    setDragOverSaleIndex(null);
  };

  const totalRevenue = sales.reduce(
    (sum, s) => sum + s.qty * s.price,
    0
  );
  const totalUnits = sales.reduce((sum, s) => sum + s.qty, 0);
  const averageSale = sales.length
    ? totalRevenue / sales.length
    : 0;
  const deliveredCount = sales.filter(s => s.delivered).length;
  const paidCount = sales.filter(s => s.paid).length;
  const pendingDelivery = sales.filter(s => !s.delivered).length;
  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const paidRevenue = sales
    .filter(s => s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;
  const deliveryRate = sales.length
    ? Math.round((deliveredCount / sales.length) * 100)
    : 0;
  const paidRate = sales.length
    ? Math.round((paidCount / sales.length) * 100)
    : 0;
  const salesMonthGroups = Array.from(
    sales.reduce<Map<string, SalesMonthGroup>>(
      (groups, sale, index) => {
      const monthKey = getSaleMonthKey(sale.date);
      const existingGroup = groups.get(monthKey);

      if (existingGroup) {
        existingGroup.entries.push({ sale, index });
        existingGroup.revenue += sale.qty * sale.price;
        existingGroup.units += sale.qty;
        return groups;
      }

      groups.set(monthKey, {
        monthKey,
        label: formatSaleMonthLabel(monthKey),
        revenue: sale.qty * sale.price,
        units: sale.qty,
        entries: [{ sale, index }],
      });
      return groups;
    },
      new Map()
    ).values()
  ).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const toggleSalesMonth = (monthKey: string) => {
    setExpandedSalesMonths(prev => ({
      ...prev,
      [monthKey]: !(prev[monthKey] ?? true),
    }));
  };
  const isEditingSale = saleEdit !== null;
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
          <header className="topbar card" id="dashboard">
            <div>
              <p className="eyebrow">Sales Tracker</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Dashboard Overview
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                See sales, deliveries, and payments in one clear view.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">Today · {todayLabel}</div>
              <div className="chip">{totalUnits} units logged</div>
            </div>
          </header>

          <section className="stat-grid">
            <div className="card stat-card">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="stat-meta">
                Paid ${paidRevenue.toFixed(2)} · Outstanding ${
                  unpaidRevenue.toFixed(2)
                }
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Average Sale</p>
              <p className="stat-value">
                ${averageSale.toFixed(2)}
              </p>
              <p className="stat-meta">
                {sales.length} entries · {totalUnits} units
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Delivered</p>
              <p className="stat-value">{deliveredCount}</p>
              <p className="stat-meta">
                {deliveryRate}% completion · {pendingDelivery} pending
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Payments Confirmed</p>
              <p className="stat-value">{paidCount}</p>
              <p className="stat-meta">
                {paidRate}% collected · {outstandingCount} awaiting
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]" id="sales-tracker">
            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Log a Sale</h2>
                  <p className="text-muted text-sm">
                    Capture each delivery with payment status.
                  </p>
                </div>
                <span className="badge">Entry</span>
              </div>

              <form
                className="form-grid"
                onSubmit={event => {
                  event.preventDefault();
                  addSale();
                }}
              >
                <input
                  type="date"
                  value={form.date}
                  onChange={e =>
                    setForm({ ...form, date: e.target.value })
                  }
                  className="input-field w-full"
                />

                <select
                  value={form.customerType}
                  onChange={e =>
                    setForm({
                      ...form,
                      customerType: e.target.value as SaleParty,
                    })
                  }
                  className="input-field w-full"
                  aria-label="Sale type"
                >
                  <option value="store">Store</option>
                  <option value="individual">Individual</option>
                </select>

                <input
                  placeholder={
                    form.customerType === "store"
                      ? "Store name"
                      : "Customer name"
                  }
                  value={form.location}
                  onChange={e =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="input-field w-full span-2"
                />

                <select
                  value={form.unit}
                  onChange={e =>
                    setForm({
                      ...form,
                      unit: e.target.value as Sale["unit"],
                    })
                  }
                  className="input-field w-full"
                >
                  <option value="slice">Slice</option>
                  <option value="loaf">Loaf</option>
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={form.qty}
                  onChange={e =>
                    setForm({ ...form, qty: Number(e.target.value) })
                  }
                  className="input-field w-full"
                />

                <input
                  type="number"
                  placeholder="Price per unit"
                  value={form.price}
                  onChange={e =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  className="input-field w-full sm:col-span-2"
                />

                <div className="status-toggle-row sm:col-span-2">
                  <button
                    type="button"
                    className={`toggle-pill ${
                      form.delivered ? "toggle-pill-on" : ""
                    }`}
                    onClick={() =>
                      setForm({
                        ...form,
                        delivered: !form.delivered,
                      })
                    }
                  >
                    <span className="toggle-dot" />
                    {form.delivered ? "Delivered" : "Mark Delivered"}
                  </button>
                  <button
                    type="button"
                    className={`toggle-pill ${
                      form.paid ? "toggle-pill-on" : ""
                    }`}
                    onClick={() =>
                      setForm({ ...form, paid: !form.paid })
                    }
                  >
                    <span className="toggle-dot" />
                    {form.paid
                      ? "Payment Confirmed"
                      : "Confirm Payment"}
                  </button>
                </div>

                <button
                  type="submit"
                  className="button-primary sm:col-span-2"
                >
                  Add Sale
                </button>
              </form>
            </section>

            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Payment Status</h2>
                  <p className="text-muted text-sm">
                    Spot gaps between delivery and payment.
                  </p>
                </div>
                <span className="badge">Live</span>
              </div>

              <div className="status-stack">
                <div className="status-item">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Delivered & unpaid
                    </p>
                    <p className="font-display text-2xl">
                      ${unpaidRevenue.toFixed(2)}
                    </p>
                    <p className="text-muted text-xs">
                      {outstandingCount} invoices waiting
                    </p>
                  </div>
                  <div className="status-pills">
                    <span className="pill">Follow up</span>
                  </div>
                </div>

                <div className="status-item">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Delivered rate
                    </p>
                    <p className="font-display text-xl">
                      {deliveryRate}%
                    </p>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                <div className="status-item">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Payment rate
                    </p>
                    <p className="font-display text-xl">{paidRate}%</p>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill alt"
                      style={{ width: `${paidRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Sales Log</h2>
                <p className="text-muted text-sm">
                  Sales are auto-sorted from earliest to latest. Tap a month bar to collapse or expand it.
                </p>
              </div>
              <span className="badge">{sales.length} entries</span>
            </div>

            {sales.length === 0 ? (
              <div className="empty-state">
                No sales logged yet. Add your first entry to start tracking.
              </div>
            ) : (
              <div className="sales-month-list">
                {salesMonthGroups.map(group => {
                  const isExpanded =
                    expandedSalesMonths[group.monthKey] ?? true;

                  return (
                    <div
                      key={group.monthKey}
                      className="sales-month-group"
                    >
                      <button
                        type="button"
                        className={`sales-month-toggle ${
                          isExpanded
                            ? "sales-month-toggle-open"
                            : ""
                        }`}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          toggleSalesMonth(group.monthKey)
                        }
                      >
                        <div>
                          <p className="font-display text-lg">
                            {group.label}
                          </p>
                          <p className="text-muted text-xs">
                            {group.entries.length} entries ·{" "}
                            {group.units} units · $
                            {group.revenue.toFixed(2)}
                          </p>
                        </div>
                        <span className="sales-month-toggle-state">
                          {isExpanded ? "Collapse" : "Expand"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="table-shell">
                          <table className="w-full text-sm">
                            <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                              <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Unit</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Revenue</th>
                                <th className="px-4 py-3">
                                  Delivered
                                </th>
                                <th className="px-4 py-3">Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.entries.map(
                                ({ sale, index }) => (
                                  <tr
                                    key={index}
                                    className={`table-row ${
                                      draggingSaleIndex === index
                                        ? "table-row-dragging"
                                        : ""
                                    } ${
                                      dragOverSaleIndex === index &&
                                      draggingSaleIndex !== index
                                        ? "table-row-drop-target"
                                        : ""
                                    }`}
                                    draggable
                                    onDragStart={event =>
                                      startSaleDrag(
                                        event,
                                        index,
                                        group.monthKey
                                      )
                                    }
                                    onDragOver={event =>
                                      allowSaleDrop(
                                        event,
                                        index,
                                        group.monthKey
                                      )
                                    }
                                    onDrop={event =>
                                      dropSale(
                                        event,
                                        index,
                                        group.monthKey
                                      )
                                    }
                                    onDragEnd={endSaleDrag}
                                  >
                                    <td className="px-4 py-3">
                                      <div className="row-edit-cell">
                                        <span
                                          className="drag-handle"
                                          aria-hidden="true"
                                          title="Drag to reorder"
                                        >
                                          ⋮⋮
                                        </span>
                                        <button
                                          type="button"
                                          className="row-edit-link row-field-button"
                                          aria-label={`Open sale on ${formatSaleDate(sale.date)}`}
                                          onClick={() =>
                                            startEditSale(index)
                                          }
                                        >
                                          {formatSaleDate(
                                            sale.date
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className="row-edit-link row-field-button"
                                        onClick={() =>
                                          startEditSale(index)
                                        }
                                      >
                                        <span className="grid gap-1 text-left">
                                          <span>{sale.location}</span>
                                          <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                                            {sale.customerType === "store"
                                              ? "Store"
                                              : "Individual"}
                                          </span>
                                        </span>
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className="row-edit-link row-field-button"
                                        onClick={() =>
                                          startEditSale(index)
                                        }
                                      >
                                        {sale.unit}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className="row-edit-link row-field-button"
                                        onClick={() =>
                                          startEditSale(index)
                                        }
                                      >
                                        {sale.qty}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className="row-edit-link row-field-button"
                                        onClick={() =>
                                          startEditSale(index)
                                        }
                                      >
                                        ${sale.price.toFixed(2)}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className="row-edit-link row-field-button"
                                        onClick={() =>
                                          startEditSale(index)
                                        }
                                      >
                                        $
                                        {(
                                          sale.qty * sale.price
                                        ).toFixed(2)}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className={`status-pill ${
                                          sale.delivered
                                            ? "status-pill-on"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          updateSale(index, {
                                            delivered:
                                              !sale.delivered,
                                          })
                                        }
                                      >
                                        {sale.delivered
                                          ? "Delivered"
                                          : "Pending"}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3">
                                      <button
                                        type="button"
                                        className={`status-pill ${
                                          sale.paid
                                            ? "status-pill-on"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          updateSale(index, {
                                            paid: !sale.paid,
                                          })
                                        }
                                      >
                                        {sale.paid
                                          ? "Paid"
                                          : "Unpaid"}
                                      </button>
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card data-tools" id="data-tools">
            <div className="section-head">
              <div>
                <h2 className="section-title">Data & Backup</h2>
                <p className="text-muted text-sm">
                  Export your data or restore it from a JSON backup.
                </p>
              </div>
              <span className="badge">Local</span>
            </div>

            <div className="data-actions">
              <button
                type="button"
                className="button-primary"
                onClick={exportData}
              >
                Export data
              </button>
              <label className="button-secondary" htmlFor="import-data">
                Import data
              </label>
              <input
                id="import-data"
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={handleImport}
              />
            </div>

            <p className="data-note text-muted">
              Import will replace the current sales and store data.
            </p>
            {dataMessage && (
              <p className="data-status">{dataMessage}</p>
            )}
          </section>
        </div>
      </div>

      {isEditingSale && saleEdit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sale-title"
          onClick={cancelEditSale}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">
                  {saleEditMode === "duplicate"
                    ? "Duplicate Sale"
                    : "Edit Sale"}
                </p>
                <h3
                  id="edit-sale-title"
                  className="font-display text-2xl"
                >
                  {saleEdit.location || "Sale details"}
                </h3>
                {saleEditMode === "duplicate" && (
                  <p className="text-muted text-sm mt-1">
                    Adjust the copied details below, then create the
                    new sale.
                  </p>
                )}
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={cancelEditSale}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              <input
                type="date"
                value={saleEdit.date}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? { ...prev, date: e.target.value }
                      : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <select
                value={saleEdit.customerType}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          customerType: e.target
                            .value as SaleParty,
                        }
                      : prev
                  )
                }
                className="input-field w-full"
                aria-label="Sale type"
              >
                <option value="store">Store</option>
                <option value="individual">Individual</option>
              </select>

              <input
                placeholder={
                  saleEdit.customerType === "store"
                    ? "Store name"
                    : "Customer name"
                }
                value={saleEdit.location}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? { ...prev, location: e.target.value }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <select
                value={saleEdit.unit}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          unit: e.target.value as Sale["unit"],
                        }
                      : prev
                  )
                }
                className="input-field w-full"
              >
                <option value="slice">Slice</option>
                <option value="loaf">Loaf</option>
              </select>

              <input
                type="number"
                placeholder="Quantity"
                value={saleEdit.qty}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? { ...prev, qty: Number(e.target.value) }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Price per unit"
                value={saleEdit.price}
                onChange={e =>
                  setSaleEdit(prev =>
                    prev
                      ? { ...prev, price: Number(e.target.value) }
                      : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <div className="status-toggle-row span-2">
                <button
                  type="button"
                  className={`toggle-pill ${
                    saleEdit.delivered ? "toggle-pill-on" : ""
                  }`}
                  onClick={() =>
                    setSaleEdit(prev =>
                      prev
                        ? { ...prev, delivered: !prev.delivered }
                        : prev
                    )
                  }
                >
                  <span className="toggle-dot" />
                  {saleEdit.delivered ? "Delivered" : "Mark Delivered"}
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${
                    saleEdit.paid ? "toggle-pill-on" : ""
                  }`}
                  onClick={() =>
                    setSaleEdit(prev =>
                      prev
                        ? { ...prev, paid: !prev.paid }
                        : prev
                    )
                  }
                >
                  <span className="toggle-dot" />
                  {saleEdit.paid
                    ? "Payment Confirmed"
                    : "Confirm Payment"}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              {saleEditMode === "edit" && (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={startDuplicateSale}
                >
                  Duplicate sale
                </button>
              )}
              <button
                type="button"
                className="button-secondary"
                onClick={cancelEditSale}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={saveEditSale}
              >
                {saleEditMode === "duplicate"
                  ? "Create duplicate"
                  : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
