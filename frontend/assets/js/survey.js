document.addEventListener("DOMContentLoaded", async () => {
  const questions = [
    "I enjoy thinking about deep, abstract ideas and theories.",
    "I prefer keeping a regular, predictable routine over trying new things.",
    "I like using my imagination to find unique ways to solve problems.",
    "I make a clear plan for my tasks to make sure I finish them on time.",
    "I easily lose track of things or forget small details when I am busy.",
    "I like to finish my chores and duties right away instead of putting them off.",
    "I feel full of energy when I am in a big group of people, and I talk a lot.",
    "I prefer to stay in the background during conversations and let others talk.",
    "I am completely comfortable starting a conversation with people I don't know.",
    "I care deeply about keeping peace in a group and sympathy with others.",
    "I often doubt people's real intentions when they try to be nice to me.",
    "I willingly spend my free time helping my classmates or friends with their problems.",
    "I get stressed, worried, or anxious easily when plans change suddenly.",
    "I stay calm and steady even when handling an unexpected problem or crisis.",
    "I spend a lot of time overthinking past mistakes or worrying about the future."
  ];
  const reverseScored = new Set([1, 4, 7, 10, 13]);
  const consentCheck = TraitTracker.qs("#consentCheck");
  const startButton = TraitTracker.qs("#startAssessment");
  const surveyForm = TraitTracker.qs("#surveyForm");

  if ((consentCheck || surveyForm) && !TraitTracker.isAuthenticated()) {
    sessionStorage.setItem("ttPostLoginRedirect", "consent.html");
    window.location.replace("login.html?required=1");
    return;
  }

  if (consentCheck || surveyForm) {
    try {
      const accessResponse = await fetch(surveyForm ? "/api/assessment-access" : "/api/auth/session");
      if (accessResponse.status === 401) {
        TraitTracker.setAuthenticated(false);
        localStorage.removeItem("ttConsent");
        sessionStorage.setItem("ttPostLoginRedirect", "consent.html");
        window.location.replace("login.html?required=1");
        return;
      }
      if (surveyForm && accessResponse.status === 403) {
        localStorage.removeItem("ttConsent");
        sessionStorage.setItem("ttConsentRedirect", "assessment.html");
        window.location.replace("consent.html");
        return;
      }
      if (!accessResponse.ok) throw new Error("Security verification could not be completed.");
    } catch (error) {
      TraitTracker.showToast(error.message, "danger");
      return;
    }
  }

  if (consentCheck && startButton) {
    consentCheck.addEventListener("change", () => {
      startButton.disabled = !consentCheck.checked;
    });
    startButton.addEventListener("click", async () => {
      if (!consentCheck.checked) {
        TraitTracker.showToast("You must accept the privacy and security agreement.", "warning");
        return;
      }
      startButton.disabled = true;
      try {
        const response = await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accepted: true })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Consent could not be recorded.");
        TraitTracker.recordConsent();
        const redirectTo = sessionStorage.getItem("ttConsentRedirect") || "assessment.html";
        sessionStorage.removeItem("ttConsentRedirect");
        TraitTracker.showToast("Privacy and security consent verified.", "success");
        setTimeout(() => window.location.href = redirectTo, 450);
      } catch (error) {
        startButton.disabled = false;
        TraitTracker.showToast(error.message, "danger");
      }
    });
    return;
  }

  if (!surveyForm) return;
  if (!TraitTracker.hasConsent()) {
    sessionStorage.setItem("ttConsentRedirect", "assessment.html");
    window.location.replace("consent.html");
    return;
  }

  ["step1Questions", "step2Questions", "step3Questions"].forEach((hostId, stepIndex) => {
    const host = TraitTracker.qs(`#${hostId}`);
    host.innerHTML = questions.slice(stepIndex * 5, stepIndex * 5 + 5).map((text, index) => {
      const number = stepIndex * 5 + index + 1;
      return `<div class="question-block mb-4"><p id="q${number}Text" class="fw-semibold">${number}. ${text}</p><div class="likert-grid" role="radiogroup" aria-labelledby="q${number}Text" aria-required="true">${[5, 4, 3, 2, 1].map((value) => `<input id="q${number}_${value}" name="q${number}" value="${value}" type="radio"><label for="q${number}_${value}" aria-label="${value} out of 5">${value}</label>`).join("")}</div></div>`;
    }).join("");
  });

  try {
    const draft = JSON.parse(localStorage.getItem("ttSurveyDraft") || "{}");
    Object.entries(draft).forEach(([name, value]) => {
      const input = TraitTracker.qs(`input[name='${name}'][value='${value}']`, surveyForm);
      if (input) input.checked = true;
    });
  } catch {}

  const steps = TraitTracker.qsa(".survey-step");
  let activeStep = 0;

  const updateProgress = () => {
    steps.forEach((step, index) => step.classList.toggle("active", index === activeStep));
    const answered = TraitTracker.qsa("input[type='radio']:checked", surveyForm).length;
    const percent = Math.round((answered / questions.length) * 100);
    TraitTracker.qs("#completionPercent").textContent = `${percent}%`;
    TraitTracker.qs("#surveyProgress").style.width = `${percent}%`;
    TraitTracker.qs("#surveyProgressTrack").setAttribute("aria-valuenow", percent);
    TraitTracker.qs("#stepCounter").textContent = `Step ${activeStep + 1} of ${steps.length}`;
    TraitTracker.qs("#prevStep").disabled = activeStep === 0;
    TraitTracker.qs("#nextStep").classList.toggle("d-none", activeStep === steps.length - 1);
    TraitTracker.qs("#submitSurvey").classList.toggle("d-none", activeStep !== steps.length - 1);
  };

  const currentStepValid = () => {
    const blocks = TraitTracker.qsa(".question-block", steps[activeStep]);
    const valid = blocks.every((block) => TraitTracker.qs("input[type='radio']:checked", block));
    if (!valid) TraitTracker.showToast("Please answer every question in this step.", "warning");
    return valid;
  };

  surveyForm.addEventListener("change", () => {
    const draft = {};
    TraitTracker.qsa("input[type='radio']:checked", surveyForm).forEach((input) => {
      draft[input.name] = Number(input.value);
    });
    localStorage.setItem("ttSurveyDraft", JSON.stringify(draft));
    TraitTracker.qs("#autoSaveStatus").innerHTML = '<i class="bi bi-cloud-check" aria-hidden="true"></i> Saved just now';
    updateProgress();
  });

  TraitTracker.qs("#nextStep").addEventListener("click", () => {
    if (!currentStepValid()) return;
    activeStep = Math.min(activeStep + 1, steps.length - 1);
    updateProgress();
    surveyForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  TraitTracker.qs("#prevStep").addEventListener("click", () => {
    activeStep = Math.max(activeStep - 1, 0);
    updateProgress();
    surveyForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentStepValid()) return;
    const answers = Array.from({ length: questions.length }, (_, index) => Number(TraitTracker.qs(`input[name='q${index + 1}']:checked`, surveyForm)?.value));
    if (answers.some((answer) => !Number.isInteger(answer))) {
      TraitTracker.showToast("Please answer all 15 questions.", "warning");
      return;
    }
    const submitButton = TraitTracker.qs("#submitSurvey");
    submitButton.disabled = true;
    TraitTracker.qs(".spinner-border", submitButton).classList.remove("d-none");
    try {
      const response = await fetch("/api/submit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const payload = await response.json();
      if (response.status === 401) {
        TraitTracker.setAuthenticated(false);
        sessionStorage.setItem("ttPostLoginRedirect", "consent.html");
        window.location.href = "login.html?required=1";
        return;
      }
      if (response.status === 403) {
        localStorage.removeItem("ttConsent");
        window.location.href = "consent.html";
        return;
      }
      if (!response.ok) throw new Error(payload.message || "Assessment could not be submitted.");

      const scores = Object.fromEntries(Object.entries(payload.results).map(([trait, value]) => [trait, Math.round(Number(value) * 100)]));
      const adjusted = answers.map((answer, index) => reverseScored.has(index) ? 6 - answer : answer);
      const grouped = [adjusted.slice(0, 3), adjusted.slice(3, 6), adjusted.slice(6, 9), adjusted.slice(9, 12), adjusted.slice(12, 15)];
      const deviations = grouped.map((values) => {
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length);
      });
      const responseConsistency = Math.max(0, Math.round(100 - (deviations.reduce((sum, value) => sum + value, 0) / deviations.length / 2) * 100));
      const completedAt = new Date().toISOString();
      const history = TraitTracker.getAssessmentHistory();
      history.push({ date: completedAt, scores });
      localStorage.setItem("ttAssessmentHistory", JSON.stringify(history.slice(-12)));
      TraitTracker.saveUser({ scores, lastAssessment: completedAt, reportMeta: { answered: 15, total: 15, responseConsistency } });
      localStorage.removeItem("ttSurveyDraft");
      TraitTracker.applyTheme(scores);
      TraitTracker.showToast("Assessment securely saved. Your report is ready.", "success");
      setTimeout(() => window.location.href = "results.html", 600);
    } catch (error) {
      submitButton.disabled = false;
      TraitTracker.qs(".spinner-border", submitButton).classList.add("d-none");
      TraitTracker.showToast(error.message, "danger");
    }
  });

  updateProgress();
});
