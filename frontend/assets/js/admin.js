document.addEventListener("DOMContentLoaded", () => {
  TraitTracker.buildBar(TraitTracker.qs("#adminTraitChart"), { openness: 72, conscientiousness: 76, extraversion: 63, agreeableness: 80, neuroticism: 42 }, "Platform average");
  TraitTracker.buildLine(TraitTracker.qs("#adminTrendChart"));

  const roleForm = TraitTracker.qs("#roleForm");
  roleForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!TraitTracker.validateForm(roleForm)) return;
    TraitTracker.showToast("Role policy saved.", "success");
  });
});
