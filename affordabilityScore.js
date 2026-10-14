// affordabilityScore.js
// Produces a 0-100 affordability score from three weighted factors:
//   1. Budget fit        (60 pts) — is the cost within budget, with a
//                                    healthy but not wasteful cushion?
//   2. Emergency buffer   (20 pts) — does the buffer meet the recommended
//                                    10% of trip cost?
//   3. Duration risk      (20 pts) — longer trips carry more estimation
//                                    risk, so they're scored slightly lower.

export function calculateAffordabilityScore({ totalBudget, estimatedCost, emergencyBuffer, days }) {
  if (totalBudget <= 0) return 0;

  const remaining = totalBudget - estimatedCost;
  const remainingRatio = remaining / totalBudget; // negative if over budget

  // 1. Budget fit — sweet spot is ~15% leftover (comfortable, not wasteful).
  let budgetFitScore;
  if (remainingRatio >= 0) {
    const distanceFromSweetSpot = Math.abs(remainingRatio - 0.15);
    budgetFitScore = 60 - Math.min(20, distanceFromSweetSpot * 60);
  } else {
    // Over budget: score falls fast as the overage grows.
    budgetFitScore = Math.max(0, 60 + remainingRatio * 150);
  }

  // 2. Emergency buffer adequacy.
  const recommendedBuffer = estimatedCost * 0.1;
  const bufferScore = recommendedBuffer > 0
    ? Math.min(20, (emergencyBuffer / recommendedBuffer) * 20)
    : 20;

  // 3. Trip duration risk.
  let durationScore = 20;
  if (days > 7) durationScore = 12;
  if (days > 14) durationScore = 6;

  const total = Math.round(budgetFitScore + bufferScore + durationScore);
  return Math.max(0, Math.min(100, total));
}

export function getAffordabilityLabel(score) {
  if (score >= 75) return { label: 'Affordable', emoji: '🟢', color: 'green' };
  if (score >= 45) return { label: 'Tight — plan carefully', emoji: '🟡', color: 'yellow' };
  return { label: 'Risky / Not affordable', emoji: '🔴', color: 'red' };
}
