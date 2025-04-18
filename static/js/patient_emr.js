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
