// costCalculator.js
// Pure functions — no React, no side effects. Easy to test in the console
// and reuse for both the initial 3-plan render and the "Make It Affordable"
// live recompute.

export const PETROL_PRICE_PER_LITER = 2.05; // RON95, RM/litre
export const FUEL_CONSUMPTION_L_PER_100KM = 7; // average compact car

// Maps each of the 3 headline plans to a cost tier and a preferred transport mode.
export const PLAN_TIERS = {
  cheapest: 'budget',
  balanced: 'midrange',
  comfortable: 'comfort',
};

export const TRANSPORT_BY_PLAN = {
  cheapest: 'bus',
  balanced: 'train', // falls back to 'carpool' if the route has no train
  comfortable: 'car',
};

function calculateCarCost(route) {
  const distanceRoundTrip = route.distanceKm * 2;
  const fuelCost = (distanceRoundTrip / 100) * FUEL_CONSUMPTION_L_PER_100KM * PETROL_PRICE_PER_LITER;
  const tollCost = route.tollCost * 2; // round trip
  return {
    total: fuelCost + tollCost,
    fuelCost,
    tollCost,
  };
}

export function getTransportCost(route, travellers, mode) {
  switch (mode) {
    case 'bus':
      return route.busCostPerPerson != null ? route.busCostPerPerson * travellers : null;
    case 'train':
      return route.trainCostPerPerson != null ? route.trainCostPerPerson * travellers : null;
    case 'car':
    case 'carpool':
      return calculateCarCost(route).total;
    default:
      return null;
  }
}

// Picks a real transport mode for a plan, falling back sensibly when a
// route has no train (e.g. Melaka, JB).
export function resolveTransportMode(route, plan) {
  const preferred = TRANSPORT_BY_PLAN[plan];
  if (preferred === 'train' && route.trainCostPerPerson == null) {
    return 'carpool';
  }
  return preferred;
}

/**
 * Calculates a full cost breakdown for one plan.
 * `overrides` lets "Make It Affordable" nudge tier/mode without
 * duplicating this function — same engine, different inputs.
 */
export function calculateTripCost({ route, days, travellers, plan, overrides = {} }) {
  const tier = overrides.tier || PLAN_TIERS[plan];
  const mode = overrides.mode || resolveTransportMode(route, plan);

  const transportCost = getTransportCost(route, travellers, mode) ?? 0;

  const rooms = Math.max(1, Math.ceil(travellers / 2)); // assume 2 pax/room
  const nights = Math.max(1, days - 1);
  const accommodationCost = route.accommodation[tier] * rooms * nights;

  const foodCost = route.foodPerDayPerPerson[tier] * travellers * days;
  const activitiesCost = route.activitiesPerDay[tier] * travellers * days;

  const subtotal = transportCost + accommodationCost + foodCost + activitiesCost;
  const emergencyBuffer = Math.round(subtotal * 0.1); // flat 10% buffer

  const totalCost = Math.round(subtotal + emergencyBuffer);

  return {
    plan,
    mode,
    tier,
    transportCost: Math.round(transportCost),
    accommodationCost: Math.round(accommodationCost),
    foodCost: Math.round(foodCost),
    activitiesCost: Math.round(activitiesCost),
    emergencyBuffer,
    totalCost,
  };
}

export function calculateAllPlans({ route, days, travellers }) {
  return {
    cheapest: calculateTripCost({ route, days, travellers, plan: 'cheapest' }),
    balanced: calculateTripCost({ route, days, travellers, plan: 'balanced' }),
    comfortable: calculateTripCost({ route, days, travellers, plan: 'comfortable' }),
  };
}

/**
 * Generates "Make It Affordable" suggestions for a given plan.
 * Each suggestion carries an `apply()` function that returns a new params
 * object — feed that straight back into calculateTripCost() to get the
 * live-updated total. This keeps savings numbers always accurate instead
 * of hardcoded guesses.
 */
export function generateSuggestions({ route, days, travellers, plan, currentBreakdown }) {
  const suggestions = [];
  const base = { route, days, travellers, plan };

  // 1. Downgrade transport to bus
  if (currentBreakdown.mode === 'car' || currentBreakdown.mode === 'carpool') {
    const busCost = getTransportCost(route, travellers, 'bus');
    if (busCost != null && busCost < currentBreakdown.transportCost) {
      suggestions.push({
        id: 'switch-to-bus',
        label: 'Switch from car to bus',
        apply: (params) => ({ ...params, overrides: { ...params.overrides, mode: 'bus' } }),
        estimatedSaving: Math.round(currentBreakdown.transportCost - busCost),
      });
    }
  }

  // 2. Add a traveller to split fuel/tolls
  if (currentBreakdown.mode === 'car' || currentBreakdown.mode === 'carpool') {
    const before = calculateTripCost({ ...base, overrides: { mode: currentBreakdown.mode } });
    const after = calculateTripCost({ ...base, travellers: travellers + 1, overrides: { mode: currentBreakdown.mode } });
    suggestions.push({
      id: 'add-traveller',
      label: 'Travel with 1 more person to split fuel & tolls',
      apply: (params) => ({ ...params, travellers: params.travellers + 1 }),
      estimatedSaving: Math.round(before.transportCost - (after.transportCost * travellers) / (travellers + 1)),
    });
  }

  // 3. Shorten the trip by 1 day
  if (days > 1) {
    const shorter = calculateTripCost({ ...base, days: days - 1 });
    suggestions.push({
      id: 'reduce-days',
      label: `Shorten trip from ${days} to ${days - 1} day(s)`,
      apply: (params) => ({ ...params, days: params.days - 1 }),
      estimatedSaving: currentBreakdown.totalCost - shorter.totalCost,
    });
  }

  // 4. Downgrade accommodation/food/activities tier
  const tiers = ['comfort', 'midrange', 'budget'];
  const currentTierIndex = tiers.indexOf(currentBreakdown.tier);
  if (currentTierIndex < tiers.length - 1) {
    const cheaperTier = tiers[currentTierIndex + 1];
    const cheaper = calculateTripCost({ ...base, overrides: { tier: cheaperTier, mode: currentBreakdown.mode } });
    suggestions.push({
      id: 'downgrade-tier',
      label: 'Choose a cheaper accommodation, food & activity tier',
      apply: (params) => ({ ...params, overrides: { ...params.overrides, tier: cheaperTier } }),
      estimatedSaving: currentBreakdown.totalCost - cheaper.totalCost,
    });
  }

  return suggestions.filter((s) => s.estimatedSaving > 0);
}
