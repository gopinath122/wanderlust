// public/js/loading.js

// 1. Find all forms that need validation
const forms = document.querySelectorAll(".needs-validation");

// 2. Loop over them
Array.from(forms).forEach((form) => {
  form.addEventListener(
    "submit",
    (event) => {
      // Check if the form is valid (all required fields are filled)
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        console.log("Form is invalid"); // Debugging
      } else {
        console.log("Form is valid, showing loading spinner..."); // Debugging

        // Find the submit button
        const btn = form.querySelector("button");

        if (btn) {
          // Disable the button to prevent double-clicking
          btn.classList.add("disabled");

          // Change the text to a spinner
          btn.innerHTML =
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Please wait...';
        }
      }

      form.classList.add("was-validated");
    },
    false
  );
});
