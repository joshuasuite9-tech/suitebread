"use client";

import Link from "next/link";
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
  perLoaf: number;
  purchaseQty: number;
  purchaseCost: number;
};

type InventorySettings = {
  slicesPerLoaf: number;
};

type MarketingTracker = {
  sampleSlices: number;
  sampleLoaves: number;
  wastageSlices: number;
  wastageLoaves: number;
};

const normalizeMarketingTracker = (
  tracker: MarketingTracker | Partial<MarketingTracker>
): MarketingTracker => ({
  sampleSlices: Math.max(0, Number(tracker.sampleSlices ?? 0)),
  sampleLoaves: Math.max(0, Number(tracker.sampleLoaves ?? 0)),
  wastageSlices: Math.max(0, Number(tracker.wastageSlices ?? 0)),
  wastageLoaves: Math.max(0, Number(tracker.wastageLoaves ?? 0)),
});

export default function LeakagePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [settings, setSettings] = useState<InventorySettings>({
    slicesPerLoaf: 10,
  });
  const [marketingTracker, setMarketingTracker] =
    useState<MarketingTracker>(normalizeMarketingTracker({}));
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
    if (savedIngredients) {
      const parsed = JSON.parse(savedIngredients) as Ingredient[];
      setIngredients(
        parsed.map(item => ({
          perLoaf: Number(item.perLoaf ?? 0),
          purchaseQty: Number(item.purchaseQty ?? 0),
          purchaseCost: Number(item.purchaseCost ?? 0),
        }))
      );
    }

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

    const savedMarketing = localStorage.getItem(
      "suitebread-marketing-tracker"
    );
    if (savedMarketing) {
      const parsed = JSON.parse(savedMarketing) as MarketingTracker;
      setMarketingTracker(normalizeMarketingTracker(parsed));
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "suitebread-marketing-tracker",
      JSON.stringify(marketingTracker)
    );
  }, [marketingTracker, isHydrated]);

  const updateMarketingTracker = (
    field: keyof MarketingTracker,
    value: number
  ) => {
    setMarketingTracker(prev => ({
      ...prev,
      [field]: Math.max(0, Number(value) || 0),
    }));
  };

  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;
  const getIngredientUnitCost = (ingredient: Ingredient) =>
    ingredient.purchaseQty > 0
      ? ingredient.purchaseCost / ingredient.purchaseQty
      : 0;
  const costPerLoaf = ingredients.reduce(
    (sum, ingredient) =>
      sum + ingredient.perLoaf * getIngredientUnitCost(ingredient),
    0
  );
  const costPerSlice =
    settings.slicesPerLoaf > 0
      ? costPerLoaf / settings.slicesPerLoaf
      : 0;
  const sampleCost =
    marketingTracker.sampleSlices * costPerSlice +
    marketingTracker.sampleLoaves * costPerLoaf;
  const wastageCost =
    marketingTracker.wastageSlices * costPerSlice +
    marketingTracker.wastageLoaves * costPerLoaf;
  const totalLeakageCost = sampleCost + wastageCost;
  const totalLeakageUnits =
    marketingTracker.sampleSlices +
    marketingTracker.sampleLoaves +
    marketingTracker.wastageSlices +
    marketingTracker.wastageLoaves;
  return (
    <main className="app-root">
      <div className="app-glow app-glow-right" />
      <div className="app-glow app-glow-left" />

      <div className="app-shell">
        <AppSidebar>
          <div className="sidebar-footer">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Total Leakage
              </p>
              <p className="font-display text-2xl">
                ${totalLeakageCost.toFixed(2)}
              </p>
              <p className="text-muted text-xs">
                {totalLeakageUnits} units tracked
              </p>
            </div>
            <div className="sidebar-divider" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Cost Basis
              </p>
              <p className="font-display text-2xl">
                ${costPerLoaf.toFixed(2)}
              </p>
              <p className="text-muted text-xs">
                ${costPerSlice.toFixed(2)} per slice
              </p>
            </div>
            <div className="sidebar-divider" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                Active Stores
              </p>
              <p className="font-display text-2xl">{stores.length}</p>
              <p className="text-muted text-xs">
                ${unpaidRevenue.toFixed(2)} outstanding across{" "}
                {outstandingCount} deliveries
              </p>
            </div>
          </div>
        </AppSidebar>

        <div className="content grid gap-6">
          <header className="topbar card">
            <div>
              <p className="eyebrow">Leakage</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Marketing Cost Tracking
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Track samples and wastage in slices and loaves, with
                cost estimated from your ingredient setup.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">
                Total leakage ${totalLeakageCost.toFixed(2)}
              </div>
              <div className="chip">{totalLeakageUnits} units tracked</div>
            </div>
          </header>

          <section className="stat-grid">
            <div className="card stat-card">
              <p className="stat-label">Total Leakage</p>
              <p className="stat-value">
                ${totalLeakageCost.toFixed(2)}
              </p>
              <p className="stat-meta">
                Samples ${sampleCost.toFixed(2)} · Wastage $
                {wastageCost.toFixed(2)}
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Samples</p>
              <p className="stat-value">${sampleCost.toFixed(2)}</p>
              <p className="stat-meta">
                {marketingTracker.sampleSlices} slices ·{" "}
                {marketingTracker.sampleLoaves} loaves
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Wastage</p>
              <p className="stat-value">${wastageCost.toFixed(2)}</p>
              <p className="stat-meta">
                {marketingTracker.wastageSlices} slices ·{" "}
                {marketingTracker.wastageLoaves} loaves
              </p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Cost Basis</p>
              <p className="stat-value">${costPerLoaf.toFixed(2)}</p>
              <p className="stat-meta">
                ${costPerSlice.toFixed(2)} per slice · update on{" "}
                <Link href="/ingredients" className="underline">
                  Ingredients Inventory
                </Link>
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Samples</h2>
                  <p className="text-muted text-sm">
                    Track product given away for tasting or promotion.
                  </p>
                </div>
                <span className="badge">${sampleCost.toFixed(2)}</span>
              </div>

              <div className="form-grid">
                <label className="text-sm">
                  Sample slices
                  <input
                    type="number"
                    min={0}
                    value={marketingTracker.sampleSlices}
                    onChange={event =>
                      updateMarketingTracker(
                        "sampleSlices",
                        Number(event.target.value)
                      )
                    }
                    className="input-field w-full"
                  />
                </label>

                <label className="text-sm">
                  Sample loaves
                  <input
                    type="number"
                    min={0}
                    value={marketingTracker.sampleLoaves}
                    onChange={event =>
                      updateMarketingTracker(
                        "sampleLoaves",
                        Number(event.target.value)
                      )
                    }
                    className="input-field w-full"
                  />
                </label>
              </div>
            </section>

            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Wastage</h2>
                  <p className="text-muted text-sm">
                    Track spoilage, damage, or unsold product loss.
                  </p>
                </div>
                <span className="badge">${wastageCost.toFixed(2)}</span>
              </div>

              <div className="form-grid">
                <label className="text-sm">
                  Wastage slices
                  <input
                    type="number"
                    min={0}
                    value={marketingTracker.wastageSlices}
                    onChange={event =>
                      updateMarketingTracker(
                        "wastageSlices",
                        Number(event.target.value)
                      )
                    }
                    className="input-field w-full"
                  />
                </label>

                <label className="text-sm">
                  Wastage loaves
                  <input
                    type="number"
                    min={0}
                    value={marketingTracker.wastageLoaves}
                    onChange={event =>
                      updateMarketingTracker(
                        "wastageLoaves",
                        Number(event.target.value)
                      )
                    }
                    className="input-field w-full"
                  />
                </label>
              </div>
            </section>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Leakage Summary</h2>
                <p className="text-muted text-sm">
                  Current totals based on your saved marketing and
                  wastage entries.
                </p>
              </div>
              <span className="badge">Live</span>
            </div>

            <div className="sidebar-summary-grid">
              <div className="sidebar-summary-card">
                <p className="stat-label">Sample Units</p>
                <p className="font-display text-2xl">
                  {marketingTracker.sampleSlices +
                    marketingTracker.sampleLoaves}
                </p>
                <p className="text-muted text-xs">
                  {marketingTracker.sampleSlices} slices ·{" "}
                  {marketingTracker.sampleLoaves} loaves
                </p>
              </div>

              <div className="sidebar-summary-card">
                <p className="stat-label">Wastage Units</p>
                <p className="font-display text-2xl">
                  {marketingTracker.wastageSlices +
                    marketingTracker.wastageLoaves}
                </p>
                <p className="text-muted text-xs">
                  {marketingTracker.wastageSlices} slices ·{" "}
                  {marketingTracker.wastageLoaves} loaves
                </p>
              </div>
            </div>

            <p className="data-note text-muted">
              If these costs look wrong, update your ingredient
              purchase quantities, purchase costs, and slices-per-loaf
              setting on the Ingredients page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
