document.addEventListener("DOMContentLoaded", () => {
  const list = TraitTracker.qs("#candidateList");
  const search = TraitTracker.qs("#candidateSearch");
  const filter = TraitTracker.qs("#traitFilter");

  const render = () => {
    if (!list) return;
    const term = (search?.value || "").toLowerCase();
    const trait = filter?.value || "all";
    const candidates = TraitTracker.candidates.filter((candidate) => {
      const matchesTerm = candidate.name.toLowerCase().includes(term) || candidate.role.toLowerCase().includes(term);
      const matchesTrait = trait === "all" || candidate.dominant === trait;
      return matchesTerm && matchesTrait;
    });
    list.innerHTML = candidates.map((candidate) => `
      <div class="col-md-6 col-xl-4">
        <article class="tt-card">
          <div class="d-flex justify-content-between gap-3">
            <div>
              <h2 class="h5 mb-1">${candidate.name}</h2>
              <p class="text-muted mb-2">${candidate.role}</p>
            </div>
            <span class="badge text-bg-success align-self-start">${candidate.match}%</span>
          </div>
          <p class="small mb-3">Dominant trait: <strong>${TraitTracker.traitLabels[candidate.dominant]}</strong></p>
          <div class="d-grid gap-2">
            <button class="btn btn-outline-primary btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#candidateMatchModal">View match profile</button>
          </div>
        </article>
      </div>`).join("") || '<p class="text-muted">No candidates match the current search.</p>';
  };

  search?.addEventListener("input", render);
  filter?.addEventListener("change", render);
  render();

  TraitTracker.buildBar(TraitTracker.qs("#matchingChart"), { openness: 86, conscientiousness: 91, extraversion: 72, agreeableness: 78, neuroticism: 34 }, "Ideal profile");
});
