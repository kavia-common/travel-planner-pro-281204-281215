/**
 * Minimal API client for the Travel Planner backend.
 *
 * Uses REACT_APP_BACKEND_URL (Create React App convention). If not provided,
 * it uses an empty base (same-origin).
 */

const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message = (data && data.detail) ? data.detail : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export async function healthCheck() {
  /** Check backend health. */
  return request("/", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createUser(payload) {
  /** Create a user: {email, full_name}. */
  return request("/users", { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listUsers() {
  /** List users. */
  return request("/users", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createTrip(payload) {
  /** Create a trip: {user_id, name, start_date?, end_date?}. */
  return request("/trips", { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listTrips(userId) {
  /** List trips; optionally filtered by user_id. */
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  return request(`/trips${qs}`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function getTrip(tripId) {
  /** Get a single trip. */
  return request(`/trips/${tripId}`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function addDestination(tripId, payload) {
  /** Add destination to trip. */
  return request(`/trips/${tripId}/destinations`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listDestinations(tripId) {
  /** List destinations for trip. */
  return request(`/trips/${tripId}/destinations`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createItineraryDay(tripId, payload) {
  /** Create itinerary day: {day_date, title?, summary?}. */
  return request(`/trips/${tripId}/itinerary/days`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listItineraryDays(tripId) {
  /** List itinerary days. */
  return request(`/trips/${tripId}/itinerary/days`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createAccommodation(tripId, payload) {
  /** Create accommodation. */
  return request(`/trips/${tripId}/accommodations`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listAccommodations(tripId) {
  /** List accommodations. */
  return request(`/trips/${tripId}/accommodations`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createActivity(tripId, payload) {
  /** Create activity. */
  return request(`/trips/${tripId}/activities`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listActivities(tripId) {
  /** List activities. */
  return request(`/trips/${tripId}/activities`, { method: "GET" });
}

/**
 * -----------------------
 * Budget Tracker
 * -----------------------
 */

// PUBLIC_INTERFACE
export async function listBudgetCategories(tripId) {
  /** List budget categories for a trip. */
  return request(`/trips/${tripId}/budget/categories`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createBudgetCategory(tripId, payload) {
  /** Create a budget category: {name, planned_amount, color?}. */
  return request(`/trips/${tripId}/budget/categories`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function updateBudgetCategory(tripId, categoryId, payload) {
  /** Update a budget category: {name?, planned_amount?, color?}. */
  return request(`/trips/${tripId}/budget/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function deleteBudgetCategory(tripId, categoryId) {
  /** Delete a budget category. */
  return request(`/trips/${tripId}/budget/categories/${categoryId}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export async function listBudgetExpenses(tripId) {
  /** List budget expenses for a trip. */
  return request(`/trips/${tripId}/budget/expenses`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createBudgetExpense(tripId, payload) {
  /** Create a budget expense: {category_id?, amount, spent_on?, description?}. */
  return request(`/trips/${tripId}/budget/expenses`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function deleteBudgetExpense(tripId, expenseId) {
  /** Delete a budget expense. */
  return request(`/trips/${tripId}/budget/expenses/${expenseId}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export async function getBudgetSummary(tripId) {
  /** Get budget summary for a trip (planned vs actual, by category + totals). */
  return request(`/trips/${tripId}/budget/summary`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createNote(tripId, payload) {
  /** Create note. */
  return request(`/trips/${tripId}/notes`, { method: "POST", body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function listNotes(tripId) {
  /** List notes. */
  return request(`/trips/${tripId}/notes`, { method: "GET" });
}
