"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";

type Sale = {
  date: string;
  location: string;
  customerType: "store" | "individual";
  qty: number;
  price: number;
  delivered: boolean;
  paid: boolean;
};

type Store = {
  name: string;
  status: "active" | "potential";
};

type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type DeliveryDay = {
  date: string;
  qty: number;
  weekday: Weekday;
};

type RecommendationStatus =
  | "bake"
  | "watch"
  | "logged"
  | "hold"
  | "insufficient"
  | "inactive";

type StoreForecast = {
  store: string;
  historySampleSize: number;
  dominantDays: Weekday[];
  sameDayCount: number;
  sameDayRate: number;
  averageIntervalDays: number | null;
  lastDeliveryDate: string | null;
  daysSinceLast: number | null;
  nextExpectedDate: string | null;
  intervalProgress: number | null;
  predictedQty: number | null;
  selectedDateQty: number | null;
  score: number;
  recommendation: RecommendationStatus;
  rationale: string[];
  usingDeliveredHistory: boolean;
};

const DAY_MS = 1000 * 60 * 60 * 24;
const BAKE_LEAD_DAYS = 1;
const MAX_PLAN_INACTIVITY_DAYS = 14;
const WEEKLY_CADENCE_MIN_DAYS = 5;
const WEEKLY_CADENCE_MAX_DAYS = 9;

const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WEEKDAY_SHORT: Record<Weekday, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const RECOMMENDATION_PRIORITY: Record<RecommendationStatus, number> = {
  bake: 0,
  watch: 1,
  logged: 2,
  hold: 3,
  insufficient: 4,
  inactive: 5,
};

const normalizeStoreName = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const parseCalendarDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, (month || 1) - 1, day || 1, 12);
};

const differenceInDays = (from: string, to: string) =>
  Math.round(
    (parseCalendarDate(to).getTime() - parseCalendarDate(from).getTime()) /
      DAY_MS
  );

const addCalendarDays = (value: string, days: number) => {
  const date = parseCalendarDate(value);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getWeekdayFromDate = (value: string) =>
  parseCalendarDate(value).toLocaleDateString(undefined, {
    weekday: "long",
  }) as Weekday;

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

const formatLongDate = (value: string) =>
  parseCalendarDate(value).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatWeekdayList = (days: Weekday[]) =>
  days.map(day => WEEKDAY_SHORT[day]).join(" / ");

const formatInterval = (value: number | null) => {
  if (value === null) return "—";
  const rounded = value < 10 ? value.toFixed(1) : `${Math.round(value)}`;
  return `${rounded.replace(/\.0$/, "")} days`;
};

const getRecommendationLabel = (recommendation: RecommendationStatus) => {
  switch (recommendation) {
    case "bake":
      return "Bake now";
    case "watch":
      return "Watch soon";
    case "logged":
      return "Already logged";
    case "hold":
      return "Hold";
    case "inactive":
      return "Dormant";
    default:
      return "Needs judgement";
  }
};

const getRecommendationClassName = (
  recommendation: RecommendationStatus
) => {
  switch (recommendation) {
    case "bake":
      return "forecast-status forecast-status-bake";
    case "watch":
      return "forecast-status forecast-status-watch";
    case "logged":
      return "forecast-status forecast-status-logged";
    case "hold":
      return "forecast-status forecast-status-hold";
    case "inactive":
      return "forecast-status forecast-status-inactive";
    default:
      return "forecast-status forecast-status-insufficient";
  }
};

const getForecastCardClassName = (
  recommendation: RecommendationStatus
) => {
  switch (recommendation) {
    case "bake":
      return "forecast-card forecast-card-bake";
    case "watch":
      return "forecast-card forecast-card-watch";
    case "logged":
      return "forecast-card forecast-card-logged";
    default:
      return "forecast-card";
  }
};

const buildDeliveryDays = (sales: Sale[]) => {
  const byDate = new Map<string, number>();

  sales.forEach(sale => {
    if (!sale.date || sale.qty <= 0) return;
    byDate.set(sale.date, (byDate.get(sale.date) ?? 0) + sale.qty);
  });

  return Array.from(byDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, qty]) => ({
      date,
      qty,
      weekday: getWeekdayFromDate(date),
    }));
};

