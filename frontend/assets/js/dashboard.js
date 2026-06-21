document.addEventListener("DOMContentLoaded", () => {
  const user = TraitTracker.getStoredUser();
  const scores = user.scores || TraitTracker.baselineScores;
  const dominant = TraitTracker.applyTheme(scores);
  const history = TraitTracker.getAssessmentHistory();
  const reportHistory = history.length ? history : [{ date: user.lastAssessment || new Date().toISOString(), scores }];

  TraitTracker.qsa("[data-profile-name]").forEach((node) => {
    node.textContent = user.name || "TraitTracker Candidate";
  });
  TraitTracker.qsa("[data-profile-email]").forEach((node) => {
    node.textContent = user.email || "candidate@traittracker.edu";
  });
  TraitTracker.qsa("[data-profile-name-input]").forEach((node) => {
    node.value = user.name || "";
  });
  TraitTracker.qsa("[data-profile-email-input]").forEach((node) => {
    node.value = user.email || "";
  });

  const scoreHost = TraitTracker.qs("#traitSummaryCards");
  if (scoreHost) {
    scoreHost.innerHTML = TraitTracker.traits.map((trait) => `
      <div>
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
  TraitTracker.buildComparison(TraitTracker.qs("#dashboardComparison"), scores);
  TraitTracker.buildHistory(TraitTracker.qs("#historyTrend"), reportHistory);
  TraitTracker.qs("#dominantScoreRing")?.style.setProperty("--score", scores[dominant]);
  TraitTracker.qs("#reportCount").textContent = `${reportHistory.length} ready`;
  TraitTracker.qs("#dashboardHistoryRows").innerHTML = reportHistory.slice(-3).reverse().map((item) => {
    const itemDominant = TraitTracker.dominantTrait(item.scores);
    return `<tr><td>${new Date(item.date).toLocaleDateString()}</td><td>${TraitTracker.traitLabels[itemDominant]}</td><td><span class="badge text-bg-success">Complete</span></td></tr>`;
  }).join("");

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
    const alert = TraitTracker.qs("#profileAlert");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert.textContent = "Enter a display name and a valid email address.";
      alert.className = "alert alert-danger";
      return;
    }
    TraitTracker.saveUser({ name, email });
    TraitTracker.qsa("[data-profile-name]").forEach((node) => node.textContent = name);
    alert.textContent = "Your profile settings have been saved.";
    alert.className = "alert alert-success";
    TraitTracker.showToast("Profile settings saved.", "success");
  });

  TraitTracker.qsa("[data-report-action]").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "results.html?download=1";
    });
  });
});
