// public/js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // Flash messages auto-dismiss
  const alertMessages = document.querySelectorAll(".alert");
  alertMessages.forEach((alert) => {
    setTimeout(() => {
      alert.classList.add("fade");
      setTimeout(() => {
        alert.remove();
      }, 500);
    }, 3000);
  });

  // Password strength validation
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach((field) => {
    field.addEventListener("input", () => {
      const password = field.value;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const isLongEnough = password.length >= 8;

      // Update password strength indicator if it exists
      const strengthIndicator =
        field.parentElement.querySelector(".password-strength");
      if (strengthIndicator) {
        let strength = 0;
        let strengthText = "";

        if (hasUpperCase) strength++;
        if (hasLowerCase) strength++;
        if (hasNumber) strength++;
        if (isLongEnough) strength++;

        switch (strength) {
          case 0:
          case 1:
            strengthText = "Weak";
            strengthIndicator.className = "password-strength text-danger";
            break;
          case 2:
          case 3:
            strengthText = "Medium";
            strengthIndicator.className = "password-strength text-warning";
            break;
          case 4:
            strengthText = "Strong";
            strengthIndicator.className = "password-strength text-success";
            break;
        }

        strengthIndicator.textContent = strengthText;
      }
    });
  });
});
