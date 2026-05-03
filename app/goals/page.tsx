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

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  dueDate: string;
  notes: string;
};

type GoalDraft = {
  name: string;
  target: number | "";
  current: number | "";
  dueDate: string;
  notes: string;
};

export default function GoalsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalForm, setGoalForm] = useState<GoalDraft>({
    name: "",
    target: "",
    current: "",
    dueDate: "",
    notes: "",
  });
  const [editingGoalIndex, setEditingGoalIndex] = useState<
    number | null
  >(null);
  const [goalEdit, setGoalEdit] = useState<GoalDraft | null>(null);
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

    const savedGoals = localStorage.getItem("suitebread-goals");
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals) as Goal[];
      setGoals(
        parsed.map(goal => ({
          id: goal.id ?? `${Date.now()}`,
          name: goal.name ?? "",
          target: Number(goal.target ?? 0),
          current: Number(goal.current ?? 0),
          dueDate: goal.dueDate ?? "",
          notes: goal.notes ?? "",
        }))
      );
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("suitebread-goals", JSON.stringify(goals));
  }, [goals, isHydrated]);

  const unpaidRevenue = sales
    .filter(s => s.delivered && !s.paid)
    .reduce((sum, s) => sum + s.qty * s.price, 0);
  const outstandingCount = sales.filter(
    s => s.delivered && !s.paid
  ).length;

  const addGoal = () => {
    if (!goalForm.name) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const next: Goal = {
      id,
      name: goalForm.name,
      target: Number(goalForm.target || 0),
      current: Number(goalForm.current || 0),
      dueDate: goalForm.dueDate,
      notes: goalForm.notes,
    };
    setGoals([next, ...goals]);
    setGoalForm({
      name: "",
      target: "",
      current: "",
      dueDate: "",
      notes: "",
    });
  };

  const startEditGoal = (index: number) => {
    const goal = goals[index];
    setEditingGoalIndex(index);
    setGoalEdit({
      name: goal.name,
      target: goal.target,
      current: goal.current,
      dueDate: goal.dueDate,
      notes: goal.notes,
    });
  };

  const cancelEditGoal = () => {
    setEditingGoalIndex(null);
    setGoalEdit(null);
  };

  const saveEditGoal = () => {
    if (editingGoalIndex === null || !goalEdit?.name) return;
    const next: Goal = {
      id: goals[editingGoalIndex].id,
      name: goalEdit.name,
      target: Number(goalEdit.target || 0),
      current: Number(goalEdit.current || 0),
      dueDate: goalEdit.dueDate,
      notes: goalEdit.notes,
    };
    setGoals(
      goals.map((goal, i) =>
        i === editingGoalIndex ? next : goal
      )
    );
    cancelEditGoal();
  };

  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalCurrent = goals.reduce(
    (sum, goal) => sum + goal.current,
    0
  );
  const overallProgress =
    totalTarget > 0
      ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100))
      : 0;
  const completedGoals = goals.filter(
    goal => goal.target > 0 && goal.current >= goal.target
  ).length;
  const isEditingGoal =
    editingGoalIndex !== null && goalEdit !== null;

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
              <p className="eyebrow">Goals</p>
              <h1 className="font-display text-3xl sm:text-4xl">
                Goal Tracker
              </h1>
              <p className="text-muted mt-2 text-sm sm:text-base">
                Set targets for revenue, production, or partnerships.
              </p>
            </div>
            <div className="topbar-meta">
              <div className="chip">{goals.length} goals</div>
              <div className="chip">
                {completedGoals} complete
              </div>
              <div className="chip">
                Overall {overallProgress}%
              </div>
            </div>
          </header>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Add Goal</h2>
                <p className="text-muted text-sm">
                  Track progress with a target and current value.
                </p>
              </div>
              <span className="badge">Entry</span>
            </div>

            <div className="form-grid">
              <input
                placeholder="Goal name"
                value={goalForm.name}
                onChange={e =>
                  setGoalForm({ ...goalForm, name: e.target.value })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Target value"
                value={goalForm.target}
                onChange={e =>
                  setGoalForm({
                    ...goalForm,
                    target:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="number"
                placeholder="Current value"
                value={goalForm.current}
                onChange={e =>
                  setGoalForm({
                    ...goalForm,
                    current:
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value),
                  })
                }
                className="input-field w-full"
              />

              <input
                type="date"
                value={goalForm.dueDate}
                onChange={e =>
                  setGoalForm({
                    ...goalForm,
                    dueDate: e.target.value,
                  })
                }
                className="input-field w-full"
              />

              <input
                placeholder="Notes (optional)"
                value={goalForm.notes}
                onChange={e =>
                  setGoalForm({ ...goalForm, notes: e.target.value })
                }
                className="input-field w-full sm:col-span-2"
              />

              <button
                type="button"
                onClick={addGoal}
                className="button-primary sm:col-span-2"
              >
                Add Goal
              </button>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <h2 className="section-title">Goal List</h2>
                <p className="text-muted text-sm">
                  Monitor progress across active goals.
                </p>
              </div>
              <span className="badge">{goals.length} total</span>
            </div>

            {goals.length === 0 ? (
              <div className="empty-state">No goals added yet.</div>
            ) : (
              <div className="table-shell">
                <table className="w-full text-sm">
                  <thead className="bg-[rgba(210,180,140,0.35)] text-left">
                    <tr>
                      <th className="px-4 py-3">Goal</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal, i) => {
                      const progress =
                        goal.target > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (goal.current / goal.target) * 100
                              )
                            )
                          : 0;
                      const isComplete =
                        goal.target > 0 && goal.current >= goal.target;
                      return (
                        <tr key={goal.id} className="table-row">
                          <td className="px-4 py-3">
                            <div className="row-edit-cell">
                              <span>{goal.name}</span>
                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Edit ${goal.name}`}
                                onClick={() => startEditGoal(i)}
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
                            {goal.target
                              ? goal.target.toLocaleString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs text-muted">
                                <span>
                                  {goal.current.toLocaleString()} /{" "}
                                  {goal.target.toLocaleString()}
                                </span>
                                <span>{progress}%</span>
                              </div>
                              <div className="progress-track">
                                <div
                                  className="progress-fill alt"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span
                                className={`status-pill ${
                                  isComplete ? "status-pill-on" : ""
                                }`}
                              >
                                {isComplete
                                  ? "Complete"
                                  : "In progress"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {goal.dueDate
                              ? new Date(
                                  goal.dueDate
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3">{goal.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {isEditingGoal && goalEdit && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-goal-title"
          onClick={cancelEditGoal}
        >
          <div
            className="modal-card"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Goal</p>
                <h3
                  id="edit-goal-title"
                  className="font-display text-2xl"
                >
                  {goalEdit.name || "Goal details"}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close dialog"
                onClick={cancelEditGoal}
              >
                ✕
              </button>
            </div>

            <div className="form-grid">
              <input
                placeholder="Goal name"
                value={goalEdit.name}
                onChange={e =>
                  setGoalEdit(prev =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
                className="input-field w-full span-2"
              />

              <input
                type="number"
                placeholder="Target value"
                value={goalEdit.target}
                onChange={e =>
                  setGoalEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          target:
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
                placeholder="Current value"
                value={goalEdit.current}
                onChange={e =>
                  setGoalEdit(prev =>
                    prev
                      ? {
                          ...prev,
                          current:
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
                type="date"
                value={goalEdit.dueDate}
                onChange={e =>
                  setGoalEdit(prev =>
                    prev
                      ? { ...prev, dueDate: e.target.value }
                      : prev
                  )
                }
                className="input-field w-full"
              />

              <input
                placeholder="Notes (optional)"
                value={goalEdit.notes}
                onChange={e =>
                  setGoalEdit(prev =>
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
                onClick={cancelEditGoal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={saveEditGoal}
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
