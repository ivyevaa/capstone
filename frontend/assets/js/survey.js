document.addEventListener("DOMContentLoaded", () => {
  const questionText = [
    "I like improving systems and routines.", "I enjoy being the person who starts conversations.", "I am patient when people need support.", "I remain calm after small setbacks.", "I look for imaginative solutions.",
    "I meet deadlines without reminders.", "I feel comfortable speaking in front of others.", "I prefer cooperation over competition.", "I can become tense under heavy pressure.", "I appreciate art, culture, or abstract ideas.",
    "I prepare carefully before important work.", "I seek active social environments.", "I give people the benefit of the doubt.", "I notice stress quickly in myself.", "I enjoy learning across different disciplines."
  ];
  ["step2Questions", "step3Questions", "step4Questions"].forEach((host, hostIndex) => {
    const node = TraitTracker.qs(`#${host}`);
    if (!node) return;
    node.innerHTML = questionText.slice(hostIndex * 5, hostIndex * 5 + 5).map((text, index) => {
      const number = hostIndex * 5 + index + 6;
      return `<div class="question-block mb-4"><p class="fw-semibold">${number}. ${text}</p><div class="likert-grid" role="radiogroup" aria-label="Question ${number}" aria-required="true">${[5, 4, 3, 2, 1].map((value) => `<input id="q${number}_${value}" name="q${number}" value="${value}" type="radio"><label for="q${number}_${value}" aria-label="${value} out of 5">${value}</label>`).join("")}</div></div>`;
    }).join("");
  });
  TraitTracker.qsa(".likert-grid[role='radiogroup']").forEach((group) => {
    group.setAttribute("aria-required", "true");
    TraitTracker.qsa("label", group).forEach((label) => label.setAttribute("aria-label", `${label.textContent} out of 5`));
  });

  const consentGate = TraitTracker.qs("#consentGate");
  const consentCheck = TraitTracker.qs("#consentCheck");
  const startButton = TraitTracker.qs("#startAssessment");
  const surveyForm = TraitTracker.qs("#surveyForm");
  const steps = TraitTracker.qsa(".survey-step");
  let activeStep = 0;

  if (consentCheck && startButton) {
    consentCheck.addEventListener("change", () => {
      startButton.disabled = !consentCheck.checked;
    });
    startButton.addEventListener("click", () => {
      if (!consentCheck.checked) {
        TraitTracker.showToast("You must select the consent checkbox before continuing.", "warning");
        return;
      }
      TraitTracker.recordConsent();
      const redirectTo = sessionStorage.getItem("ttConsentRedirect") || "assessment.html";
      sessionStorage.removeItem("ttConsentRedirect");
      TraitTracker.showToast("Consent recorded. You can begin the assessment.", "success");
      setTimeout(() => window.location.href = redirectTo, 650);
    });
  }

  if (surveyForm && !TraitTracker.hasConsent()) {
    sessionStorage.setItem("ttConsentRedirect", "assessment.html");
    window.location.replace("consent.html");
    return;
  }

  const updateProgress = () => {
    if (!steps.length) return;
    steps.forEach((step, index) => step.classList.toggle("active", index === activeStep));
    const answered = TraitTracker.qsa("input[type='radio']:checked", surveyForm).length;
    const total = TraitTracker.qsa(".question-block", surveyForm).length;
    const percent = Math.round((answered / total) * 100);
    TraitTracker.qs("#completionPercent").textContent = `${percent}%`;
    TraitTracker.qs("#surveyProgress").style.width = `${percent}%`;
    TraitTracker.qs("#surveyProgress").setAttribute("aria-valuenow", percent);
    TraitTracker.qs("#stepCounter").textContent = `Step ${activeStep + 1} of ${steps.length}`;
    TraitTracker.qs("#prevStep").disabled = activeStep === 0;
    TraitTracker.qs("#nextStep").classList.toggle("d-none", activeStep === steps.length - 1);
    TraitTracker.qs("#submitSurvey").classList.toggle("d-none", activeStep !== steps.length - 1);
  };

  const currentStepValid = () => {
    const questions = TraitTracker.qsa(".question-block", steps[activeStep]);
    const valid = questions.every((question) => TraitTracker.qs("input[type='radio']:checked", question));
    if (!valid) TraitTracker.showToast("Please answer each question in this step.", "warning");
    return valid;
  };

  surveyForm?.addEventListener("change", () => {
    TraitTracker.qs("#autoSaveStatus").innerHTML = '<i class="bi bi-cloud-check" aria-hidden="true"></i> Saved just now';
    const data = {};
    TraitTracker.qsa("input[type='radio']:checked", surveyForm).forEach((input) => {
      data[input.name] = Number(input.value);
    });
    localStorage.setItem("ttSurveyDraft", JSON.stringify(data));
    updateProgress();
  });

  TraitTracker.qs("#nextStep")?.addEventListener("click", () => {
    if (!currentStepValid()) return;
    activeStep = Math.min(activeStep + 1, steps.length - 1);
    updateProgress();
  });

  TraitTracker.qs("#prevStep")?.addEventListener("click", () => {
    activeStep = Math.max(activeStep - 1, 0);
    updateProgress();
  });

  surveyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentStepValid()) return;
    const answers = TraitTracker.qsa("input[type='radio']:checked", surveyForm).map((input) => Number(input.value));
    const grouped = {
      openness: [answers[0], answers[5], answers[10], answers[15]],
      conscientiousness: [answers[1], answers[6], answers[11], answers[16]],
      extraversion: [answers[2], answers[7], answers[12], answers[17]],
      agreeableness: [answers[3], answers[8], answers[13], answers[18]],
      neuroticism: [answers[4], answers[9], answers[14], answers[19]]
    };
    const scores = Object.fromEntries(Object.entries(grouped).map(([trait, values]) => {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      return [trait, Math.round((average / 5) * 100)];
    }));
    const consistencyValues = Object.values(grouped).map((values) => {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / values.length;
      return Math.sqrt(variance);
    });
    const averageDeviation = consistencyValues.reduce((sum, value) => sum + value, 0) / consistencyValues.length;
    const responseConsistency = Math.max(0, Math.round(100 - (averageDeviation / 2) * 100));
    const completedAt = new Date().toISOString();
    const reportMeta = { answered: answers.length, total: 20, responseConsistency };
    const history = TraitTracker.getAssessmentHistory();
    history.push({ date: completedAt, scores });
    localStorage.setItem("ttAssessmentHistory", JSON.stringify(history.slice(-12)));
    TraitTracker.saveUser({ scores, lastAssessment: completedAt, reportMeta });
    TraitTracker.applyTheme(scores);
    localStorage.removeItem("ttSurveyDraft");
    TraitTracker.showToast("Assessment complete. Your result profile is ready.", "success");
    setTimeout(() => window.location.href = "results.html", 900);
  });

  updateProgress();
});
