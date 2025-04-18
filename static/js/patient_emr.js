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

document.querySelectorAll(".record-link").forEach(link => {
    link.addEventListener("click", async function (e) {
        e.preventDefault(); // 기본 동작 방지

        const visitDate = this.parentElement.getAttribute("data-visit-date");
        console.log("방문 날짜:", visitDate);

        try {
            // Fetch API로 /patient_emr/past_emr 엔드포인트 호출
            const response = await fetch(`/patient_emr/past_emr?visit_date=${visitDate}`);
            
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
    document.getElementById("visit_date").value = data.visit_date;

    // Vital Signs
    document.querySelector("input[name='vitals_bp']").value = data.bp || "";
    document.querySelector("input[name='vitals_hr']").value = data.hr || "";
    document.querySelector("input[name='vitals_glucose']").value = data.glucose || "";
    document.querySelector("input[name='vitals_temp']").value = data.temp || "";

    // Symptoms (S)
    document.querySelector("textarea[name='symptoms']").value = data.symptoms || "";

    // Signs (O)
    document.querySelector("textarea[name='objective']").value = data.objective || "";

    // Assessment (A)
    document.querySelector("textarea[name='assessment']").value = data.assessment || "";

    // Plan (P)
    document.querySelector("textarea[name='treatment']").value = data.treatment || "";
}