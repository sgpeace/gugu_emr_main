<<<<<<< Updated upstream
// patient_emr.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("patient_emr.js loaded");

    const emrForm = document.getElementById("new-emr-form");
    const toast = document.getElementById("custom-toast");

    emrForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(emrForm);

        try {
            const response = await fetch("/patient_emr/new_emr", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message || "저장되었습니다.");
                // 선택적으로 폼 리셋 또는 페이지 갱신 가능
                // emrForm.reset();
                // location.reload();
            } else {
                showToast(result.message || "저장 중 오류 발생", true);
            }
        } catch (error) {
            console.error("저장 요청 실패:", error);
            showToast("서버 오류가 발생했습니다.", true);
        }
    });

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.classList.remove("hidden");
        toast.classList.add(isError ? "error" : "success");

        setTimeout(() => {
            toast.classList.add("hidden");
            toast.classList.remove("error", "success");
        }, 3000);
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("record_date");
    const today = new Date().toISOString().split('T')[0];
    dateInput.max = today;
});


document.addEventListener("DOMContentLoaded", function () {
    // 날짜 선택 제한
    const dateInput = document.getElementById("record_date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today;

    // 나이 자동 계산
    const birthRaw = document.querySelector('input[name="birth_date"]').value;  // "yymmdd"
    if (birthRaw && birthRaw.length === 6) {
        const yy = parseInt(birthRaw.slice(0, 2), 10);
        const mm = parseInt(birthRaw.slice(2, 4), 10) - 1;  // JS월 0~11
        const dd = parseInt(birthRaw.slice(4, 6), 10);
        // 연도 보정: (00~현재)→2000대, 그 외→1900대
        const fullYear = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy;
        const birthDate = new Date(fullYear, mm, dd);
        const now = new Date();

        // 국제 나이 (만 나이)
        let intlAge = now.getFullYear() - birthDate.getFullYear();
        if (
            now.getMonth() < birthDate.getMonth() ||
            (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
        ) {
            intlAge--;
        }

        // 한국 나이
        const korAge = now.getFullYear() - birthDate.getFullYear() + 1;

        document.getElementById("age").value = `${korAge}세 (만${intlAge}세)`;
    }
});
=======
// patient_emr.js

// patient_emr.js
document.addEventListener("DOMContentLoaded", function () {
    console.log("patient_emr.js loaded");

    const emrForm = document.getElementById("new-emr-form");
    const toast = document.getElementById("custom-toast");

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
        if (!formData.get("age")) formData.delete("age");
        if (!formData.get("bt")) formData.delete("bt");
        if (!formData.get("bp2")) formData.delete("bp2");
        // …필요한 다른 tional 필드도 동일하게…


        try {
            const response = await fetch("/patient_emr/new_emr", {
                method: "POST",
                body: formData,
            });

            // 서버 에러(500 등)라면 JSON이 아닐 가능성이 높으니 text() 로 읽어주기
            if (!response.ok) {
                const errText = await response.text();
                console.error("서버 에러 응답:", errText);
                showToast("저장 중 오류 발생: " + (errText || response.statusText), true);
                return;
            }

            // OK면 JSON 파싱
            const result = await response.json();

            showToast(result.message || "저장되었습니다.");
            if (result.emr_id) {
                const name = encodeURIComponent(document.querySelector('input[name="name"]').value);
                const birth_date = encodeURIComponent(document.querySelector('input[name="birth_date"]').value);
                window.location.href = `/patient_emr?name=${name}&birth_date=${birth_date}&emr_id=${result.emr_id}`;
            }

        } catch (err) {
            console.error("저장 요청 실패:", err);
            showToast("서버 오류가 발생했습니다.", true);
        }
    });


    // ★ showToast 함수는 한 번만 선언
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.classList.remove("hidden");
        toast.classList.add(isError ? "error" : "success");

        setTimeout(() => {
            toast.classList.add("hidden");
            toast.classList.remove("error", "success");
        }, 3000);
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("record_date");
    const today = new Date().toISOString().split('T')[0];
    dateInput.max = today;
});


