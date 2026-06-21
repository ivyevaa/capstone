document.addEventListener("DOMContentLoaded", () => {
  const loginForm = TraitTracker.qs("#loginForm");
  const registerForm = TraitTracker.qs("#registerForm");
  const forgotForm = TraitTracker.qs("#forgotForm");

  const showFormError = (selector, message) => {
    const alert = TraitTracker.qs(selector);
    if (!alert) return;
    alert.textContent = message;
    alert.classList.remove("d-none");
    alert.focus();
  };

  const clearFormError = (selector) => {
    const alert = TraitTracker.qs(selector);
    if (!alert) return;
    alert.textContent = "";
    alert.classList.add("d-none");
  };

  const setSubmitting = (form, submitting) => {
    const button = TraitTracker.qs("button[type='submit']", form);
    if (!button) return;
    button.disabled = submitting;
    TraitTracker.qs(".spinner-border", button)?.classList.toggle("d-none", !submitting);
  };

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError("#loginAlert");
    if (!TraitTracker.validateForm(loginForm)) return;
    const identifier = TraitTracker.sanitize(TraitTracker.qs("#loginIdentifier").value.trim().toLowerCase());
    const password = TraitTracker.qs("#loginPassword").value;
    setSubmitting(loginForm, true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to sign in.");
      const role = payload.user.role || "Candidate";
      const existing = TraitTracker.getStoredUser();
      const accountEmail = payload.user.email || identifier;
      const displayName = payload.user.name || (existing.email === accountEmail ? existing.name : identifier.split("@")[0]);
      TraitTracker.saveUser({ ...payload.user, email: accountEmail, name: displayName });
      TraitTracker.setAuthenticated(true, TraitTracker.qs("#rememberMe").checked);
      localStorage.removeItem("ttConsent");
      TraitTracker.showToast("Login successful. Security consent is required before assessment.", "success");
      setTimeout(() => {
        const requestedPage = sessionStorage.getItem("ttPostLoginRedirect");
        sessionStorage.removeItem("ttPostLoginRedirect");
        window.location.href = requestedPage || (role === "Admin" ? "admin-dashboard.html" : role === "Company" ? "company-dashboard.html" : "candidate-dashboard.html");
      }, 500);
    } catch (error) {
      showFormError("#loginAlert", error.message === "Failed to fetch" ? "The server could not be reached. Please try again." : error.message);
      setSubmitting(loginForm, false);
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError("#registerAlert");
    if (!TraitTracker.validateForm(registerForm)) return;
    const password = TraitTracker.qs("#registerPassword").value;
    const confirm = TraitTracker.qs("#confirmPassword").value;
    if (password !== confirm) {
      TraitTracker.qs("#confirmPassword").setCustomValidity("Passwords must match.");
      registerForm.classList.add("was-validated");
      return;
    }
    TraitTracker.qs("#confirmPassword").setCustomValidity("");
    const email = TraitTracker.sanitize(TraitTracker.qs("#registerEmail").value.trim().toLowerCase());
    const name = TraitTracker.sanitize(TraitTracker.qs("#fullName").value.trim());
    setSubmitting(registerForm, true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "Candidate" })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Unable to create this account.");
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const loginPayload = await loginResponse.json();
      if (!loginResponse.ok) throw new Error("Account created. Please sign in to continue.");
      TraitTracker.saveUser({ ...loginPayload.user, name });
      TraitTracker.setAuthenticated(true, false);
      localStorage.removeItem("ttConsent");
      TraitTracker.showToast("Account created. Review consent before starting.", "success");
      setTimeout(() => window.location.href = "consent.html", 550);
    } catch (error) {
      showFormError("#registerAlert", error.message === "Failed to fetch" ? "The server could not be reached. Please try again." : error.message);
      setSubmitting(registerForm, false);
    }
  });

  forgotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!TraitTracker.validateForm(forgotForm)) return;
    TraitTracker.showToast("Password reset instructions have been queued for this account.", "info");
    bootstrap.Modal.getOrCreateInstance(TraitTracker.qs("#forgotPasswordModal")).hide();
  });

  if (new URLSearchParams(window.location.search).get("expired") === "1") {
    showFormError("#loginAlert", "Your session expired to protect your private results. Please sign in again.");
  }
  if (new URLSearchParams(window.location.search).get("required") === "1") {
    showFormError("#loginAlert", "Log in first. You will then be asked to accept the privacy and security agreement.");
  }
});
