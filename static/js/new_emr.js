document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("basic-info-form");
    const saveButton = document.getElementById("save-button");
  
    form.addEventListener("submit", (event) => {
      event.preventDefault(); // 기본 폼 제출 동작 방지
  
      // 폼 데이터를 서버로 전송
      fetch("/patient_emr/new_patient_chart/information", {
        method: "POST",
        body: new FormData(form),
      })
        .then((response) => {
          if (response.ok) {
            showToast("저장이 완료되었습니다.");
          } else {
            showToast("저장에 실패했습니다. 다시 시도해주세요.");
          }
        })
        .catch(() => {
          showToast("저장 중 오류가 발생했습니다.");
        });
    });
  
    // Toast 메시지 표시 함수
    function showToast(message) {
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
      document.body.appendChild(toast);
  
      setTimeout(() => {
        toast.classList.add("show");
      }, 100);
  
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  });


  document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("back-button");
  
    backButton.addEventListener("click", () => {
      // 현재 URL에서 쿼리 파라미터 추출
      const urlParams = new URLSearchParams(window.location.search);
      const name = urlParams.get("name");
      const birthDate = urlParams.get("birth_date");
  
      // 뒤로가기 URL 생성
      const backUrl = `/patient_emr?name=${encodeURIComponent(name)}&birth_date=${encodeURIComponent(birthDate)}`;
  
      // 페이지 이동
      window.location.href = backUrl;
    });
  });