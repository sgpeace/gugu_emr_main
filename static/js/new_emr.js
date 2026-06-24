document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("basic-info-form");

  // ===== Toast =====
  function showToast(message, isError = false) {
    const toast = document.getElementById("custom-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden", "error", "success");
    toast.classList.add(isError ? "error" : "success");
    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("error", "success");
    }, 3000);
  }

  // ===== 저장 =====
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/patient_emr/new_patient_chart/information", {
        method: "POST",
        body: new FormData(form),
      });

      if (response.ok) {
        showToast("저장이 완료되었습니다.");
      } else {
        const errText = await response.text();
        showToast("저장에 실패했습니다: " + errText, true);
      }
    } catch {
      showToast("저장 중 오류가 발생했습니다.", true);
    }
  });

  // ===== 뒤로가기 =====
  const backButton = document.getElementById("back-button");
  backButton?.addEventListener("click", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    const birthDate = urlParams.get("birth_date");
    window.location.href = `/patient_emr?name=${encodeURIComponent(name)}&birth_date=${encodeURIComponent(birthDate)}`;
  });
});
