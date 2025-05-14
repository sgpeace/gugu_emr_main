// registration.js

document.addEventListener("DOMContentLoaded", function () {
    // 수정 버튼 클릭 이벤트 처리
    document.querySelectorAll(".update-button").forEach(btn => {
        btn.addEventListener("click", function () {
            const row = btn.closest("tr");
            const id = row.getAttribute("data-id");
            const patient_name = row.querySelector(".reg-patient-name").value;
            const status = row.querySelector(".reg-status").value;
            const formData = new FormData();
            formData.append("id", id);
            formData.append("patient_name", patient_name);
            formData.append("status", status);
            fetch("/registration/update", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (response.redirected) {
                        window.location.href = response.url;
                    }
                })
                .catch(error => alert("수정에 실패하였습니다."));
        });
    });

    // 삭제 버튼 클릭 이벤트 처리
    document.querySelectorAll(".delete-button").forEach(btn => {
        btn.addEventListener("click", function () {
            if (!confirm("삭제하시겠습니까?")) {
                return;
            }
            const row = btn.closest("tr");
            const id = row.getAttribute("data-id");
            const formData = new FormData();
            formData.append("id", id);
            fetch("/registration/delete", {
                method: "POST",
                body: formData
            })
                .then(response => {
                    if (response.redirected) {
                        window.location.href = response.url;
                    }
                })
                .catch(error => alert("삭제에 실패하였습니다."));
        });
    });

    // 신규 접수 추가는 기본 폼 제출 방식으로 처리 (페이지 리로드)
    document.getElementById("add-registration-form").addEventListener("submit", function (e) {
        // AJAX로 처리하려면 여기서 preventDefault() 후 처리 가능
        // 현재는 폼 제출 후 서버 리다이렉션 방식 사용
    });

    // 전체 초기화 버튼 처리
    document.getElementById("reset-registrations").addEventListener("click", function () {
        if (!confirm("전체 등록 정보를 초기화하시겠습니까?")) {
            return;
        }
        fetch("/registration/reset", {
            method: "POST"
        })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                }
            })
            .catch(error => alert("초기화에 실패하였습니다."));
    });
});