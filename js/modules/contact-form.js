const WEB3FORMS_PLACEHOLDER = "REPLACE_WITH_WEB3FORMS_ACCESS_KEY";

function setStatus(form, message, state) {
  const status = form.querySelector("[data-contact-status]");

  if (!status) {
    return;
  }

  status.textContent = message;
  status.dataset.state = state;
}

export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const submitButton = form.querySelector("[type='submit']");

  form.addEventListener("submit", async (event) => {
    const accessKey = form.querySelector("input[name='access_key']")?.value ?? "";

    if (!accessKey || accessKey === WEB3FORMS_PLACEHOLDER) {
      event.preventDefault();
      setStatus(form, "Add the Web3Forms access key before this form can send inquiries.", "warning");
      return;
    }

    event.preventDefault();
    setStatus(form, "Sending inquiry...", "pending");
    submitButton?.setAttribute("disabled", "true");

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      form.reset();
      setStatus(form, "Inquiry sent. We'll reply with next steps soon.", "success");
    } catch (error) {
      setStatus(form, "Something went wrong. Please email info@ripple-edit.com instead.", "error");
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
