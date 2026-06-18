const TraitTracker = (() => {
  const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  const traitLabels = {
    openness: "Openness",
    conscientiousness: "Conscientiousness",
    extraversion: "Extraversion",
    agreeableness: "Agreeableness",
    neuroticism: "Neuroticism"
  };
  const icons = {
    openness: "bi-stars",
    conscientiousness: "bi-diagram-3",
    extraversion: "bi-lightning-charge",
    agreeableness: "bi-heart",
    neuroticism: "bi-shield-check"
  };
  const baselineScores = {
    openness: 82,
    conscientiousness: 74,
    extraversion: 67,
    agreeableness: 79,
    neuroticism: 38
  };
  const candidates = [
    { name: "Aarav Sharma", role: "Product Analyst", match: 94, dominant: "conscientiousness", scores: { openness: 78, conscientiousness: 91, extraversion: 64, agreeableness: 72, neuroticism: 32 } },
    { name: "Maya Chen", role: "UX Researcher", match: 90, dominant: "openness", scores: { openness: 93, conscientiousness: 70, extraversion: 76, agreeableness: 83, neuroticism: 35 } },
    { name: "Jordan Lee", role: "Customer Success", match: 88, dominant: "agreeableness", scores: { openness: 70, conscientiousness: 69, extraversion: 86, agreeableness: 92, neuroticism: 41 } },
    { name: "Sofia Patel", role: "Data Engineer", match: 84, dominant: "conscientiousness", scores: { openness: 65, conscientiousness: 89, extraversion: 48, agreeableness: 67, neuroticism: 29 } },
    { name: "Nolan Rivera", role: "Community Lead", match: 82, dominant: "extraversion", scores: { openness: 74, conscientiousness: 66, extraversion: 94, agreeableness: 80, neuroticism: 44 } }
  ];

  const sanitize = (value) => String(value ?? "").replace(/[<>"'`]/g, "");
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function getStoredUser() {
    const fallback = { id: "user", name: "Elena Rivera", email: "candidate@traittracker.edu", role: "Candidate", scores: baselineScores };
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem("ttUser") || "{}") };
    } catch {
      return fallback;
    }
  }

  function saveUser(patch) {
    const user = { ...getStoredUser(), ...patch };
    localStorage.setItem("ttUser", JSON.stringify(user));
    return user;
  }

  function dominantTrait(scores = baselineScores) {
    return traits.reduce((winner, trait) => scores[trait] > scores[winner] ? trait : winner, traits[0]);
  }

  function applyTheme(scores = getStoredUser().scores || baselineScores) {
    const dominant = dominantTrait(scores);
    document.documentElement.dataset.theme = dominant;
    qsa("[data-dominant-trait]").forEach((node) => {
      node.textContent = traitLabels[dominant];
    });
    return dominant;
  }

  function renderNav() {
    const role = getStoredUser().role || "Candidate";
    qsa("[data-role-visible]").forEach((node) => {
      const allowed = node.dataset.roleVisible.split(",").map((item) => item.trim());
      node.classList.toggle("d-none", !allowed.includes(role));
    });
    qsa("[data-user-name]").forEach((node) => {
      node.textContent = getStoredUser().name || getStoredUser().email;
    });
  }

  function initLoading() {
    const loader = qs("#loadingScreen");
    if (!loader) return;
    window.addEventListener("load", () => {
      setTimeout(() => loader.classList.add("hidden"), 250);
    });
  }

  function initTooltips() {
    if (!window.bootstrap) return;
    qsa("[data-bs-toggle='tooltip']").forEach((node) => new bootstrap.Tooltip(node));
  }

  function showToast(message, variant = "primary") {
    let host = qs("#toastHost");
    if (!host) {
      host = document.createElement("div");
      host.id = "toastHost";
      host.className = "toast-container position-fixed bottom-0 end-0 p-3";
      document.body.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${variant} border-0`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${sanitize(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    host.appendChild(toast);
    const instance = new bootstrap.Toast(toast, { delay: 3200 });
    instance.show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  }

  function initSessionWarning() {
    const modalEl = qs("#sessionTimeoutModal");
    if (!modalEl || !window.bootstrap) return;
    const modal = new bootstrap.Modal(modalEl);
    let warningTimer;
    let logoutTimer;
    const reset = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      warningTimer = setTimeout(() => modal.show(), 12 * 60 * 1000);
      logoutTimer = setTimeout(() => {
        saveUser({ role: "Candidate" });
        showToast("Session expired. Please sign in again.", "warning");
      }, 15 * 60 * 1000);
    };
    ["click", "keydown", "mousemove", "touchstart"].forEach((eventName) => window.addEventListener(eventName, reset, { passive: true }));
    qs("[data-extend-session]")?.addEventListener("click", () => {
      modal.hide();
      reset();
      showToast("Session extended securely.", "success");
    });
    reset();
  }

  function validateForm(form) {
    let valid = true;
    qsa("input, select, textarea", form).forEach((field) => {
      if (field.type === "hidden" || field.disabled) return;
      if (field.required && !field.value.trim()) valid = false;
      if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) valid = false;
      if (/[<>"'`]/.test(field.value)) {
        field.setCustomValidity("Please remove unsupported characters.");
        valid = false;
      } else {
        field.setCustomValidity("");
      }
    });
    form.classList.add("was-validated");
    return form.checkValidity() && valid;
  }

  function initPasswordToggles() {
    qsa("[data-toggle-password]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = qs(button.dataset.togglePassword);
        if (!target) return;
        target.type = target.type === "password" ? "text" : "password";
        button.innerHTML = target.type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      });
    });
  }

  function passwordStrength(password) {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  }

  function initPasswordMeters() {
    qsa("[data-password-meter]").forEach((input) => {
      const meter = qs(input.dataset.passwordMeter);
      const output = qs(input.dataset.passwordText);
      input.addEventListener("input", () => {
        const score = passwordStrength(input.value);
        const bar = meter?.querySelector("span");
        if (bar) {
          bar.style.width = `${score}%`;
          bar.style.background = score < 50 ? "var(--tt-danger)" : score < 75 ? "var(--tt-warning)" : "var(--tt-success)";
        }
        if (output) output.textContent = score < 50 ? "Weak" : score < 75 ? "Moderate" : "Strong";
      });
    });
  }

  function hasConsent() {
    return localStorage.getItem("ttConsent") === "accepted";
  }

  function initConsentRequiredLinks() {
    qsa("a[href='assessment.html']").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (hasConsent()) return;
        event.preventDefault();
        sessionStorage.setItem("ttConsentRedirect", "assessment.html");
        showToast("Please review and accept consent before starting the test.", "warning");
        setTimeout(() => {
          window.location.href = "consent.html";
        }, 650);
      });
    });
  }

  function chartColors(alpha = 0.2) {
    const css = getComputedStyle(document.documentElement);
    return {
      primary: css.getPropertyValue("--tt-primary").trim(),
      secondary: css.getPropertyValue("--tt-secondary").trim(),
      accent: css.getPropertyValue("--tt-accent").trim(),
      fill: `rgba(37, 99, 235, ${alpha})`,
      grid: "rgba(102, 112, 133, 0.16)"
    };
  }

  function buildRadar(canvas, scores = baselineScores) {
    if (!canvas || !window.Chart) return null;
    const colors = chartColors(0.18);
    return new Chart(canvas, {
      type: "radar",
      data: {
        labels: traits.map((trait) => traitLabels[trait]),
        datasets: [{
          label: "Trait score",
          data: traits.map((trait) => scores[trait]),
          backgroundColor: colors.fill,
          borderColor: colors.primary,
          borderWidth: 2,
          pointBackgroundColor: colors.secondary
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 }, grid: { color: colors.grid } } }
      }
    });
  }

  function buildBar(canvas, scores = baselineScores, label = "Score") {
    if (!canvas || !window.Chart) return null;
    const colors = chartColors();
    return new Chart(canvas, {
      type: "bar",
      data: {
        labels: traits.map((trait) => traitLabels[trait]),
        datasets: [{ label, data: traits.map((trait) => scores[trait]), backgroundColor: [colors.primary, colors.secondary, colors.accent, "#16a34a", "#64748b"], borderRadius: 7 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 100, grid: { color: colors.grid } }, x: { grid: { display: false } } }
      }
    });
  }

  function buildLine(canvas) {
    if (!canvas || !window.Chart) return null;
    const colors = chartColors();
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          { label: "Openness", data: [68, 72, 75, 77, 80, 82], borderColor: colors.primary, tension: 0.35 },
          { label: "Conscientiousness", data: [62, 66, 68, 70, 72, 74], borderColor: colors.secondary, tension: 0.35 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true, max: 100, grid: { color: colors.grid } } }
      }
    });
  }

  function initCommon() {
    applyTheme();
    renderNav();
    initLoading();
    initTooltips();
    initPasswordToggles();
    initPasswordMeters();
    initConsentRequiredLinks();
    initSessionWarning();
  }

  document.addEventListener("DOMContentLoaded", initCommon);

  return {
    traits,
    traitLabels,
    icons,
    candidates,
    baselineScores,
    sanitize,
    qs,
    qsa,
    getStoredUser,
    saveUser,
    dominantTrait,
    applyTheme,
    hasConsent,
    showToast,
    validateForm,
    buildRadar,
    buildBar,
    buildLine
  };
})();
