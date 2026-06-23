document.addEventListener("DOMContentLoaded", () => {
  const form       = document.getElementById("pha-form");
  const toast      = document.getElementById("custom-toast");
  const planTable  = document.getElementById("pha-plan-table");
  const planEditBtn = document.getElementById("plan-edit-btn");
  let planEditMode = false;

  // ── view span 을 현재 입력값으로 동기화 ─────────────────────
  function syncViewFromEdit() {
    // 1. 텍스트 입력 → span.plan-view
    planTable.querySelectorAll("input.plan-edit[type='text']").forEach(input => {
      const view = input.parentElement.querySelector(".plan-view");
      if (view) view.textContent = input.value;
    });

    // 2. 라디오 그룹 → span.plan-view (checked 값)
    planTable.querySelectorAll("span.plan-edit.radio-group").forEach(group => {
      const view    = group.parentElement.querySelector(".plan-view");
      const checked = group.querySelector("input[type='radio']:checked");
      if (view) view.textContent = checked ? checked.value : "";
    });
  }

  // ── 편집 모드 전환 ───────────────────────────────────────────
  function setPlanEditMode(on) {
    if (!on) {
      // 뷰 모드로 전환 직전: 입력값을 span에 반영
      syncViewFromEdit();
    }
    planEditMode = on;
    planTable.classList.toggle("editing", on);
    planEditBtn.textContent = on ? "수정 완료" : "수정";
    planEditBtn.classList.toggle("btn-plan-edit-active", on);
  }

  // 초기: 뷰 모드
  setPlanEditMode(false);

  planEditBtn.addEventListener("click", () => {
    setPlanEditMode(!planEditMode);
  });

  // ── 약국부장 체크박스 ──────────────────────────────────────
  const signCheck  = document.getElementById("sign_pharmacist_check");
  const signHidden = document.getElementById("sign_pharmacist_hidden");
  signCheck.addEventListener("change", () => {
    signHidden.value = signCheck.checked ? "확인" : "";
  });

  // ── 폼 제출 ───────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 수정 모드 중이면 뷰로 복귀 (view span 동기화 포함)
    if (planEditMode) setPlanEditMode(false);

    try {
      const currentStatus  = document.getElementById("current_status").value || "";
      const registrationId = document.getElementById("registration_id").value;
      let updatedStatus = currentStatus.replace("복약", "").trim();
      if (!updatedStatus) updatedStatus = "완료";

      const formData = new FormData(form);
      formData.set("current_status",   updatedStatus);
      formData.set("registration_id",  registrationId);

      const res = await fetch("/patient_emr_pha", {
        method: "POST",
        body:   formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        showToast(errText || "저장 중 오류가 발생했습니다.", true);
        return;
      }

      const data = await res.json();
      showToast(data.message || "저장이 완료되었습니다.");
      setTimeout(() => { window.location.href = "/dashboard"; }, 600);

    } catch (err) {
      console.error(err);
      showToast("서버와 통신 중 오류가 발생했습니다.", true);
    }
  });

  function showToast(message, isError = false) {
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed", right: "20px", bottom: "20px",
      zIndex: "9999", padding: "12px 16px", borderRadius: "8px",
      color: "#fff",
      background: isError ? "#c0392b" : "#2b2f36",
    });
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }
});
