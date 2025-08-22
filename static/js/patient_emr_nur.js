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
            // ✅ 상태 제거 로직 추가
            const name = formData.get("name");
            const birth = formData.get("birth_date");

            fetch(`/dashboard/registrations`, {
                method: "GET"
            })
            .then(r => r.json())
            .then(regs => {
                const latest = regs.find(r => r.patient_name === name && r.birth_date === birth);
                if (!latest) return;

                let currentStatus = latest.status || "";
                let updatedStatus = currentStatus.replace("수액", "").replace(",", "").trim();
                if (!updatedStatus) updatedStatus = "완료";

                return fetch(`/dashboard/update_status_by_identity`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name,
                        birth_date: birth,
                        status: updatedStatus
                    })
                });
            })
            .then(() => {
                showToast(data.message || "저장이 완료되었습니다.");
                // ✅ 필요시 자동 이동
                // window.location.href = "/dashboard";
            })
            .catch(err => {
                console.error("상태 업데이트 오류:", err);
                showToast("저장 후 상태 업데이트에 실패했습니다.");
            });

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