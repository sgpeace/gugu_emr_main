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
