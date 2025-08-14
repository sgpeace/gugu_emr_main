document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(form);

        fetch("/patient_emr_nur", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("저장 실패");
            return res.json();
        })
        .then(data => {
            showToast(data.message || "저장이 완료되었습니다.");
        })
        .catch(err => {
            console.error(err);
            showToast("저장 중 오류가 발생했습니다.");
        });
    });

    function showToast(message) {
        const toast = document.getElementById("custom-toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove("hidden");
        toast.classList.add("visible");

        setTimeout(() => {
            toast.classList.remove("visible");
            toast.classList.add("hidden");
        }, 2500);
    }
});