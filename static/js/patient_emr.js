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
        if (!formData.get("bt")) formData.delete("bt");
        if (!formData.get("bp2")) formData.delete("bp2");
        if (!formData.get("age")) formData.delete("age");
        // …필요한 다른 optional 필드도 동일하게…


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
            // if (result.emr_id) {
            //     const name = encodeURIComponent(document.querySelector('input[name="name"]').value);
            //     const birth_date = encodeURIComponent(document.querySelector('input[name="birth_date"]').value);
            //     window.location.href = `/patient_emr?name=${name}&birth_date=${birth_date}&emr_id=${result.emr_id}`;
            // }

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
            populatePastForm(data);
        } catch (error) {
            console.error("진료 기록 조회 실패:", error);
            alert("진료 기록을 불러오는 데 실패했습니다.");
        }
    });
});

function populatePastForm(data) {
    const pastForm = document.getElementById("past-emr-form");
    if (!pastForm) return;

    // Date
    pastForm.querySelector("input[name='record_date']").value = data.record_date || "";

    // Header
    pastForm.querySelector("input[name='display_name']").value = data.name || "";
    pastForm.querySelector("input[name='age']").value = data.age || "";

    // 성별 select
    const genderSelect = pastForm.querySelector("select[name='gender']");
    if (genderSelect) {
        Array.from(genderSelect.options).forEach(opt => {
            opt.selected = (opt.text === data.gender);
        });
    }

    // Vital signs
    pastForm.querySelector("input[name='bt']").value = data.bt || "";
    pastForm.querySelector("input[name='bp']").value = data.bp || "";
    pastForm.querySelector("input[name='hr']").value = data.hr || "";
    pastForm.querySelector("input[name='bp2']").value = data.bp2 || "";
    pastForm.querySelector("input[name='bst']").value = data.bst || "";
    pastForm.querySelector("input[name='post_bst']").value = data.post_bst || "";

    // CC & onset/duration/assoc
    pastForm.querySelector("textarea[name='cc']").value = data.cc || "";
    pastForm.querySelector("input[name='onset']").value = data.onset || "";
    pastForm.querySelector("input[name='duration']").value = data.duration || "";
    pastForm.querySelector("input[name='assoc']").value = data.assoc || "";

    // History
    pastForm.querySelector("input[name='medication_hx']").value = data.medication_hx || "";
    pastForm.querySelector("input[name='pmhx']").value = data.pmhx || "";
    pastForm.querySelector("input[name='allergy']").value = data.allergy || "";
    pastForm.querySelector("input[name='fhx']").value = data.fhx || "";
    pastForm.querySelector("input[name='social']").value = data.social || "";

    // PI, ROS, PE
    pastForm.querySelector("textarea[name='pi']").value = data.pi || "";
    pastForm.querySelector("input[name='ros']").value = data.ros || "";
    pastForm.querySelector("input[name='pe']").value = data.pe || "";

    // Problem list, Assessment
    pastForm.querySelector("textarea[name='problem_list']").value = data.problem_list || "";
    pastForm.querySelector("textarea[name='assessment']").value = data.assessment || "";

    // N/Ex
    pastForm.querySelector("input[name='mmse']").value = data.mmse || "";
    pastForm.querySelector("input[name='cdr']").value = data.cdr || "";
    pastForm.querySelector("input[name='psqi']").value = data.psqi || "";
    pastForm.querySelector("input[name='isi']").value = data.isi || "";
    pastForm.querySelector("input[name='gds']").value = data.gds || "";

    if (data.ne_cog === "O") {
        pastForm.querySelector("input[name='ne_cog'][value='O']").checked = true;
    }
    if (data.ne_sleep === "O") {
        pastForm.querySelector("input[name='ne_sleep'][value='O']").checked = true;
    }
    if (data.ne_depress === "O") {
        pastForm.querySelector("input[name='ne_depress'][value='O']").checked = true;
    }

    // Plan free input rows
    for (let i = 1; i <= 5; i++) {
        pastForm.querySelector(`input[name='plan_desc_${i}']`).value = data[`plan_desc_${i}`] || "";
        pastForm.querySelector(`input[name='plan_method_${i}']`).value = data[`plan_method_${i}`] || "";
        pastForm.querySelector(`input[name='plan_period_${i}']`).value = data[`plan_period_${i}`] || "";
    }

    // 파스
    if (data.plan_pas_6) {
        pastForm.querySelector(`input[name='plan_pas_6'][value='${data.plan_pas_6}']`).checked = true;
    }
    if (data.plan_pas_period_6) {
        pastForm.querySelector(`input[name='plan_pas_period_6'][value='${data.plan_pas_period_6}']`).checked = true;
    }

    // 삐콤
    if (data.plan_bear_7) {
        pastForm.querySelector(`input[name='plan_bear_7'][value='${data.plan_bear_7}']`).checked = true;
    }

    // 근육통
    if (data.plan_anti_8) {
        pastForm.querySelector(`input[name='plan_anti_8'][value='${data.plan_anti_8}']`).checked = true;
    }
    if (data.plan_ruma_8) {
        pastForm.querySelector(`input[name='plan_ruma_8'][value='${data.plan_ruma_8}']`).checked = true;
    }

    // 발백선
    pastForm.querySelector("input[name='plan_tinea_site_9']").value = data.plan_tinea_site_9 || "";
    if (data.plan_tinea_9) {
        pastForm.querySelector(`input[name='plan_tinea_9'][value='${data.plan_tinea_9}']`).checked = true;
    }

    // 피부염
    pastForm.querySelector("input[name='plan_derma_site_10']").value = data.plan_derma_site_10 || "";
    if (data.plan_derma_10) {
        pastForm.querySelector(`input[name='plan_derma_10'][value='${data.plan_derma_10}']`).checked = true;
    }

    // Medication counseling
    pastForm.querySelector("textarea[name='med_counseling']").value = data.med_counseling || "";

    // IV order
    if (data.iv_order) {
        pastForm.querySelector(`input[name='iv_order'][value='${data.iv_order}']`).checked = true;
    }

    // Signature
    pastForm.querySelector("input[name='sign_dr']").value = data.sign_dr || "";
}

