document.addEventListener("DOMContentLoaded", () => {
  const form  = document.getElementById("pha-form");
  const toast = document.getElementById("custom-toast");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 기본 제출 막기

    try {
      const res = await fetch("/patient_emr_pha", {
        method: "POST",
        body: new FormData(form),
      });

      if (!res.ok) {
        const errText = await res.text();
        showToast(errText || "저장 중 오류가 발생했습니다.", true);
        return;
      }

      const data = await res.json();
      showToast(data.message || "저장이 완료되었습니다.");

      // ✅ 대시보드에서 제거할 환자 식별값 저장
      const name  = document.getElementById("patient_name").value;
      const birth = document.getElementById("patient_birth").value;
      sessionStorage.setItem("pharmacyCompleted", `${name}||${birth}`);

      // ✅ UX: 바로 대시보드로 이동 (원치 않으면 이 줄만 주석 처리)
      setTimeout(() => { window.location.href = "/dashboard"; }, 600);

    } catch (err) {
      console.error(err);
      showToast("서버와 통신 중 오류가 발생했습니다.", true);
    }
  });

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "20px";
    toast.style.bottom = "20px";
    toast.style.zIndex = "9999";
    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "8px";
    toast.style.color = "#fff";
    toast.style.background = isError ? "#c0392b" : "#2b2f36";
    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
});