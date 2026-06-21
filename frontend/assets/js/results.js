document.addEventListener("DOMContentLoaded", () => {
  const user = TraitTracker.getStoredUser();
  const scores = user.scores || TraitTracker.baselineScores;
  const dominant = TraitTracker.applyTheme(scores);
  const history = TraitTracker.getAssessmentHistory();
  const reportHistory = history.length ? history : [{ date: user.lastAssessment || new Date().toISOString(), scores }];
  const sortedTraits = [...TraitTracker.traits].sort((a, b) => scores[b] - scores[a]);
  const dominantGap = scores[sortedTraits[0]] - scores[sortedTraits[1]];

  const radarChart = TraitTracker.buildRadar(TraitTracker.qs("#resultRadar"), scores);
  const barChart = TraitTracker.buildBar(TraitTracker.qs("#comparisonChart"), scores, "Your score");
  const midpointChart = TraitTracker.buildComparison(TraitTracker.qs("#midpointChart"), scores);
  const historyChart = TraitTracker.buildHistory(TraitTracker.qs("#resultHistoryChart"), reportHistory);

  const traitInterpretations = {
    openness: {
      Low: "You may prefer familiar methods, practical information, and ideas with an immediate application.",
      Moderate: "You can balance curiosity with practicality, exploring new ideas when they serve a clear purpose.",
      High: "You are likely drawn to imagination, learning, experimentation, and different ways of seeing a problem."
    },
    conscientiousness: {
      Low: "You may work best with flexibility and room to adapt rather than tightly fixed plans.",
      Moderate: "You can use structure when it helps while remaining adaptable when priorities change.",
      High: "You are likely to value planning, reliability, organization, and completing commitments carefully."
    },
    extraversion: {
      Low: "You may prefer quieter settings, focused interaction, and time alone to restore your energy.",
      Moderate: "You can enjoy social engagement while also valuing independent or lower-stimulation work.",
      High: "You are likely energized by interaction, visible activity, discussion, and expressive communication."
    },
    agreeableness: {
      Low: "You may prioritize directness, independent judgment, and critical evaluation over social harmony.",
      Moderate: "You can combine cooperation with healthy skepticism and clear personal boundaries.",
      High: "You are likely attentive to cooperation, empathy, trust, and maintaining supportive relationships."
    },
    neuroticism: {
      Low: "You may remain emotionally steady under pressure and recover relatively quickly after setbacks.",
      Moderate: "Your sensitivity to stress may vary with context, support, workload, and predictability.",
      High: "You may detect risk and emotional changes quickly and benefit from clear expectations and recovery routines."
    }
  };

  const dynamicReport = {
    openness: {
      narrative: "Your strongest pattern is curiosity and comfort with new concepts. You may enjoy work involving research, discovery, design thinking, or thoughtful experimentation.",
      strengths: ["Creative problem solving", "Comfort with new ideas", "Curiosity and imagination"],
      growth: ["Prioritize the strongest ideas", "Add structure to broad projects", "Balance exploration with completion"],
      careers: ["UX researcher", "Product analyst", "Creative strategist", "Innovation coordinator"],
      insight: "Your profile suggests you are energized by exploration and original thinking. Your interface uses expressive accents and idea-focused guidance because openness is your strongest result."
    },
    conscientiousness: {
      narrative: "Your strongest pattern is reliable planning and follow-through. You may perform well in work requiring ownership, precision, organization, and long-term goals.",
      strengths: ["Reliable follow-through", "Organized planning", "Careful attention to quality"],
      growth: ["Leave room for flexibility", "Avoid over-planning small decisions", "Share progress before it feels perfect"],
      careers: ["Project coordinator", "Operations analyst", "Quality analyst", "Data engineer"],
      insight: "Your profile suggests a structured, goal-oriented style. Your interface emphasizes hierarchy, completion, and clear next actions because conscientiousness is your strongest result."
    },
    extraversion: {
      narrative: "Your strongest pattern is social energy and visible momentum. You may thrive in stakeholder-facing, facilitation, growth, communication, or leadership environments.",
      strengths: ["Confident communication", "High social energy", "Comfort leading discussion"],
      growth: ["Make space for quieter voices", "Pause before fast decisions", "Protect recovery time after interaction"],
      careers: ["Community manager", "Sales analyst", "Facilitator", "Customer success specialist"],
      insight: "Your profile suggests you gain momentum through people and interaction. Your interface uses warmer energetic accents and sharing actions because extraversion is your strongest result."
    },
    agreeableness: {
      narrative: "Your strongest pattern is empathy and cooperation. You may be especially effective in work centered on service, trust-building, research, support, or team coordination.",
      strengths: ["Supportive collaboration", "Empathy and trust-building", "Conflict-sensitive teamwork"],
      growth: ["Set boundaries when needed", "State preferences clearly", "Balance harmony with direct feedback"],
      careers: ["People operations specialist", "Counseling support", "User researcher", "Team coordinator"],
      insight: "Your profile suggests a warm, cooperative style. Your interface emphasizes supportive language and softer visual cues because agreeableness is your strongest result."
    },
    neuroticism: {
      narrative: "Your strongest pattern is sensitivity to stress and environmental change. Predictable routines, clear priorities, recovery time, and supportive feedback may help you work at your best.",
      strengths: ["Early risk awareness", "Thoughtful reflection", "Sensitivity to stress signals"],
      growth: ["Use routines during uncertainty", "Break large tasks into smaller steps", "Seek clarity before pressure builds"],
      careers: ["Risk analyst", "Research assistant", "QA tester", "Documentation specialist"],
      insight: "Your profile suggests you notice emotional and environmental changes quickly. Your interface reduces visual noise and foregrounds calm, clear actions because neuroticism is your strongest result."
    }
  };

  const report = dynamicReport[dominant];
  TraitTracker.qs("#resultNarrative").textContent = report.narrative;
  TraitTracker.qs("#assessmentCompletion").textContent = `${user.reportMeta?.answered || 15} of ${user.reportMeta?.total || 15}`;
  TraitTracker.qs("#responseConsistency").textContent = user.reportMeta?.responseConsistency == null ? "Not available" : `${user.reportMeta.responseConsistency}%`;
  TraitTracker.qs("#dominantGap").textContent = `${dominantGap} point${dominantGap === 1 ? "" : "s"}`;
  TraitTracker.qs("#assessmentDate").textContent = user.lastAssessment ? new Date(user.lastAssessment).toLocaleDateString() : "Current session";
  TraitTracker.qs("#historyEmpty")?.classList.toggle("d-none", reportHistory.length > 1);

  const cards = TraitTracker.qs("#resultTraitCards");
  cards.innerHTML = TraitTracker.traits.map((trait) => {
    const band = TraitTracker.scoreBand(scores[trait]);
    return `<div class="col-md-6 col-xl"><article class="tt-card result-score-card ${trait === dominant ? "dominant-card" : ""}">
      <div class="d-flex justify-content-between align-items-start gap-2"><span class="trait-icon"><i class="bi ${TraitTracker.icons[trait]}" aria-hidden="true"></i></span><span class="score-band score-band-${band.toLowerCase()}">${band}</span></div>
      <p class="text-muted small mb-1 mt-3">${TraitTracker.traitLabels[trait]}</p><h2 class="h3">${scores[trait]}%</h2>
      <div class="progress" role="progressbar" aria-label="${TraitTracker.traitLabels[trait]} score" aria-valuenow="${scores[trait]}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${scores[trait]}%"></div></div>
    </article></div>`;
  }).join("");

  const fillList = (selector, items) => {
    TraitTracker.qs(selector).innerHTML = items.map((item) => `<li>${TraitTracker.sanitize(item)}</li>`).join("");
  };
  fillList("#strengthList", report.strengths);
  fillList("#growthList", report.growth);
  fillList("#careerList", report.careers);
  TraitTracker.qs("#insightText").textContent = report.insight;

  TraitTracker.qs("#scoreSummaryBody").innerHTML = sortedTraits.map((trait, index) => {
    const relation = index === 0 ? "Highest score" : index === sortedTraits.length - 1 ? "Lowest score" : `${scores[sortedTraits[0]] - scores[trait]} points below highest`;
    return `<tr><th scope="row">${TraitTracker.traitLabels[trait]}</th><td>${scores[trait]}%</td><td>${TraitTracker.scoreBand(scores[trait])}</td><td>${relation}</td></tr>`;
  }).join("");
  TraitTracker.qs("#chartTextSummary").textContent = sortedTraits.map((trait) => `${TraitTracker.traitLabels[trait]} ${scores[trait]} percent, ${TraitTracker.scoreBand(scores[trait]).toLowerCase()}`).join("; ") + ".";

  TraitTracker.qs("#traitInterpretations").innerHTML = TraitTracker.traits.map((trait) => {
    const band = TraitTracker.scoreBand(scores[trait]);
    return `<article><div><span class="score-band score-band-${band.toLowerCase()}">${band}</span><strong>${TraitTracker.traitLabels[trait]}</strong><span>${scores[trait]}%</span></div><p>${traitInterpretations[trait][band]}</p></article>`;
  }).join("");

  const imageAsDataUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const downloadPdf = async () => {
    if (!window.jspdf?.jsPDF) {
      TraitTracker.showToast("The PDF library could not be loaded. Please try again.", "danger");
      return;
    }
    const button = TraitTracker.qs("#downloadReport");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      let y = 18;
      const ensureSpace = (height) => {
        if (y + height <= pageHeight - 16) return;
        doc.addPage();
        y = 18;
      };
      const addHeading = (text, size = 15) => {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(44, 74, 71);
        doc.text(text, margin, y);
        y += 8;
      };
      const addParagraph = (text) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(73, 94, 91);
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        ensureSpace(lines.length * 5 + 3);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 4;
      };
      const logo = await imageAsDataUrl("assets/images/traittracker-logo-hd.png");
      doc.addImage(logo, "PNG", margin, 10, 24, 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(44, 74, 71);
      doc.text("TraitTracker Personality Report", 44, 21);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Prepared for ${user.name || user.email} on ${new Date().toLocaleDateString()}`, 44, 27);
      y = 38;
      addHeading(`Dominant trait: ${TraitTracker.traitLabels[dominant]}`, 17);
      addParagraph(report.narrative);
      addHeading("Big Five scores");
      TraitTracker.traits.forEach((trait) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(44, 74, 71);
        doc.text(`${TraitTracker.traitLabels[trait]}: ${scores[trait]}%`, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(TraitTracker.scoreBand(scores[trait]), 92, y);
        y += 6;
      });
      ensureSpace(74);
      doc.addImage(TraitTracker.qs("#resultRadar").toDataURL("image/png", 1), "PNG", margin, y, 82, 68);
      doc.addImage(TraitTracker.qs("#comparisonChart").toDataURL("image/png", 1), "PNG", 110, y, 82, 68);
      y += 76;
      addHeading("Strengths");
      addParagraph(report.strengths.map((item) => `- ${item}`).join("\n"));
      addHeading("Growth areas");
      addParagraph(report.growth.map((item) => `- ${item}`).join("\n"));
      addHeading("Career reflection prompts");
      addParagraph(report.careers.join(", "));
      addHeading("Interpretation notes");
      TraitTracker.traits.forEach((trait) => addParagraph(`${TraitTracker.traitLabels[trait]} (${scores[trait]}%, ${TraitTracker.scoreBand(scores[trait])}): ${traitInterpretations[trait][TraitTracker.scoreBand(scores[trait])]}`));
      addHeading("Responsible use");
      addParagraph("TraitTracker describes patterns in survey responses. It is not a clinical diagnosis, a measure of ability, or a complete predictor of career success. Results should support reflection rather than make decisions on a person's behalf.");
      doc.save(`TraitTracker-${TraitTracker.sanitize(user.name || "report").replace(/\s+/g, "-")}.pdf`);
      TraitTracker.showToast("Your PDF report has been downloaded.", "success");
    } catch {
      TraitTracker.showToast("The PDF could not be created. Please try again.", "danger");
    } finally {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  };

  TraitTracker.qs("#downloadReport")?.addEventListener("click", downloadPdf);
  TraitTracker.qs("#shareResults")?.addEventListener("click", async () => {
    const text = `My TraitTracker result: ${TraitTracker.traitLabels[dominant]} is my strongest trait at ${scores[dominant]}%.`;
    try {
      if (navigator.share) await navigator.share({ title: "TraitTracker Results", text });
      else {
        await navigator.clipboard.writeText(text);
        TraitTracker.showToast("Share summary copied to clipboard.", "success");
      }
    } catch (error) {
      if (error.name !== "AbortError") TraitTracker.showToast("Results could not be shared.", "warning");
    }
  });

  if (new URLSearchParams(window.location.search).get("download") === "1") {
    setTimeout(downloadPdf, 700);
  }

  window.addEventListener("beforeunload", () => {
    [radarChart, barChart, midpointChart, historyChart].forEach((chart) => chart?.destroy());
  });
});