// 데이터를 폼에 채워 넣는 함수
function populateFormWithData(data) {
    // 방문 날짜
    document.getElementById("record_date").value = data.record_date;

    // Vital Signs
    document.querySelector("input[name='bp']").value = data.bp || "";
    document.querySelector("input[name='hr']").value = data.hr || "";
    document.querySelector("input[name='bst']").value = data.bst || "";
    document.querySelector("input[name='bt']").value = data.bt || "";
    document.querySelector("input[name='age']").value = data.age || "";

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
    document.querySelector("input[name='ne_cog']").value = data.gds || "";
    document.querySelector("input[name='ne_sleep']").value = data.gds || "";
    document.querySelector("input[name='ne_depress']").value = data.gds || "";

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
btnConfirm.addEventListener('click', async e => {
    e.preventDefault();

    const userSign = modalSign.value.trim();
    const realSign = document.querySelector('input[name="sign_dr"]').value.trim();
    if (userSign !== realSign) {
        modalError.textContent = '서명이 일치하지 않습니다. 다시 확인하세요.';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const emrId = params.get('emr_id') || '';

    const name = document.querySelector('input[name="name"]').value;
    const birth = document.querySelector('input[name="birth_date"]').value;
    const ivRadio = document.querySelector('input[name="iv_order"]:checked');
    const ivFlag = ivRadio ? ivRadio.value : '';

    // ✅ (1) 환자 상태 결정
    const newStatus = (ivFlag === 'O') ? '수액 복약' : '복약';

    // ✅ (2) 서버에 상태 업데이트 요청
    try {
        const response = await fetch(`/dashboard/update_status_by_identity`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                birth_date: birth,
                status: newStatus
            })
        });

        if (!response.ok) throw new Error('상태 업데이트 실패');

        // ✅ (3) 세션 저장 후 이동
        sessionStorage.setItem('completedPatient', `${name}||${birth}||${ivFlag}||${emrId}`);
        window.location.href = '/dashboard';

    } catch (error) {
        console.error('상태 업데이트 오류:', error);
        alert('환자 상태 업데이트에 실패했습니다.');
    }
});