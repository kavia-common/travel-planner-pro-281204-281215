import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import {
  addDestination,
  createActivity,
  createAccommodation,
  createBudgetCategory,
  createBudgetExpense,
  createItineraryDay,
  createNote,
  createTrip,
  createUser,
  deleteBudgetCategory,
  deleteBudgetExpense,
  getBudgetSummary,
  healthCheck,
  listActivities,
  listAccommodations,
  listBudgetCategories,
  listBudgetExpenses,
  listDestinations,
  listItineraryDays,
  listNotes,
  listTrips,
  updateBudgetCategory
} from "./api/client";

function formatDate(d) {
  if (!d) return "—";
  return String(d);
}

function Sidebar({ user, trips }) {
  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <div className="brand">
        <div className="brandTitle">Travel Planner</div>
        <div className="brandSub">Plan trips, build itineraries, track details.</div>
      </div>

      <div className="card" style={{ boxShadow: "none" }}>
        <div className="sectionTitle">Current user</div>
        <div className="small">{user ? user.email : "Not set"}</div>
        <div className="small">{user ? user.full_name : "—"}</div>
      </div>

      <nav className="nav" aria-label="Primary navigation">
        <NavLink to="/" className={({ isActive }) => `navLink ${isActive ? "navLinkActive" : ""}`}>
          Dashboard <span className="badge">{trips.length}</span>
        </NavLink>
      </nav>

      <div style={{ marginTop: 14 }} className="small">
        Backend: <code>{process.env.REACT_APP_BACKEND_URL || "(same origin)"}</code>
      </div>
    </aside>
  );
}

