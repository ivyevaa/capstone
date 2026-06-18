document.addEventListener("DOMContentLoaded", () => {
  const loginForm = TraitTracker.qs("#loginForm");
  const registerForm = TraitTracker.qs("#registerForm");
  const forgotForm = TraitTracker.qs("#forgotForm");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!TraitTracker.validateForm(loginForm)) return;
    const email = TraitTracker.sanitize(TraitTracker.qs("#loginEmail").value.trim().toLowerCase());
    const role = "Candidate";
    TraitTracker.saveUser({ email, name: email.split("@")[0], role });
    TraitTracker.showToast("Login successful. Redirecting to your dashboard.", "success");
    setTimeout(() => {
      window.location.href = role === "Admin" ? "admin-dashboard.html" : role === "Company" ? "company-dashboard.html" : "candidate-dashboard.html";
    }, 750);
  });

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!TraitTracker.validateForm(registerForm)) return;
    const password = TraitTracker.qs("#registerPassword").value;
    const confirm = TraitTracker.qs("#confirmPassword").value;
    if (password !== confirm) {
      TraitTracker.qs("#confirmPassword").setCustomValidity("Passwords must match.");
      registerForm.classList.add("was-validated");
      return;
    }
    const email = TraitTracker.sanitize(TraitTracker.qs("#registerEmail").value.trim().toLowerCase());
    const name = TraitTracker.sanitize(TraitTracker.qs("#fullName").value.trim());
    const role = "Candidate";
    TraitTracker.saveUser({ email, name, role });
    TraitTracker.showToast("Account created. Consent is required before assessment.", "success");
    setTimeout(() => {
      window.location.href = role === "Candidate" ? "consent.html" : "login.html";
    }, 850);
  });

  forgotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!TraitTracker.validateForm(forgotForm)) return;
    TraitTracker.showToast("Password reset instructions have been queued for this account.", "info");
    bootstrap.Modal.getOrCreateInstance(TraitTracker.qs("#forgotPasswordModal")).hide();
  });
});