const getDominantDays = (deliveryDays: DeliveryDay[]) => {
  const counts = WEEKDAYS.map(day => ({
    day,
    count: deliveryDays.filter(delivery => delivery.weekday === day)
      .length,
  })).filter(item => item.count > 0);

  if (counts.length === 0) {
    return [];
  }

  counts.sort(
    (left, right) =>
      right.count - left.count ||
      WEEKDAYS.indexOf(left.day) - WEEKDAYS.indexOf(right.day)
  );

  const peak = counts[0]?.count ?? 0;

  return counts
    .filter((item, index) =>
      index === 0 ? true : item.count >= Math.max(1, Math.ceil(peak * 0.6))
    )
    .slice(0, 3)
    .map(item => item.day);
};

const buildStoreForecast = (
  store: string,
  storeSales: Sale[],
  selectedDate: string
): StoreForecast => {
  const deliveredSales = storeSales.filter(sale => sale.delivered);
  const historySales = deliveredSales.length > 0 ? deliveredSales : storeSales;
  const allDeliveryDays = buildDeliveryDays(historySales);
  const recentDeliveryDays = allDeliveryDays.slice(-12);
  const selectedWeekday = getWeekdayFromDate(selectedDate);
  const sameDayHistory = recentDeliveryDays.filter(
    delivery => delivery.weekday === selectedWeekday
  );
  const sameDayCount = sameDayHistory.length;
  const sameDayRate = recentDeliveryDays.length
    ? sameDayCount / recentDeliveryDays.length
    : 0;
  const sameDayIntervals = sameDayHistory
    .slice(1)
    .map((delivery, index) =>
      differenceInDays(sameDayHistory[index].date, delivery.date)
    )
    .filter(interval => interval > 0);
  const weeklySameDayIntervals = sameDayIntervals.filter(
    interval =>
      interval >= WEEKLY_CADENCE_MIN_DAYS &&
      interval <= WEEKLY_CADENCE_MAX_DAYS
  );
  const weeklySameDayRate = sameDayIntervals.length
    ? weeklySameDayIntervals.length / sameDayIntervals.length
    : 0;
  const recentIntervals = recentDeliveryDays
    .slice(1)
    .map((delivery, index) =>
      differenceInDays(recentDeliveryDays[index].date, delivery.date)
    )
    .filter(interval => interval > 0)
    .slice(-6);
  const averageIntervalDays = recentIntervals.length
    ? average(recentIntervals)
    : null;
  const selectedDateEntry =
    allDeliveryDays.find(delivery => delivery.date === selectedDate) ?? null;
  const lastDelivery =
    [...allDeliveryDays]
      .reverse()
      .find(delivery => delivery.date <= selectedDate) ?? null;
  const daysSinceLast = lastDelivery
    ? differenceInDays(lastDelivery.date, selectedDate)
    : null;
  const intervalProgress =
    averageIntervalDays !== null && daysSinceLast !== null
      ? daysSinceLast / averageIntervalDays
      : null;
  const qtyBasis =
    sameDayHistory.length >= 2 ? sameDayHistory : recentDeliveryDays.slice(-4);
  const predictedQty = qtyBasis.length
    ? Math.max(1, Math.round(average(qtyBasis.map(day => day.qty))))
    : null;
  const nextExpectedDate =
    lastDelivery && averageIntervalDays !== null
      ? addCalendarDays(lastDelivery.date, Math.round(averageIntervalDays))
      : null;
  const score = clamp(
    sameDayRate * 0.55 +
      ((intervalProgress !== null
        ? clamp(intervalProgress, 0, 1.35) / 1.35
        : 0) *
        0.45),
    0,
    1
  );
  const consistentWeeklyCadence =
    sameDayCount >= 2 &&
    weeklySameDayIntervals.length > 0 &&
    weeklySameDayRate >= 0.6;
  const isInactive =
    selectedDateEntry === null &&
    daysSinceLast !== null &&
    daysSinceLast >= MAX_PLAN_INACTIVITY_DAYS;

  let recommendation: RecommendationStatus = "insufficient";
  if (selectedDateEntry) {
    recommendation = "logged";
  } else if (isInactive) {
    recommendation = "inactive";
  } else if (recentDeliveryDays.length === 0) {
    recommendation = "insufficient";
  } else {
    const strongWeekday = sameDayCount >= 2 && sameDayRate >= 0.3;
    const intervalDue = intervalProgress !== null && intervalProgress >= 0.95;
    const intervalSoon =
      intervalProgress !== null && intervalProgress >= 0.75;
    const emergingWeekday = sameDayCount >= 1 && sameDayRate >= 0.18;

    if (
      consistentWeeklyCadence ||
      intervalDue ||
      (strongWeekday && intervalSoon) ||
      (strongWeekday && sameDayRate >= 0.5)
    ) {
      recommendation = "bake";
    } else if (intervalSoon || emergingWeekday) {
      recommendation = "watch";
    } else if (recentDeliveryDays.length >= 2) {
      recommendation = "hold";
    }
  }

  const rationale: string[] = [];
  if (selectedDateEntry) {
    rationale.push(
      `${selectedDateEntry.qty} units are already logged on ${formatSaleDate(selectedDate)}.`
    );
  }

  if (isInactive && lastDelivery && daysSinceLast !== null) {
    rationale.push(
      `Last baked ${daysSinceLast} days ago on ${formatSaleDate(
        lastDelivery.date
      )}, so this store is excluded from the current plan.`
    );
  }

  if (sameDayCount > 0) {
    rationale.push(
      `${sameDayCount} of ${recentDeliveryDays.length} recent deliveries landed on ${selectedWeekday}.`
    );
  } else {
    const dominantDays = getDominantDays(recentDeliveryDays);
    if (dominantDays.length > 0) {
      rationale.push(`Usually supplied on ${formatWeekdayList(dominantDays)}.`);
    }
  }

  if (consistentWeeklyCadence) {
    rationale.push(
      `Consistent weekly ${selectedWeekday} cadence detected from ${weeklySameDayIntervals.length} matching same-day gap${
        weeklySameDayIntervals.length === 1 ? "" : "s"
      }, so it is promoted into the bake plan.`
    );
  }

  if (
    averageIntervalDays !== null &&
    daysSinceLast !== null &&
    lastDelivery
  ) {
    rationale.push(
      `Average resupply is ${formatInterval(averageIntervalDays)}; last delivery was ${daysSinceLast} day${
        daysSinceLast === 1 ? "" : "s"
      } ago on ${formatSaleDate(lastDelivery.date)}.`
    );
  } else if (lastDelivery) {
    rationale.push(`Last delivery was on ${formatSaleDate(lastDelivery.date)}.`);
  }

  if (predictedQty !== null) {
    rationale.push(
      `Suggested quantity is ${predictedQty} unit${
        predictedQty === 1 ? "" : "s"
      } based on recent runs.`
    );
  }

  return {
    store,
    historySampleSize: recentDeliveryDays.length,
    dominantDays: getDominantDays(recentDeliveryDays),
    sameDayCount,
    sameDayRate,
    averageIntervalDays,
    lastDeliveryDate: lastDelivery?.date ?? null,
    daysSinceLast,
    nextExpectedDate,
    intervalProgress,
    predictedQty,
    selectedDateQty: selectedDateEntry?.qty ?? null,
    score,
    recommendation,
    rationale,
    usingDeliveredHistory: deliveredSales.length > 0,
  };
};