function Dashboard({ user, onCreateTrip }) {
  const [tripName, setTripName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <div className="stack">
      <div className="headerRow">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="p">Create a trip, then add destinations, itinerary days, activities, stays, and notes.</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="sectionTitle">Create a trip</div>
          {!user ? (
            <div className="errorBox">Create/select a user first.</div>
          ) : (
            <div className="stack">
              <div className="row">
                <input
                  className="input"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="Trip name (e.g., Italy Summer 2026)"
                  aria-label="Trip name"
                />
              </div>
              <div className="row">
                <input
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date (YYYY-MM-DD)"
                  aria-label="Start date"
                />
                <input
                  className="input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date (YYYY-MM-DD)"
                  aria-label="End date"
                />
              </div>
              <div className="row">
                <button
                  className="btn btnPrimary"
                  onClick={() => onCreateTrip({ name: tripName, start_date: startDate || null, end_date: endDate || null })}
                  disabled={!tripName.trim()}
                >
                  Create trip
                </button>
                <span className="small">You’ll be redirected to the trip details.</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="sectionTitle">Quick tips</div>
          <div className="small">
            <ul style={{ marginTop: 8 }}>
              <li>Add destinations in order (sort order).</li>
              <li>Create itinerary days by date.</li>
              <li>Attach activities and accommodations to a trip.</li>
              <li>Use notes for packing lists, confirmations, and ideas.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripsList({ trips }) {
  const nav = useNavigate();
  return (
    <div className="card">
      <div className="headerRow" style={{ marginBottom: 8 }}>
        <div>
          <div className="sectionTitle">Your trips</div>
          <div className="small">Open a trip to manage itinerary, accommodations, activities, and notes.</div>
        </div>
      </div>

      <div className="list" role="list">
        {trips.length === 0 ? (
          <div className="small">No trips yet.</div>
        ) : (
          trips.map((t) => (
            <div key={t.id} className="listItem" role="listitem">
              <div>
                <div className="listItemTitle">{t.name}</div>
                <div className="meta">
                  <span>Start: {formatDate(t.start_date)}</span>
                  <span>End: {formatDate(t.end_date)}</span>
                </div>
              </div>
              <div className="row">
                <button className="btn btnPrimary" onClick={() => nav(`/trips/${t.id}`)}>
                  Open
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function money(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(v));
}

function TripDetail({ reloadToken }) {
  const { tripId } = useParams();
  const [error, setError] = useState("");
  const [trip, setTrip] = useState(null);

  const [destinations, setDestinations] = useState([]);
  const [days, setDays] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState([]);

  // Budget tracker state
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [budgetExpenses, setBudgetExpenses] = useState([]);

  // forms
  const [destName, setDestName] = useState("");
  const [destCountry, setDestCountry] = useState("");
  const [destOrder, setDestOrder] = useState("0");

  const [dayDate, setDayDate] = useState("");
  const [dayTitle, setDayTitle] = useState("");

  const [accName, setAccName] = useState("");
  const [actName, setActName] = useState("");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Budget forms
  const [catName, setCatName] = useState("");
  const [catPlanned, setCatPlanned] = useState("");
  const [expCategoryId, setExpCategoryId] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expSpentOn, setExpSpentOn] = useState("");
  const [expDesc, setExpDesc] = useState("");

  async function loadBudget() {
    try {
      setBudgetLoading(true);
      const [cats, exps, summary] = await Promise.all([
        listBudgetCategories(tripId),
        listBudgetExpenses(tripId),
        getBudgetSummary(tripId)
      ]);
      setBudgetCategories(cats);
      setBudgetExpenses(exps);
      setBudgetSummary(summary);
    } finally {
      setBudgetLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setError("");
      try {
        const t = await (await import("./api/client")).getTrip(tripId);
        const [dests, ds, accs, acts, ns] = await Promise.all([
          listDestinations(tripId),
          listItineraryDays(tripId),
          listAccommodations(tripId),
          listActivities(tripId),
          listNotes(tripId)
        ]);
        if (!mounted) return;
        setTrip(t);
        setDestinations(dests);
        setDays(ds);
        setAccommodations(accs);
        setActivities(acts);
        setNotes(ns);
      } catch (e) {
        setError(e.message || "Failed to load trip");
      }

      // Budget is optional: if backend hasn't been updated yet, we show a friendly error.
      try {
        await loadBudget();
      } catch (e) {
        if (!mounted) return;
        // Keep this separate from main error so other trip features still work.
        setBudgetSummary(null);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [tripId, reloadToken]);

  const totals = useMemo(() => {
    const plannedTotal = Number(budgetSummary?.totals?.planned_total ?? 0);
    const actualTotal = Number(budgetSummary?.totals?.actual_total ?? 0);
    const remaining = plannedTotal - actualTotal;
    const pct = plannedTotal > 0 ? Math.min(1, Math.max(0, actualTotal / plannedTotal)) : 0;
    return { plannedTotal, actualTotal, remaining, pct };
  }, [budgetSummary]);

  return (
    <div className="stack">
      <div className="headerRow">
        <div>
          <h1 className="h1">{trip ? trip.name : "Trip"}</h1>
          <p className="p">
            {trip ? `Dates: ${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}` : "Loading..."}
          </p>
        </div>
      </div>

      {error ? <div className="errorBox">{error}</div> : null}

      <div className="card">
        <div className="headerRow" style={{ marginBottom: 10 }}>
          <div>
            <div className="sectionTitle">Budget tracker</div>
            <div className="small">Plan category budgets and log expenses (planned vs actual).</div>
          </div>
          <div className="row">
            <button
              className="btn"
              onClick={async () => {
                try {
                  setError("");
                  await loadBudget();
                } catch (e) {
                  setError(e.message || "Failed to refresh budget");
                }
              }}
              disabled={budgetLoading}
            >
              Refresh
            </button>
          </div>
        </div>

        {!budgetSummary ? (
          <div className="small">
            Budget endpoints not available yet (backend/DB not updated). Once backend is updated, this section will populate.
          </div>
        ) : (
          <div className="stack">
            <div className="grid3">
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="sectionTitle">Planned</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{money(totals.plannedTotal)}</div>
                <div className="small">Total planned across categories</div>
              </div>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="sectionTitle">Actual</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{money(totals.actualTotal)}</div>
                <div className="small">Sum of logged expenses</div>
              </div>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="sectionTitle">Remaining</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: totals.remaining < 0 ? "var(--danger)" : "inherit" }}>
                  {money(totals.remaining)}
                </div>
                <div className="small">{totals.remaining < 0 ? "Over budget" : "Under budget"}</div>
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div className="small">Spend progress</div>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(100, 116, 139, 0.15)",
                overflow: "hidden",
                border: "1px solid var(--border)"
              }}
              aria-label="Budget progress"
              role="progressbar"
              aria-valuenow={Math.round(totals.pct * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${Math.round(totals.pct * 100)}%`,
                  height: "100%",
                  background: totals.remaining < 0 ? "rgba(239, 68, 68, 0.8)" : "rgba(59, 130, 246, 0.8)"
                }}
              />
            </div>

            <div className="grid2" style={{ marginTop: 14 }}>
              <div className="card" style={{ boxShadow: "none" }}>
                <div className="sectionTitle">Categories (planned)</div>
                <div className="stack">
                  <div className="row">
                    <input
                      className="input"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="Category (e.g., Food)"
                      aria-label="Budget category name"
                    />
                    <input
                      className="input"
                      value={catPlanned}
                      onChange={(e) => setCatPlanned(e.target.value)}
                      placeholder="Planned (e.g., 500)"
                      aria-label="Planned amount"
                    />
                    <button
                      className="btn btnPrimary"
                      disabled={!catName.trim() || !String(catPlanned).trim()}
                      onClick={async () => {
                        try {
                          setError("");
                          await createBudgetCategory(tripId, { name: catName.trim(), planned_amount: Number(catPlanned) });
                          setCatName("");
                          setCatPlanned("");
                          await loadBudget();
                        } catch (e) {
                          setError(e.message || "Failed to create category");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="list">
                    {(budgetSummary.by_category || []).map((c) => (
                      <div key={c.id} className="listItem">
                        <div>
                          <div className="listItemTitle">{c.name}</div>
                          <div className="meta">
                            <span>Planned: {money(c.planned_amount)}</span>
                            <span>Actual: {money(c.actual_amount)}</span>
                            <span style={{ color: Number(c.remaining_amount) < 0 ? "var(--danger)" : "inherit" }}>
                              Remaining: {money(c.remaining_amount)}
                            </span>
                          </div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={async () => {
                              const newPlanned = window.prompt("New planned amount", String(c.planned_amount ?? ""));
                              if (newPlanned === null) return;
                              try {
                                setError("");
                                await updateBudgetCategory(tripId, c.id, { planned_amount: Number(newPlanned) });
                                await loadBudget();
                              } catch (e) {
                                setError(e.message || "Failed to update category");
                              }
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn"
                            onClick={async () => {
                              if (!window.confirm("Delete category? Expenses will be kept but become uncategorized.")) return;
                              try {
                                setError("");
                                await deleteBudgetCategory(tripId, c.id);
                                await loadBudget();
                              } catch (e) {
                                setError(e.message || "Failed to delete category");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {(budgetSummary.by_category || []).length === 0 ? <div className="small">No categories yet.</div> : null}
                  </div>
                </div>
              </div>

              <div className="card" style={{ boxShadow: "none" }}>
                <div className="sectionTitle">Expenses (actual)</div>
                <div className="stack">
                  <div className="row">
                    <select
                      className="input"
                      value={expCategoryId}
                      onChange={(e) => setExpCategoryId(e.target.value)}
                      aria-label="Expense category"
                    >
                      <option value="">Uncategorized</option>
                      {budgetCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="Amount (e.g., 42.50)"
                      aria-label="Expense amount"
                    />
                  </div>

                  <div className="row">
                    <input
                      className="input"
                      value={expSpentOn}
                      onChange={(e) => setExpSpentOn(e.target.value)}
                      placeholder="Date (YYYY-MM-DD, optional)"
                      aria-label="Spent on date"
                    />
                    <input
                      className="input"
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="Description (optional)"
                      aria-label="Expense description"
                    />
                  </div>

                  <div className="row">
                    <button
                      className="btn btnPrimary"
                      disabled={!String(expAmount).trim()}
                      onClick={async () => {
                        try {
                          setError("");
                          await createBudgetExpense(tripId, {
                            category_id: expCategoryId || null,
                            amount: Number(expAmount),
                            spent_on: expSpentOn || null,
                            description: expDesc || null
                          });
                          setExpAmount("");
                          setExpSpentOn("");
                          setExpDesc("");
                          setExpCategoryId("");
                          await loadBudget();
                        } catch (e) {
                          setError(e.message || "Failed to add expense");
                        }
                      }}
                    >
                      Add expense
                    </button>
                    <span className="small">Tip: leave category empty to log later.</span>
                  </div>

                  <div className="list">
                    {budgetExpenses.map((e) => (
                      <div key={e.id} className="listItem">
                        <div>
                          <div className="listItemTitle">{money(e.amount)}</div>
                          <div className="meta">
                            <span>{e.spent_on ? String(e.spent_on) : "—"}</span>
                            <span>{e.category_name || "Uncategorized"}</span>
                            <span>{e.description || "—"}</span>
                          </div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={async () => {
                              if (!window.confirm("Delete expense?")) return;
                              try {
                                setError("");
                                await deleteBudgetExpense(tripId, e.id);
                                await loadBudget();
                              } catch (er) {
                                setError(er.message || "Failed to delete expense");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {budgetExpenses.length === 0 ? <div className="small">No expenses yet.</div> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid3">
        <div className="card">
          <div className="sectionTitle">Destinations</div>
          <div className="stack">
            <input className="input" value={destName} onChange={(e) => setDestName(e.target.value)} placeholder="Name (e.g., Kyoto)" />
            <input className="input" value={destCountry} onChange={(e) => setDestCountry(e.target.value)} placeholder="Country (optional)" />
            <input className="input" value={destOrder} onChange={(e) => setDestOrder(e.target.value)} placeholder="Sort order (0,1,2...)" />
            <button
              className="btn btnPrimary"
              disabled={!destName.trim()}
              onClick={async () => {
                try {
                  setError("");
                  await addDestination(tripId, {
                    name: destName,
                    country: destCountry || null,
                    sort_order: Number(destOrder || 0)
                  });
                  setDestName("");
                  setDestCountry("");
                  setDestOrder("0");
                  setDestinations(await listDestinations(tripId));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Add destination
            </button>

            <div className="list">
              {destinations.map((d) => (
                <div key={d.id} className="listItem">
                  <div>
                    <div className="listItemTitle">{d.name}</div>
                    <div className="meta">
                      <span>{d.country || "—"}</span>
                      <span>Order: {d.sort_order}</span>
                    </div>
                  </div>
                </div>
              ))}
              {destinations.length === 0 ? <div className="small">No destinations yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sectionTitle">Itinerary days</div>
          <div className="stack">
            <input className="input" value={dayDate} onChange={(e) => setDayDate(e.target.value)} placeholder="Date (YYYY-MM-DD)" />
            <input className="input" value={dayTitle} onChange={(e) => setDayTitle(e.target.value)} placeholder="Title (optional)" />
            <button
              className="btn btnPrimary"
              disabled={!dayDate.trim()}
              onClick={async () => {
                try {
                  setError("");
                  await createItineraryDay(tripId, { day_date: dayDate, title: dayTitle || null, summary: null });
                  setDayDate("");
                  setDayTitle("");
                  setDays(await listItineraryDays(tripId));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Add day
            </button>

            <div className="list">
              {days.map((d) => (
                <div key={d.id} className="listItem">
                  <div>
                    <div className="listItemTitle">{formatDate(d.day_date)}</div>
                    <div className="meta">
                      <span>{d.title || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
              {days.length === 0 ? <div className="small">No itinerary days yet.</div> : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sectionTitle">Quick add</div>
          <div className="stack">
            <input className="input" value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Accommodation name" />
            <button
              className="btn btnPrimary"
              disabled={!accName.trim()}
              onClick={async () => {
                try {
                  setError("");
                  await createAccommodation(tripId, { name: accName, destination_id: null });
                  setAccName("");
                  setAccommodations(await listAccommodations(tripId));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Add accommodation
            </button>

            <input className="input" value={actName} onChange={(e) => setActName(e.target.value)} placeholder="Activity name" />
            <button
              className="btn btnPrimary"
              disabled={!actName.trim()}
              onClick={async () => {
                try {
                  setError("");
                  await createActivity(tripId, { name: actName, destination_id: null, day_id: null });
                  setActName("");
                  setActivities(await listActivities(tripId));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Add activity
            </button>

            <input className="input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title (optional)" />
            <textarea className="textarea" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Note content" />
            <button
              className="btn btnPrimary"
              disabled={!noteContent.trim()}
              onClick={async () => {
                try {
                  setError("");
                  await createNote(tripId, { title: noteTitle || null, content: noteContent, destination_id: null, day_id: null });
                  setNoteTitle("");
                  setNoteContent("");
                  setNotes(await listNotes(tripId));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Add note
            </button>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="sectionTitle">Accommodations</div>
          <div className="list">
            {accommodations.map((a) => (
              <div key={a.id} className="listItem">
                <div>
                  <div className="listItemTitle">{a.name}</div>
                  <div className="meta">
                    <span>{a.address || "—"}</span>
                    <span>Check-in: {a.check_in ? String(a.check_in) : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
            {accommodations.length === 0 ? <div className="small">No accommodations yet.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="sectionTitle">Activities</div>
          <div className="list">
            {activities.map((a) => (
              <div key={a.id} className="listItem">
                <div>
                  <div className="listItemTitle">{a.name}</div>
                  <div className="meta">
                    <span>{a.location || "—"}</span>
                    <span>Start: {a.start_time ? String(a.start_time) : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 ? <div className="small">No activities yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="sectionTitle">Notes</div>
        <div className="list">
          {notes.map((n) => (
            <div key={n.id} className="listItem">
              <div>
                <div className="listItemTitle">{n.title || "Note"}</div>
                <div className="meta">
                  <span>{(n.content || "").slice(0, 120)}{(n.content || "").length > 120 ? "…" : ""}</span>
                </div>
              </div>
            </div>
          ))}
          {notes.length === 0 ? <div className="small">No notes yet.</div> : null}
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main Travel Planner application shell. */
  const [backendOk, setBackendOk] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  const nav = useNavigate();

  const defaultUserPayload = useMemo(() => {
    // Simple template: create a deterministic local user identity.
    return { email: "demo.user@travelplanner.local", full_name: "Demo User" };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setError("");
      try {
        await healthCheck();
        if (!mounted) return;
        setBackendOk(true);
      } catch (e) {
        setBackendOk(false);
        setError(`Backend not reachable: ${e.message}`);
      }

      // ensure user exists (idempotent)
      try {
        const created = await createUser(defaultUserPayload);
        if (!mounted) return;
        setUser(created);
      } catch (e) {
        // if conflict, list users and pick by email
        try {
          const users = await (await import("./api/client")).listUsers();
          const found = users.find((u) => u.email === defaultUserPayload.email);
          if (found) setUser(found);
        } catch (e2) {
          setError(e2.message || e.message);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [defaultUserPayload]);

  useEffect(() => {
    let mounted = true;
    async function loadTrips() {
      if (!user) return;
      try {
        const t = await listTrips(user.id);
        if (!mounted) return;
        setTrips(t);
      } catch (e) {
        setError(e.message);
      }
    }
    loadTrips();
    return () => {
      mounted = false;
    };
  }, [user, reloadToken]);

  async function onCreateTrip({ name, start_date, end_date }) {
    try {
      setError("");
      const trip = await createTrip({
        user_id: user.id,
        name,
        start_date,
        end_date
      });
      setReloadToken((x) => x + 1);
      nav(`/trips/${trip.id}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="appShell">
      <Sidebar user={user} trips={trips} />
      <main className="main">
        {!backendOk ? <div className="errorBox">{error || "Backend not reachable yet."}</div> : null}
        {error && backendOk ? <div className="errorBox">{error}</div> : null}

        <Routes>
          <Route
            path="/"
            element={
              <div className="stack">
                <Dashboard user={user} onCreateTrip={onCreateTrip} />
                <TripsList trips={trips} />
              </div>
            }
          />
          <Route path="/trips/:tripId" element={<TripDetail reloadToken={reloadToken} />} />
        </Routes>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function AppWithRouter() {
  /** App exported with BrowserRouter wrapper. */
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