document.addEventListener("DOMContentLoaded", function () {
    // 날짜 선택 제한
    const dateInput = document.getElementById("record_date");
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today;

    // 나이 자동 계산
    const birthRaw = document.querySelector('input[name="birth_date"]').value;  // "yymmdd"
    if (birthRaw && birthRaw.length === 6) {
        const yy = parseInt(birthRaw.slice(0, 2), 10);
        const mm = parseInt(birthRaw.slice(2, 4), 10) - 1;  // JS월 0~11
        const dd = parseInt(birthRaw.slice(4, 6), 10);
        // 연도 보정: (00~현재)→2000대, 그 외→1900대
        const fullYear = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy;
        const birthDate = new Date(fullYear, mm, dd);
        const now = new Date();

        // 국제 나이 (만 나이)
        let intlAge = now.getFullYear() - birthDate.getFullYear();
        if (
            now.getMonth() < birthDate.getMonth() ||
            (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
        ) {
            intlAge--;
        }

        // 한국 나이
        const korAge = now.getFullYear() - birthDate.getFullYear() + 1;

        document.getElementById("age").value = `${korAge}세 (만${intlAge}세)`;
    }
});



document.querySelectorAll(".record-link").forEach(link => {
    link.addEventListener("click", async function (e) {
        e.preventDefault(); // 기본 동작 방지

        const visitDate = this.parentElement.getAttribute("data-visit-date");
        const name = document.querySelector("input[name='name']").value; // name 값 가져오기
        console.log("방문 날짜:", visitDate, "환자 이름:", name);

        try {
            // Fetch API로 /patient_emr/past_emr 엔드포인트 호출
            const response = await fetch(`/patient_emr/past_emr?visit_date=${visitDate}&name=${encodeURIComponent(name)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("진료 기록 데이터:", data);

            // 받은 데이터를 폼에 채워 넣기
            populateFormWithData(data);
        } catch (error) {
            console.error("진료 기록 조회 실패:", error);
            alert("진료 기록을 불러오는 데 실패했습니다.");
        }
    });
});


// 데이터를 폼에 채워 넣는 함수
function populateFormWithData(data) {
    // 방문 날짜
    document.getElementById("record_date").value = data.record_date;

    // Vital Signs
    document.querySelector("input[name='bp']").value = data.bp || "";
    document.querySelector("input[name='hr']").value = data.hr || "";
    document.querySelector("input[name='bst']").value = data.bst || "";
    document.querySelector("input[name='bt']").value = data.bt || "";

    // Symptoms (C.C.)
    document.querySelector("textarea[name='cc']").value = data.cc || "";

    // Onset, Duration, Assoc
    document.querySelector("input[name='onset']").value = data.onset || "";
    document.querySelector("input[name='duration']").value = data.duration || "";
    document.querySelector("input[name='assoc']").value = data.assoc || "";

    // History
    document.querySelector("input[name='medication_hx']").value = data.medication_hx || "";
    document.querySelector("input[name='pmhx']").value = data.pmhx || "";
    document.querySelector("input[name='allergy']").value = data.allergy || "";
    document.querySelector("input[name='fhx']").value = data.fhx || "";
    document.querySelector("input[name='social']").value = data.social || "";

    // P.I. (병력)
    document.querySelector("textarea[name='pi']").value = data.pi || "";

    // ROS
    document.querySelector("input[name='ros']").value = data.ros || "";

    // P/E
    document.querySelector("input[name='pe']").value = data.pe || "";

    // Problem list / Assessment
    document.querySelector("textarea[name='problem_list']").value = data.problem_list || "";
    document.querySelector("textarea[name='assessment']").value = data.assessment || "";

    // MMSE, CDR, PSQI, ISI
    document.querySelector("input[name='mmse']").value = data.mmse || "";
    document.querySelector("input[name='cdr']").value = data.cdr || "";
    document.querySelector("input[name='psqi']").value = data.psqi || "";
    document.querySelector("input[name='isi']").value = data.isi || "";
    document.querySelector("input[name='gds']").value = data.gds || "";

    // (4-1) Free input rows #1–4
    for (let i = 1; i <= 5; i++) {
        document.querySelector(`input[name='plan_desc_${i}']`).value = data[`plan_desc_${i}`] || "";
        document.querySelector(`input[name='plan_method_${i}']`).value = data[`plan_method_${i}`] || "";
        document.querySelector(`input[name='plan_period_${i}']`).value = data[`plan_period_${i}`] || "";
    }

    // (4-2) 파스
    if (data.plan_pas_6) {
        document.querySelector(`input[name='plan_pas_6'][value='${data.plan_pas_6}']`).checked = true;
    }
    if (data.plan_pas_period_6) {
        document.querySelector(`input[name='plan_pas_period_6'][value='${data.plan_pas_period_6}']`).checked = true;
    }

    // (4-3) 비타민제(삐콤)
    if (data.plan_bear_7) {
        document.querySelector(`input[name='plan_bear_7'][value='${data.plan_bear_7}']`).checked = true;
    }

    // (4-4) 근육통
    if (data.plan_anti_8) {
        document.querySelector(`input[name='plan_anti_8'][value='${data.plan_anti_8}']`).checked = true;
    }
    if (data.plan_ruma_8) {
        document.querySelector(`input[name='plan_ruma_8'][value='${data.plan_ruma_8}']`).checked = true;
    }

    // (4-5) 발백선
    document.querySelector("input[name='plan_tinea_site_9']").value = data.plan_tinea_site_9 || "";
    if (data.plan_tinea_9) {
        document.querySelector(`input[name='plan_tinea_9'][value='${data.plan_tinea_9}']`).checked = true;
    }

    // (4-6) 피부염
    document.querySelector("input[name='plan_derma_site_10']").value = data.plan_derma_site_10 || "";
    if (data.plan_derma_10) {
        document.querySelector(`input[name='plan_derma_10'][value='${data.plan_derma_10}']`).checked = true;
    }

    // (5) Medication Counseling
    document.querySelector("textarea[name='med_counseling']").value = data.med_counseling || "";

    // (6) IV Order
    if (data.iv_order) {
        document.querySelector(`input[name='iv_order'][value='${data.iv_order}']`).checked = true;
    }

    // (7) Signatures
    document.querySelector("input[name='sign_dr']").value = data.sign_dr || "";
}



// ─── 모달 관련 전체 코드 ────────────────────────────────────
const modal = document.getElementById('complete-modal');
const modalCC = document.getElementById('modal-cc');
const modalBP = document.getElementById('modal-bp');
const modalPlan = document.getElementById('modal-plan');
const modalIV = document.getElementById('modal-iv');
const modalSign = document.getElementById('modal-sign');
const modalError = document.getElementById('modal-error');
const btnComplete = document.querySelector('.btn-complete');
const btnClose = modal.querySelector('.close-button');
const btnCancel = document.getElementById('cancel-complete');
const btnConfirm = document.getElementById('confirm-complete');

// 2) “진료 완료” 버튼 클릭
btnComplete.addEventListener('click', () => {
    // CC, BP, Plan 읽기
    const ccVal = document.querySelector('textarea[name="cc"]').value.trim();
    const bpVal = document.querySelector('input[name="bp"]').value.trim();
    const planVal = Array.from(document.querySelectorAll('input[name^="plan_desc_"]'))
        .map(el => el.value.trim())
        .filter(v => v)
        .join('; ');
    // IV Order 읽기
    const ivRadio = document.querySelector('input[name="iv_order"]:checked');
    const ivVal = ivRadio ? ivRadio.value : '';

    // 모달에 값 채우기
    modalCC.textContent = ccVal || '미입력';
    modalBP.textContent = bpVal || '미입력';
    modalPlan.textContent = planVal || '미입력';
    modalIV.textContent = ivVal || '미입력';

    modalSign.value = '';
    modalError.textContent = '';
    modal.style.display = 'block';
});

// 3) 모달 닫기
function closeModal() { modal.style.display = 'none'; }
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);
window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});

// 4) 확인 버튼
btnConfirm.addEventListener('click', e => {
    e.preventDefault();  // 폼 서밋 방지

    const userSign = modalSign.value.trim();
    const realSign = document.querySelector('input[name="sign_dr"]').value.trim();
    if (userSign !== realSign) {
        modalError.textContent = '서명이 일치하지 않습니다. 다시 확인하세요.';
        return;
    }

    // URL query에서 emr_id 꺼내기
    const params = new URLSearchParams(window.location.search);
    const emrId = params.get('emr_id') || '';

    const name = document.querySelector('input[name="name"]').value;
    const birth = document.querySelector('input[name="birth_date"]').value;
    const ivRadio2 = document.querySelector('input[name="iv_order"]:checked');
    const ivFlag = ivRadio2 ? ivRadio2.value : '';

    // 세션에 저장 (대시보드로 전달될 정보)
    sessionStorage.setItem(
        'completedPatient',
        `${name}||${birth}||${ivFlag}||${emrId}`
    );

    // 대시보드로 이동
    window.location.href = '/dashboard';
});



document.addEventListener("DOMContentLoaded", function () {
  // 1) 버튼 및 팝업 요소 참조
  const openNotesBtn   = document.getElementById("open-notes-popup");
  const notesOverlay   = document.getElementById("notes-popup-overlay");
  const saveNotesBtn   = document.getElementById("save-patient-notes");
  const cancelNotesBtn = document.getElementById("cancel-patient-notes");
  const notesTextarea  = document.getElementById("patient-notes-textarea");

  // (A) “환자 비고” 버튼 클릭 → 팝업 열기 및 기존 메모 불러오기
  openNotesBtn.addEventListener("click", () => {
    fetch(
      `/patient_emr/get_patient_notes?name=${encodeURIComponent(NAME)}&birth_date=${encodeURIComponent(BIRTH_DATE)}`
    )
      .then(res => {
        if (!res.ok) return Promise.reject();
        return res.json();
      })
      .then(data => {
        // 서버에서 받아온 notes 내용을 textarea에 채우기
        notesTextarea.value = data.notes || "";
        notesOverlay.style.display = "flex";  // 팝업 보이기
      })
      .catch(() => {
        // 에러가 나도 빈 textarea로 띄워줌
        notesTextarea.value = "";
        notesOverlay.style.display = "flex";
      });
  });

  // (B) “닫기” 버튼 클릭 → 팝업 숨기기
  cancelNotesBtn.addEventListener("click", () => {
    notesOverlay.style.display = "none";
  });
  // 팝업 배경 클릭 시에도 닫기
  notesOverlay.addEventListener("click", e => {
    if (e.target === notesOverlay) {
      notesOverlay.style.display = "none";
    }
  });

  // (C) “저장” 버튼 클릭 → 메모를 서버에 저장
  saveNotesBtn.addEventListener("click", () => {
    const notesText = notesTextarea.value.trim();

    fetch("/patient_emr/save_patient_notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: NAME,
        birth_date: BIRTH_DATE,
        notes: notesText
      })
    })
      .then(res => {
        if (!res.ok) {
          // 에러 응답(JSON) 파싱 후 throw
          return res.json().then(data => {
            throw new Error(data.detail || data.message || "저장 실패");
          });
        }
        return res.json();
      })
      .then(() => {
        alert("환자 비고가 저장되었습니다.");
        notesOverlay.style.display = "none";
      })
      .catch(err => {
        console.error(err);
        alert("환자 비고 저장 중 오류가 발생했습니다.");
      });
  });
});
// ─────────────────────────────────────────────────────────────────────────
>>>>>>> Stashed changes
