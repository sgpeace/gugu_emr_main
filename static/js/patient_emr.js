// patient_emr.js
document.addEventListener("DOMContentLoaded", function () {
  console.log("patient_emr.js loaded");

  // ===== 공통 엘리먼트 =====
  const emrForm = document.getElementById("new-emr-form");
  const toast = document.getElementById("custom-toast");

  // ===== 공통 유틸: 폼 요소 value 세팅 (input/textarea/select 상관없이) =====
  function setVal(scopeEl, name, value) {
    if (!scopeEl) return;
    const el = scopeEl.querySelector(`[name='${name}']`);
    if (!el) return;
    el.value = value ?? "";
  }

  // ===== 공통 유틸: 라디오 체크 =====
  function checkRadio(scopeEl, name, value) {
    if (!scopeEl || value == null || value === "") return;
    const el = scopeEl.querySelector(`input[type="radio"][name='${name}'][value='${value}']`);
    if (el) el.checked = true;
  }

  // ===== Toast =====
  function showToast(message, isError = false) {
    if (!toast) {
      alert(message);
      return;
    }
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.remove("error", "success");
    toast.classList.add(isError ? "error" : "success");

    setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("error", "success");
    }, 3000);
  }

  // ===== 날짜 자동 세팅 (오늘 이후 선택 방지 + 비어있을 때만 오늘 자동 입력) =====
  const dateInput = document.getElementById("record_date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today;
    if (!dateInput.value) dateInput.value = today;
  }

  // ===== EMR 전체 저장 (submit) =====
  if (emrForm) {
    emrForm.addEventListener("submit", async function (e) {
      // 1) HTML5 기본 검증
      if (!emrForm.checkValidity()) {
        emrForm.reportValidity();
        return;
      }

      // 2) preventDefault 호출은 검증 통과 후
      e.preventDefault();

      // 3) FormData 생성
      const formData = new FormData(emrForm);

      // 4) 빈(optional) 필드 삭제
      if (!formData.get("emr_id")) formData.delete("emr_id");
      if (!formData.get("bt")) formData.delete("bt");
      if (!formData.get("bp2")) formData.delete("bp2");
      if (!formData.get("age")) formData.delete("age");
      // ...필요한 다른 optional 필드도 동일하게...

      try {
        const response = await fetch("/patient_emr/new_emr", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("서버 에러 응답:", errText);
          showToast("저장 중 오류 발생: " + (errText || response.statusText), true);
          return;
        }

        const result = await response.json();
        showToast(result.message || "저장되었습니다.");
      } catch (err) {
        console.error("저장 요청 실패:", err);
        showToast("서버 오류가 발생했습니다.", true);
      }
    });
  }

  // ===== 과거 진료 기록 토글 =====
  const pastPanel = document.getElementById("past-panel-body");
  const togglePastBtn = document.getElementById("toggle-past-btn");
  if (pastPanel && togglePastBtn) {
    togglePastBtn.addEventListener("click", () => {
      pastPanel.classList.toggle("hidden");
      const isHidden = pastPanel.classList.contains("hidden");
      togglePastBtn.textContent = isHidden ? "보이기" : "숨기기";
    });
  }

  // ===== 과거 기록 불러오기 (birth_date 포함) =====
  document.querySelectorAll(".record-link").forEach((link) => {
    link.addEventListener("click", async function (e) {
      e.preventDefault();

      const visitDate = this.parentElement.getAttribute("data-visit-date");
      const name = document.querySelector("input[name='name']")?.value || "";
      const birthDate = document.querySelector("input[name='birth_date']")?.value || "";

      console.log("방문 날짜:", visitDate, "환자 이름:", name, "생년월일:", birthDate);

      if (!visitDate || !name || !birthDate) {
        alert("visit_date / name / birth_date 값을 찾을 수 없습니다.");
        return;
      }

      try {
        const url =
          `/patient_emr/past_emr?` +
          `visit_date=${encodeURIComponent(visitDate)}` +
          `&name=${encodeURIComponent(name)}` +
          `&birth_date=${encodeURIComponent(birthDate)}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errText = await response.text();
          console.error("과거 기록 조회 에러:", errText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("진료 기록 데이터:", data);

        populatePastForm(data); // 아래 함수 호출
      } catch (error) {
        console.error("진료 기록 조회 실패:", error);
        alert("진료 기록을 불러오는 데 실패했습니다.");
      }
    });
  });

  // ===== Vital 저장 버튼 =====
  const saveVitalsBtn = document.getElementById("save-vitals-btn");
  if (saveVitalsBtn) {
    saveVitalsBtn.addEventListener("click", async () => {
      const name = document.querySelector("input[name='name']")?.value || "";
      const birth = document.querySelector("input[name='birth_date']")?.value || "";

      const gender = document.querySelector("select[name='gender']")?.value || "";
      const age = document.querySelector("[name='age']")?.value?.trim() || "";

      const bt = document.querySelector("[name='bt']")?.value?.trim() || "";
      const bp = document.querySelector("[name='bp']")?.value?.trim() || "";
      const hr = document.querySelector("[name='hr']")?.value?.trim() || "";
      const bp2 = document.querySelector("[name='bp2']")?.value?.trim() || "";
      const bst = document.querySelector("[name='bst']")?.value?.trim() || "";
      const post_bst = document.querySelector("[name='post_bst']")?.value?.trim() || "";

      let record_date = document.getElementById("record_date")?.value || "";
      if (!record_date) {
        record_date = new Date().toISOString().split("T")[0];
        const el = document.getElementById("record_date");
        if (el) el.value = record_date;
      }

      if (!name || !birth) {
        alert("환자 name / birth_date 값을 찾을 수 없습니다.");
        return;
      }
      if (!gender) {
        alert("gender(성별) 값이 비어있습니다. 성별을 선택/입력해주세요.");
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("birth_date", birth);
      formData.append("record_date", record_date);
      formData.append("gender", gender);
      formData.append("age", age);

      formData.append("bt", bt);
      formData.append("bp", bp);
      formData.append("hr", hr);
      formData.append("bp2", bp2);
      formData.append("bst", bst);
      formData.append("post_bst", post_bst);

      try {
        const res = await fetch("/patient_emr/vitals", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Vital 저장 실패 응답:", errText);
          alert("Vital 저장 실패: " + (errText || res.statusText));
          return;
        }

        window.location.href = "/dashboard";
      } catch (e) {
        console.error(e);
        alert("서버 오류로 Vital 저장 실패");
      }
    });
  }

  // ===== 모달(진료 완료) =====
  const modal = document.getElementById("complete-modal");
  if (modal) {
    const modalCC = document.getElementById("modal-cc");
    const modalBP = document.getElementById("modal-bp");
    const modalPlan = document.getElementById("modal-plan");
    const modalIV = document.getElementById("modal-iv");
    const modalSign = document.getElementById("modal-sign");
    const modalError = document.getElementById("modal-error");

    const btnComplete = document.querySelector(".btn-complete");
    const btnClose = modal.querySelector(".close-button");
    const btnCancel = document.getElementById("cancel-complete");
    const btnConfirm = document.getElementById("confirm-complete");

    function closeModal() {
      modal.style.display = "none";
    }

    btnComplete?.addEventListener("click", () => {
      const ccVal = document.querySelector('[name="cc"]')?.value?.trim() || "";
      const bpVal = document.querySelector('[name="bp"]')?.value?.trim() || "";

      const planVal = Array.from(document.querySelectorAll('[name^="plan_desc_"]'))
        .map((el) => (el.value || "").trim())
        .filter((v) => v)
        .join("; ");

      const ivRadio = document.querySelector('input[name="iv_order"]:checked');
      const ivVal = ivRadio ? ivRadio.value : "";

      if (modalCC) modalCC.textContent = ccVal || "미입력";
      if (modalBP) modalBP.textContent = bpVal || "미입력";
      if (modalPlan) modalPlan.textContent = planVal || "미입력";
      if (modalIV) modalIV.textContent = ivVal || "미입력";

      if (modalSign) modalSign.value = "";
      if (modalError) modalError.textContent = "";
      modal.style.display = "block";
    });

    btnClose?.addEventListener("click", closeModal);
    btnCancel?.addEventListener("click", closeModal);

    window.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    btnConfirm?.addEventListener("click", async (e) => {
      e.preventDefault();

      const userSign = modalSign?.value?.trim() || "";
      const realSign = document.querySelector('[name="sign_dr"]')?.value?.trim() || "";

      if (userSign !== realSign) {
        if (modalError) modalError.textContent = "서명이 일치하지 않습니다. 다시 확인하세요.";
        return;
      }

      const name = document.querySelector("input[name='name']")?.value || "";
      const birth = document.querySelector("input[name='birth_date']")?.value || "";
      const ivRadio = document.querySelector('input[name="iv_order"]:checked');
      const ivFlag = ivRadio ? ivRadio.value : "";

      const newStatus = ivFlag === "O" ? "수액대기중 복약" : "복약";

      try {
        const response = await fetch(`/dashboard/update_status_by_identity`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, birth_date: birth, status: newStatus }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("상태 업데이트 실패 응답:", errText);
          throw new Error("상태 업데이트 실패");
        }

        window.location.href = "/dashboard";
      } catch (error) {
        console.error("상태 업데이트 오류:", error);
        alert("환자 상태 업데이트에 실패했습니다.");
      }
    });
  }

  // ===== 과거 기록 채우기 함수는 아래(전역) 정의되어 있으므로 여기서는 끝 =====
});

// ===== 과거 기록 채우기 함수 (태그(input/textarea) 무관하게 동작하도록 수정) =====
function populatePastForm(data) {
  const pastForm = document.getElementById("past-emr-form");
  if (!pastForm) return;

  // 안전 세터: input/textarea/select 모두 지원
  const setVal = (name, value) => {
    const el = pastForm.querySelector(`[name='${name}']`);
    if (!el) return;
    el.value = value ?? "";
  };

  // 라디오 체크
  const checkRadio = (name, value) => {
    if (value == null || value === "") return;
    const el = pastForm.querySelector(`input[type="radio"][name='${name}'][value='${value}']`);
    if (el) el.checked = true;
  };

  // Date / Header
  setVal("record_date", data.record_date);
  setVal("display_name", data.name);
  setVal("age", data.age);

  // 성별 select (disabled여도 selected 세팅 가능)
  const genderSelect = pastForm.querySelector("select[name='gender']");
  if (genderSelect) {
    Array.from(genderSelect.options).forEach((opt) => {
      opt.selected = opt.text === data.gender || opt.value === data.gender;
    });
  }

  // Vital signs
  setVal("bt", data.bt);
  setVal("bp", data.bp);
  setVal("hr", data.hr);
  setVal("bp2", data.bp2);
  setVal("bst", data.bst);
  setVal("post_bst", data.post_bst);

  // CC / PI / ROS / PE
  setVal("cc", data.cc);
  setVal("pi", data.pi);
  setVal("ros", data.ros);
  setVal("pe", data.pe);

  // History
  setVal("medication_hx", data.medication_hx);
  setVal("pmhx", data.pmhx);
  setVal("allergy", data.allergy);
  setVal("fhx", data.fhx);
  setVal("social", data.social);

  // Problem list / Assessment
  setVal("problem_list", data.problem_list);
  setVal("assessment", data.assessment);

  // N/Ex
  setVal("mmse", data.mmse);
  setVal("cdr", data.cdr);
  setVal("psqi", data.psqi);
  setVal("isi", data.isi);
  setVal("gds", data.gds);

  // 라디오(인지/수면/우울) — 서버가 'O'/'X' 또는 true/false 등을 줄 수 있으니 O만 체크
  if (data.ne_cog === "O") checkRadio("ne_cog", "O");
  if (data.ne_sleep === "O") checkRadio("ne_sleep", "O");
  if (data.ne_depress === "O") checkRadio("ne_depress", "O");

  // Plan free input rows 1~5
  for (let i = 1; i <= 5; i++) {
    setVal(`plan_desc_${i}`, data[`plan_desc_${i}`]);
    setVal(`plan_method_${i}`, data[`plan_method_${i}`]);
    setVal(`plan_period_${i}`, data[`plan_period_${i}`]);
  }

  // Plan radios
  if (data.plan_pas_6) checkRadio("plan_pas_6", data.plan_pas_6);
  if (data.plan_pas_period_6) checkRadio("plan_pas_period_6", data.plan_pas_period_6);

  if (data.plan_bear_7) checkRadio("plan_bear_7", data.plan_bear_7);

  if (data.plan_anti_8) checkRadio("plan_anti_8", data.plan_anti_8);
  if (data.plan_ruma_8) checkRadio("plan_ruma_8", data.plan_ruma_8);

  // 발백선/피부염 (site + radio)
  setVal("plan_tinea_site_9", data.plan_tinea_site_9);
  if (data.plan_tinea_9) checkRadio("plan_tinea_9", data.plan_tinea_9);

  setVal("plan_derma_site_10", data.plan_derma_site_10);
  if (data.plan_derma_10) checkRadio("plan_derma_10", data.plan_derma_10);

  // Medication counseling
  setVal("med_counseling", data.med_counseling);

  // IV order
  if (data.iv_order) checkRadio("iv_order", data.iv_order);

  // Signature
  setVal("sign_dr", data.sign_dr);
}

