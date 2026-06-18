document.addEventListener("DOMContentLoaded", () => {
  const user = TraitTracker.getStoredUser();
  const scores = user.scores || TraitTracker.baselineScores;
  const dominant = TraitTracker.applyTheme(scores);

  TraitTracker.buildRadar(TraitTracker.qs("#resultRadar"), scores);
  TraitTracker.buildBar(TraitTracker.qs("#comparisonChart"), scores, "Candidate score");

  const cards = TraitTracker.qs("#resultTraitCards");
  if (cards) {
    cards.innerHTML = TraitTracker.traits.map((trait) => `
      <div class="col-md-6 col-xl">
        <article class="tt-card">
          <span class="trait-icon mb-3"><i class="bi ${TraitTracker.icons[trait]}"></i></span>
          <p class="text-muted small mb-1">${TraitTracker.traitLabels[trait]}</p>
          <h2 class="h3">${scores[trait]}%</h2>
          <div class="progress" role="progressbar" aria-label="${TraitTracker.traitLabels[trait]} score" aria-valuenow="${scores[trait]}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" style="width: ${scores[trait]}%"></div>
          </div>
        </article>
      </div>`).join("");
  }

  const narratives = {
    openness: "You show strong curiosity and comfort with new concepts. You are likely to enjoy roles involving research, product discovery, design thinking, or strategic experimentation.",
    conscientiousness: "You show a reliable planning style and strong follow-through. You are likely to perform well in structured roles requiring ownership, precision, and long-term goals.",
    extraversion: "You gain energy from interaction and visible momentum. You may thrive in stakeholder-facing, facilitation, growth, or leadership-track environments.",
    agreeableness: "You bring empathy, cooperation, and trust-building into group settings. You may be especially effective in service, people operations, research, or team coordination.",
    neuroticism: "You may notice stress signals early and benefit from predictable routines, clear priorities, and supportive feedback cycles."
  };
  const resultNarrative = TraitTracker.qs("#resultNarrative");
  if (resultNarrative) resultNarrative.textContent = narratives[dominant];

  const dynamicReport = {
    openness: {
      strengths: ["Creative problem solving", "Comfort with new ideas", "Strong curiosity and imagination"],
      growth: ["Prioritize the strongest ideas", "Use structure when projects become broad", "Balance exploration with completion"],
      careers: ["UX researcher", "Product analyst", "Creative strategist", "Innovation coordinator"],
      insight: "Your profile suggests you are energized by exploration and original thinking. The interface uses more expressive accents and idea-focused guidance because openness is your strongest result."
    },
    conscientiousness: {
      strengths: ["Reliable follow-through", "Organized planning", "Careful attention to quality"],
      growth: ["Leave room for flexibility", "Avoid over-planning small decisions", "Share progress before everything feels perfect"],
      careers: ["Project coordinator", "Operations analyst", "Quality analyst", "Data engineer"],
      insight: "Your profile suggests a structured, goal-oriented style. The interface becomes more organized and task-focused because conscientiousness is your strongest result."
    },
    extraversion: {
      strengths: ["Confident communication", "High social energy", "Comfort leading discussion"],
      growth: ["Make space for quieter voices", "Pause before fast decisions", "Protect recovery time after high interaction"],
      careers: ["Community manager", "Sales analyst", "Facilitator", "Customer success specialist"],
      insight: "Your profile suggests you gain momentum through people and interaction. The interface uses warmer, more energetic accents because extraversion is your strongest result."
    },
    agreeableness: {
      strengths: ["Supportive collaboration", "Empathy and trust-building", "Conflict-sensitive teamwork"],
      growth: ["Set boundaries when needed", "State preferences clearly", "Balance harmony with direct feedback"],
      careers: ["People operations assistant", "Counseling support", "User researcher", "Team coordinator"],
      insight: "Your profile suggests a warm, cooperative style. The interface emphasizes supportive language and softer visual cues because agreeableness is your strongest result."
    },
    neuroticism: {
      strengths: ["Early risk awareness", "Thoughtful reflection", "Sensitivity to stress signals"],
      growth: ["Use routines during uncertainty", "Break large tasks into smaller steps", "Seek clarity before pressure builds"],
      careers: ["Risk analyst", "Research assistant", "QA tester", "Documentation specialist"],
      insight: "Your profile suggests you notice emotional and environmental changes quickly. The interface becomes calmer and lower-distraction because neuroticism is your strongest result."
    }
  };

  const fillList = (selector, items) => {
    const node = TraitTracker.qs(selector);
    if (!node) return;
    node.innerHTML = items.map((item) => `<li>${TraitTracker.sanitize(item)}</li>`).join("");
  };
  fillList("#strengthList", dynamicReport[dominant].strengths);
  fillList("#growthList", dynamicReport[dominant].growth);
  fillList("#careerList", dynamicReport[dominant].careers);
  const insightText = TraitTracker.qs("#insightText");
  if (insightText) insightText.textContent = dynamicReport[dominant].insight;

  TraitTracker.qs("#shareResults")?.addEventListener("click", async () => {
    const text = `TraitTracker result: dominant trait ${TraitTracker.traitLabels[dominant]}.`;
    if (navigator.share) {
      await navigator.share({ title: "TraitTracker Results", text });
    } else {
      await navigator.clipboard.writeText(text);
      TraitTracker.showToast("Share summary copied to clipboard.", "success");
    }
  });
});