export default function OrdersPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [detailStoreName, setDetailStoreName] = useState<
    string | null
  >(null);

  useEffect(() => {
    const savedSales = localStorage.getItem("suitebread-sales");
    if (savedSales) {
      const parsed = JSON.parse(savedSales) as Array<Partial<Sale>>;
      setSales(
        parsed
          .map((sale): Sale => ({
            date:
              typeof sale.date === "string" && sale.date
                ? sale.date
                : new Date().toISOString().slice(0, 10),
            location: normalizeStoreName(sale.location),
            customerType:
              sale.customerType === "individual"
                ? "individual"
                : "store",
            qty: Math.max(0, Number(sale.qty ?? 0)),
            price: Number(sale.price ?? 0),
            delivered: Boolean(sale.delivered),
            paid: Boolean(sale.paid),
          }))
          .filter(sale => sale.location)
          .sort((left, right) => left.date.localeCompare(right.date))
      );
    }

    const savedStores = localStorage.getItem("suitebread-stores");
    if (savedStores) {
      const parsed = JSON.parse(savedStores) as Array<Partial<Store>>;
      setStores(
        parsed
          .map((store): Store => ({
            name: normalizeStoreName(store.name),
            status:
              store.status === "potential" ? "potential" : "active",
          }))
          .filter(store => store.name)
      );
    }
  }, []);

  const unpaidRevenue = sales
    .filter(sale => sale.delivered && !sale.paid)
    .reduce((sum, sale) => sum + sale.qty * sale.price, 0);
  const outstandingCount = sales.filter(
    sale => sale.delivered && !sale.paid
  ).length;
  const activeStoreCount = stores.filter(
    store => store.status !== "potential"
  ).length;

  const salesByStore = new Map<string, Sale[]>();
  sales.forEach(sale => {
    if (sale.customerType !== "store") return;
    const storeName = normalizeStoreName(sale.location);
    if (!storeName) return;
    const current = salesByStore.get(storeName) ?? [];
    current.push(sale);
    salesByStore.set(storeName, current);
  });

  const storeNames = Array.from(
    new Set([
      ...stores
        .filter(store => store.status !== "potential")
        .map(store => store.name),
      ...Array.from(salesByStore.keys()),
    ])
  ).sort((left, right) => left.localeCompare(right));
  const bakeDate = orderDate;
  const deliveryDate = addCalendarDays(bakeDate, BAKE_LEAD_DAYS);
  const bakeWeekday = getWeekdayFromDate(bakeDate);
  const selectedWeekday = getWeekdayFromDate(deliveryDate);
  const bakeDateLabel = formatLongDate(bakeDate);
  const deliveryDateLabel = formatLongDate(deliveryDate);

  const forecasts = storeNames
    .map(store =>
      buildStoreForecast(store, salesByStore.get(store) ?? [], deliveryDate)
    )
    .sort(
      (left, right) =>
        RECOMMENDATION_PRIORITY[left.recommendation] -
          RECOMMENDATION_PRIORITY[right.recommendation] ||
        right.score - left.score ||
        left.store.localeCompare(right.store)
    );
  const activeForecasts = forecasts.filter(
    forecast => forecast.recommendation !== "inactive"
  );
  const inactiveStores = forecasts.filter(
    forecast => forecast.recommendation === "inactive"
  );

  const bakeNow = activeForecasts.filter(
    forecast => forecast.recommendation === "bake"
  );
  const watchSoon = activeForecasts.filter(
    forecast => forecast.recommendation === "watch"
  );
  const alreadyLogged = activeForecasts.filter(
    forecast => forecast.recommendation === "logged"
  );
  const needsJudgement = activeForecasts.filter(
    forecast => forecast.recommendation === "insufficient"
  );
  const totalSuggestedUnits = bakeNow.reduce(
    (sum, forecast) => sum + (forecast.predictedQty ?? 0),
    0
  );
  const averageObservedInterval = activeForecasts
    .map(forecast => forecast.averageIntervalDays)
    .filter((value): value is number => value !== null);
  const historySourceCount = activeForecasts.filter(
    forecast => forecast.usingDeliveredHistory
  ).length;
  const hasPlannerData = forecasts.length > 0;
  const detailForecast = detailStoreName
    ? forecasts.find(forecast => forecast.store === detailStoreName) ??
      null
    : null;

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
              <p className="font-display text-2xl">{activeStoreCount}</p>
              <p className="text-muted text-xs">
                Forecasting from live sales history
              </p>
            </div>
          </div>
        </AppSidebar>

        <div className="content grid gap-6">
          <header className="topbar card">
            <div>
              <p className="eyebrow">Orders</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Bake Planner
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Pick a bake date and the planner will recommend what to bake
                for the next day&apos;s deliveries using weekday habit and
                average resupply timing.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">Bake {bakeWeekday}</div>
              <div className="chip">Deliver {selectedWeekday}</div>
              <div className="chip">{bakeNow.length} bake now</div>
              <div className="chip">{watchSoon.length} watch soon</div>
              <div className="chip">{inactiveStores.length} dormant</div>
            </div>
          </header>

          <section className="stat-grid">
            <div className="card stat-card">
              <p className="stat-label">Bake Now</p>
              <p className="stat-value">{bakeNow.length}</p>
              <p className="stat-meta">Stores strongly due for next-day delivery</p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Suggested Units</p>
              <p className="stat-value">{totalSuggestedUnits}</p>
              <p className="stat-meta">Rounded from matching historical runs</p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Average Resupply</p>
              <p className="stat-value">
                {averageObservedInterval.length > 0
                  ? formatInterval(average(averageObservedInterval))
                  : "—"}
              </p>
              <p className="stat-meta">Across stores with enough cadence data</p>
            </div>

            <div className="card stat-card">
              <p className="stat-label">Already Logged</p>
              <p className="stat-value">{alreadyLogged.length}</p>
              <p className="stat-meta">Stores already entered for the delivery date</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Bake Plan</h2>
                  <p className="text-muted text-sm">
                    Bake {bakeDateLabel} · Deliver {deliveryDateLabel}
                  </p>
                </div>
                <span className="badge">Deliver {selectedWeekday}</span>
              </div>

              <div className="forecast-controls">
                <label className="text-sm">
                  Bake date
                  <input
                    type="date"
                    value={orderDate}
                    onChange={event => setOrderDate(event.target.value)}
                    className="input-field w-full"
                  />
                </label>

                <div className="forecast-metric">
                  <span>History source</span>
                  <strong>
                    {historySourceCount} store{historySourceCount === 1 ? "" : "s"} using delivered sales
                  </strong>
                  <p className="text-muted text-sm">
                    Stores without delivered history fall back to all logged sales for the delivery day.
                  </p>
                </div>
              </div>

              {!hasPlannerData ? (
                <div className="empty-state">
                  Add stores and log a few delivered sales so the planner can
                  learn each location&apos;s rhythm.
                </div>
              ) : bakeNow.length === 0 ? (
                <div className="empty-state">
                  Nothing is strongly due for delivery on {selectedWeekday} yet.
                  Check the watch list for stores that are getting close.
                  {inactiveStores.length > 0
                    ? ` ${inactiveStores.length} store${
                        inactiveStores.length === 1 ? " is" : "s are"
                      } dormant because they have not been baked for two weeks.`
                    : ""}
                </div>
              ) : (
                <div className="status-stack">
                  {bakeNow.map(forecast => (
                    <div
                      key={forecast.store}
                      className={`status-item ${getForecastCardClassName(
                        forecast.recommendation
                      )}`}
                    >
                      <div className="forecast-card-head">
                        <div>
                          <p className="font-display text-xl">{forecast.store}</p>
                          <p className="text-muted text-sm">
                            {forecast.dominantDays.length > 0
                              ? `Usually ${formatWeekdayList(
                                  forecast.dominantDays
                                )}`
                              : "Building weekday pattern"}
                          </p>
                        </div>

                        <div className="status-pills">
                          {forecast.predictedQty !== null && (
                            <span className="pill">
                              {forecast.predictedQty} units
                            </span>
                          )}
                          <span
                            className={getRecommendationClassName(
                              forecast.recommendation
                            )}
                          >
                            {getRecommendationLabel(
                              forecast.recommendation
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(
                              16,
                              Math.round(forecast.score * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="forecast-metric-grid">
                        <div className="forecast-metric">
                          <span>Same-day history</span>
                          <strong>
                            {forecast.sameDayCount} / {forecast.historySampleSize}
                          </strong>
                        </div>
                        <div className="forecast-metric">
                          <span>Avg resupply</span>
                          <strong>{formatInterval(forecast.averageIntervalDays)}</strong>
                        </div>
                        <div className="forecast-metric">
                          <span>Last delivery</span>
                          <strong>
                            {forecast.lastDeliveryDate
                              ? formatSaleDate(forecast.lastDeliveryDate)
                              : "—"}
                          </strong>
                        </div>
                        <div className="forecast-metric">
                          <span>Next expected</span>
                          <strong>
                            {forecast.nextExpectedDate
                              ? formatSaleDate(forecast.nextExpectedDate)
                              : "—"}
                          </strong>
                        </div>
                      </div>

                      <ul className="forecast-reasons">
                        {forecast.rationale.map(reason => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid gap-6">
              <section className="card">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Watch List</h2>
                    <p className="text-muted text-sm">
                      These stores are close, but not strong enough to call a bake yet.
                    </p>
                  </div>
                  <span className="badge">{watchSoon.length}</span>
                </div>

                {watchSoon.length === 0 ? (
                  <div className="empty-state">No stores are hovering near due.</div>
                ) : (
                  <div className="standing-list">
                    {watchSoon.map(forecast => (
                      <div key={forecast.store} className="standing-item">
                        <div>
                          <p className="font-display text-base">{forecast.store}</p>
                          <p className="text-muted text-xs">
                            {forecast.sameDayCount > 0
                              ? `${forecast.sameDayCount} of ${forecast.historySampleSize} on ${selectedWeekday}`
                              : forecast.dominantDays.length > 0
                                ? `Usually ${formatWeekdayList(forecast.dominantDays)}`
                                : "Limited weekday pattern"}
                          </p>
                          <p className="text-muted text-xs">
                            Avg {formatInterval(forecast.averageIntervalDays)} · last {forecast.lastDeliveryDate
                              ? formatSaleDate(forecast.lastDeliveryDate)
                              : "—"}
                          </p>
                        </div>
                        <span className="pill">
                          {forecast.predictedQty ?? 0} units
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Dormant Stores</h2>
                    <p className="text-muted text-sm">
                      Stores with no bake in the last two weeks are kept out of
                      the current plan.
                    </p>
                  </div>
                  <span className="badge">{inactiveStores.length}</span>
                </div>

                {inactiveStores.length === 0 ? (
                  <div className="empty-state">
                    No dormant stores right now.
                  </div>
                ) : (
                  <div className="standing-list">
                    {inactiveStores.map(forecast => (
                      <div key={forecast.store} className="standing-item">
                        <div>
                          <p className="font-display text-base">
                            {forecast.store}
                          </p>
                          <p className="text-muted text-xs">
                            Last bake{" "}
                            {forecast.lastDeliveryDate
                              ? formatSaleDate(forecast.lastDeliveryDate)
                              : "—"}
                            {forecast.daysSinceLast !== null
                              ? ` · ${forecast.daysSinceLast} days ago`
                              : ""}
                          </p>
                          {forecast.dominantDays.length > 0 && (
                            <p className="text-muted text-xs">
                              Usually {formatWeekdayList(forecast.dominantDays)}
                            </p>
                          )}
                        </div>
                        <span
                          className={getRecommendationClassName(
                            forecast.recommendation
                          )}
                        >
                          {getRecommendationLabel(forecast.recommendation)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Exceptions</h2>
                    <p className="text-muted text-sm">
                      Stores already logged, or stores without enough history yet.
                    </p>
                  </div>
                  <span className="badge">
                    {alreadyLogged.length + needsJudgement.length}
                  </span>
                </div>

                {alreadyLogged.length === 0 && needsJudgement.length === 0 ? (
                  <div className="empty-state">
                    No exceptions on this date.
                  </div>
                ) : (
                  <div className="standing-list">
                    {alreadyLogged.map(forecast => (
                      <div key={forecast.store} className="standing-item">
                        <div>
                          <p className="font-display text-base">{forecast.store}</p>
                          <p className="text-muted text-xs">
                            Already entered for {formatSaleDate(deliveryDate)}
                          </p>
                        </div>
                        <span className="pill">
                          {forecast.selectedDateQty ?? 0} logged
                        </span>
                      </div>
                    ))}

                    {needsJudgement.map(forecast => (
                      <div key={forecast.store} className="standing-item">
                        <div>
                          <p className="font-display text-base">{forecast.store}</p>
                          <p className="text-muted text-xs">
                            {forecast.historySampleSize === 0
                              ? "No logged delivery history yet"
                              : `Only ${forecast.historySampleSize} delivery${
                                  forecast.historySampleSize === 1 ? "" : "ies"
                                } in history`}
                          </p>
                        </div>
                        <span
                          className={getRecommendationClassName(
                            forecast.recommendation
                          )}
                        >
                          {getRecommendationLabel(forecast.recommendation)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Store Rhythm</h2>
                <p className="text-muted text-sm">
                  Full breakdown of weekday precedent and average
                  resupply interval. Click a verdict to see why.
                </p>
              </div>
              <span className="badge">{forecasts.length} stores</span>
            </div>

            {!hasPlannerData ? (
              <div className="empty-state">
                Once you have stores and sales history, their cadence will appear here.
              </div>
            ) : (
              <div className="table-shell">
                <table className="w-full text-sm">
                  <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                    <tr>
                      <th className="px-4 py-3">Store</th>
                      <th className="px-4 py-3">Observed Days</th>
                      <th className="px-4 py-3">Avg Resupply</th>
                      <th className="px-4 py-3">Last Delivery</th>
                      <th className="px-4 py-3">Next Expected</th>
                      <th className="px-4 py-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecasts.map(forecast => (
                      <tr key={forecast.store} className="table-row">
                        <td className="px-4 py-3 align-top">
                          <div className="grid gap-1">
                            <span className="font-display text-base">
                              {forecast.store}
                            </span>
                            <span className="text-muted text-xs">
                              {forecast.usingDeliveredHistory
                                ? "Using delivered sales"
                                : "Using all logged sales"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {forecast.dominantDays.length > 0
                            ? formatWeekdayList(forecast.dominantDays)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {formatInterval(forecast.averageIntervalDays)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {forecast.lastDeliveryDate
                            ? formatSaleDate(forecast.lastDeliveryDate)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {forecast.nextExpectedDate
                            ? formatSaleDate(forecast.nextExpectedDate)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            className={`${getRecommendationClassName(
                              forecast.recommendation
                            )} forecast-status-button`}
                            onClick={() =>
                              setDetailStoreName(forecast.store)
                            }
                            aria-label={`Explain why ${forecast.store} is marked ${getRecommendationLabel(
                              forecast.recommendation
                            )}`}
                          >
                            {getRecommendationLabel(
                              forecast.recommendation
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {detailForecast && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forecast-detail-title"
          onClick={() => setDetailStoreName(null)}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Planner Reason</p>
                <h3
                  id="forecast-detail-title"
                  className="font-display text-2xl"
                >
                  {detailForecast.store}
                </h3>
                <p className="text-muted text-sm">
                  {getRecommendationLabel(
                    detailForecast.recommendation
                  )} for delivery on {deliveryDateLabel}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setDetailStoreName(null)}
              >
                ✕
              </button>
            </div>

            <div className="status-stack">
              <div
                className={`status-item ${getForecastCardClassName(
                  detailForecast.recommendation
                )}`}
              >
                <div className="status-pills">
                  <span
                    className={getRecommendationClassName(
                      detailForecast.recommendation
                    )}
                  >
                    {getRecommendationLabel(
                      detailForecast.recommendation
                    )}
                  </span>
                  <span className="pill">Deliver {selectedWeekday}</span>
                </div>

                <div className="forecast-metric-grid">
                  <div className="forecast-metric">
                    <span>Same-day history</span>
                    <strong>
                      {detailForecast.sameDayCount} /{" "}
                      {detailForecast.historySampleSize}
                    </strong>
                  </div>
                  <div className="forecast-metric">
                    <span>Avg resupply</span>
                    <strong>
                      {formatInterval(
                        detailForecast.averageIntervalDays
                      )}
                    </strong>
                  </div>
                  <div className="forecast-metric">
                    <span>Last delivery</span>
                    <strong>
                      {detailForecast.lastDeliveryDate
                        ? formatSaleDate(
                            detailForecast.lastDeliveryDate
                          )
                        : "—"}
                    </strong>
                  </div>
                  <div className="forecast-metric">
                    <span>Next expected</span>
                    <strong>
                      {detailForecast.nextExpectedDate
                        ? formatSaleDate(
                            detailForecast.nextExpectedDate
                          )
                        : "—"}
                    </strong>
                  </div>
                </div>

                {detailForecast.rationale.length === 0 ? (
                  <p className="text-muted text-sm">
                    No reasoning was generated for this store yet.
                  </p>
                ) : (
                  <ul className="forecast-reasons">
                    {detailForecast.rationale.map(reason => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button-primary"
                onClick={() => setDetailStoreName(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
