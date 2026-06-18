document.addEventListener("DOMContentLoaded", () => {
  const user = TraitTracker.getStoredUser();
  const scores = user.scores || TraitTracker.baselineScores;
  const dominant = TraitTracker.applyTheme(scores);

  TraitTracker.qsa("[data-profile-name]").forEach((node) => {
    node.textContent = user.name || "TraitTracker Candidate";
  });
  TraitTracker.qsa("[data-profile-email]").forEach((node) => {
    node.textContent = user.email || "candidate@traittracker.edu";
  });

  const scoreHost = TraitTracker.qs("#traitSummaryCards");
  if (scoreHost) {
    scoreHost.innerHTML = TraitTracker.traits.map((trait) => `
      <div class="span-3">
        <article class="tt-card ${trait === dominant ? "dominant-card" : ""}">
          <div class="trait-score">
            <span class="trait-icon"><i class="bi ${TraitTracker.icons[trait]}"></i></span>
            <div>
              <p class="text-muted small mb-1">${TraitTracker.traitLabels[trait]}</p>
              <h3 class="h4 mb-0">${scores[trait]}%</h3>
            </div>
          </div>
        </article>
      </div>`).join("");
  }

  TraitTracker.buildRadar(TraitTracker.qs("#dashboardRadar"), scores);
  TraitTracker.buildBar(TraitTracker.qs("#dashboardBars"), scores, "Latest assessment");
  TraitTracker.buildLine(TraitTracker.qs("#historyTrend"));

  const insight = {
    openness: "Your workspace is tuned for exploration, idea generation, and creative comparison.",
    conscientiousness: "Your dashboard emphasizes structure, completion status, and clear next actions.",
    extraversion: "Your dashboard highlights interaction, sharing, and momentum-focused engagement.",
    agreeableness: "Your dashboard uses a warmer interface with collaborative guidance and supportive language.",
    neuroticism: "Your dashboard reduces visual noise and keeps the most important actions calm and clear."
  };
  const dominantInsight = TraitTracker.qs("#dominantInsight");
  if (dominantInsight) dominantInsight.textContent = insight[dominant];

  TraitTracker.qs("#saveProfile")?.addEventListener("click", () => {
    const name = TraitTracker.sanitize(TraitTracker.qs("#settingsName").value || user.name);
    const email = TraitTracker.sanitize(TraitTracker.qs("#settingsEmail").value || user.email);
    TraitTracker.saveUser({ name, email });
    TraitTracker.showToast("Profile settings saved.", "success");
  });

  TraitTracker.qsa("[data-report-action]").forEach((button) => {
    button.addEventListener("click", () => TraitTracker.showToast("Report generation interface is ready for backend PDF export.", "info"));
  });
});
