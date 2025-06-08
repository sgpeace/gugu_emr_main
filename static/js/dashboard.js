// dashboard.js

// Helper 함수: 환자를 테이블에 추가하는 기능
function addPatientToTable(patient) {
  const table = document.getElementById('patient-list');
  const row = document.createElement('tr');
  row.dataset.id = patient.id;            // save the DB id
  const index = table.children.length + 1;
  row.innerHTML = `
        <td>${index}</td>
        <td>${patient.name} <span class="small-birthdate">(${patient.birth_date})</span></td>
        <td class="status-cell">${patient.status}</td>
        <td><button class="enter-button">+</button></td>
        <td class="delete-col"><button class="delete-button">삭제</button></td>
    `;
  table.appendChild(row);


  const statusCell = row.querySelector('.status-cell');
  const enterBtn = row.querySelector('.enter-button');

  // ▶ If they’re already in 진료, immediately disable and append link
  if (patient.status === "진료") {
    enterBtn.disabled = true;
    enterBtn.textContent = "-";
    appendTreatmentLink(patient);
  }

  // ▶ When “+” is clicked, PATCH the new status first…
  enterBtn.addEventListener('click', () => {
    if (!confirm(`❗️ ${patient.name}님의 진료를 시작하시겠습니까?`)) return;

    fetch(`/dashboard/registrations/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // match your FastAPI update_registration_status body
      body: JSON.stringify({ status: "진료" })
    })
      .then(res => {
        if (!res.ok) throw new Error("상태 업데이트 실패");
        return res.json();  // returns the updated RegistrationOut
      })
      .then(updated => {
        // ▶ only now mutate the DOM
        statusCell.textContent = updated.status;
        enterBtn.disabled = true;
        enterBtn.textContent = "-";
        appendTreatmentLink({
          name: updated.patient_name,
          birth_date: updated.birth_date
        });
      })
      .catch(err => {
        console.error(err);
        alert("진료 상태 갱신에 실패했습니다.");
      });
  });

  // [2] 삭제 버튼
  row.querySelector('.delete-button').addEventListener('click', () => {
    if (!confirm(" 정말 삭제하시겠습니까?")) return;

    const id = row.dataset.id;
    fetch(`/dashboard/registrations/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('삭제 실패');
        row.remove();                  // remove from DOM on success
      })
      .catch(err => {
        console.error(err);
        alert('삭제에 실패했습니다.');
      });
  });

  function appendTreatmentLink(p) {
    const displayname = p.name || p.patient_name;
    const link = document.createElement("a");
    link.href = `/patient_emr?name=${encodeURIComponent(displayname)}&birth_date=${encodeURIComponent(p.birth_date)}`;
    link.innerHTML = `${displayname} <span class="small-birthdate">(${p.birth_date})</span>`;
    link.style.textDecoration = "none";
    link.style.color = "inherit";
    const li = document.createElement("li");
    li.appendChild(link);
    document.getElementById('treatment-list').appendChild(li);
  }
}




document.addEventListener("DOMContentLoaded", () => {
  // ─── A) Load existing registrations ───
  fetch("/dashboard/registrations")
    .then(r => r.json())
    .then(regs => {
      regs.forEach(reg => {
        addPatientToTable({
          id: reg.id,
          name: reg.patient_name,
          birth_date: reg.birth_date,
          status: reg.status
        });
      });
      // ─── 이제 treatment-list가 채워졌으니 완료 처리 실행 ───
      processCompletedPatient();
    })
    .catch(err => console.error("등록 목록 로드 실패:", err));

  document.getElementById("manage-button")
    .addEventListener("click", () => {
      document.querySelector(".patient-table")
        .classList.toggle("management-mode");
    });

  // ─── C) Reset button ───
  document.getElementById("reset-patients")
    .addEventListener("click", () => {
      if (!confirm("정말 대기열을 초기화하시겠습니까?")) return;
      fetch("/dashboard/registrations/reset", { method: "POST" })
        .then(res => {
          if (!res.ok) throw new Error("초기화 실패");
          document.getElementById("patient-list").innerHTML = "";
        })
        .catch(err => {
          console.error(err);
          alert("초기화에 실패했습니다.");
        });
    });

  // ─── D) Confirm-patient search & register ───
  // dashboard 상 '환자 등록' 칸에 환자 이름을 넣고 '확인' 버튼 누르면 작동하는 부분 + 환자 이름 클릭하면 테이블로 이동하도록 하는 부분
  document.getElementById("confirm-patient").addEventListener("click", function () {
    const patientName = document.getElementById("patient-search").value.trim();
    if (!patientName) {
      alert("환자 이름을 입력하세요.");
      return;
    }

    fetch(`/dashboard/search?newname=${encodeURIComponent(patientName)}`) // 서버에 환자 이름을 보내고 검색
      .then(response => response.json()) // JSON 형태로 응답 받기
      .then(data => { // 서버에서 받은 데이터를 처리
        const suggestionBox = document.getElementById("new-patient-search"); // new-patient-search는 결과를 저장할 요소
        suggestionBox.innerHTML = ""; // 기존 결과 초기화
        if (data.result && data.result.length > 0) { // 검색 결과가 있을 때
          let list = document.createElement("ul"); // 결과를 담을 리스트 생성
          list.classList.add("suggestion-list"); // 스타일링을 위한 클래스 추가
          data.result.forEach(item => { // 각 검색 결과에 대해
            let li = document.createElement("li"); // 리스트 아이템 생성
            li.textContent = `${item.name} (${item.birth_date})`; // 환자 이름과 생년월일을 표시 

            li.addEventListener("click", () => { // 클릭 시 작용하는 이벤트
              //1) Send to backend
              fetch("/dashboard/registrations", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patient_name: item.name,
                  birth_date: item.birth_date
                })
              })
                .then(res => {
                  if (!res.ok) throw new Error("등록 실패");
                  return res.json(); // {id, patient_name, birth_date, status}
                })
                .then(reg => {
                  // 2) On Success, render it in my table
                  addPatientToTable({
                    id: reg.id,
                    name: reg.patient_name,
                    birth_date: reg.birth_date,
                    status: reg.status
                  });
                })
                .catch(err => {
                  console.error(err);
                  alert("환자 등록에 실패했습니다.");
                });

              //3) Clear out suggestions&input box
              suggestionBox.innerHTML = "";
              document.getElementById("patient-search").value = "";

            });
            list.appendChild(li);
          });
          suggestionBox.appendChild(list);
        } else {
          suggestionBox.innerHTML = "<div class='no-result'>해당 환자 없음. 신규 등록 가능합니다.</div>";
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      });

  });

  // ─── E) New-patient popup ───
  // 신환등록 버튼을 눌렀을 때 작용하는 코드들
  document.getElementById("new-patient").addEventListener("click", function () {
    const formHtml = `
        <div class="popup-overlay">
        <div id="new-patient-form" class="popup-form">
            <h3>신환 등록</h3>
            <label>
            이름
            <input type="text" id="new-patient-name" placeholder="이름을 입력하세요">
            </label>
            <label>
            생년월일
            <input type="text" id="new-patient-birth" maxlength="6" placeholder="6자리 입력">
            </label>
            <div class="button-group">
            <button id="save-new-patient">저장</button>
            <button id="cancel-new-patient">취소</button>
            </div>
        </div>
        </div>
        `;
    const container = document.createElement("div");
    container.innerHTML = formHtml;
    document.body.appendChild(container);

    function close() { document.body.removeChild(container); }

    container.querySelector("#save-new-patient").addEventListener("click", () => {
      const name = container.querySelector("#new-patient-name").value.trim();
      const birth = container.querySelector("#new-patient-birth").value.trim();
      if (!name || birth.length !== 6) {
        return alert("이름과 생년월일(6자리)을 정확히 입력하세요.");
      }
      fetch("/dashboard/add_new_patient", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ name, birth_date: birth })
      })
        .then(res => res.ok ? res.json() : Promise.reject("등록 실패"))
        .then(() => {
          alert("환자가 성공적으로 등록되었습니다.");
          close();
        })
        .catch(err => { console.error(err); alert("등록 중 오류 발생"); });
    });

    container.querySelector("#cancel-new-patient").addEventListener("click", close);
    // 오버레이 외곽 클릭 시에도 닫기
    container.querySelector(".popup-overlay").addEventListener("click", e => {
      if (e.target === container.querySelector(".popup-overlay")) close();
    });
  });

});




// F) processCompletedPatient: sessionStorage에 남은 환자를 treatment→med/infusion으로 이동
function processCompletedPatient() {
  const completed = sessionStorage.getItem('completedPatient');
  if (!completed) return;
  const [name, birth, ivFlag] = completed.split('||');

  const treatmentList  = document.getElementById('treatment-list');
  const medicationList = document.getElementById('medication-list');
  const infusionList   = document.getElementById('infusion-list');

  // 2) treatment → medication-list
  Array.from(treatmentList.children).forEach(li => {
    if (li.textContent.includes(name)) {
      // 기존 링크(li 안 a 태그)를 제거하고, 새로 name/birth로 href를 붙입니다.
      const newLi = document.createElement('li');
      const a     = document.createElement('a');
      a.href      = `/patient_emr_pha?name=${encodeURIComponent(name)}&birth_date=${encodeURIComponent(birth)}`;
      a.textContent = `${name} (${birth})`;
      newLi.appendChild(a);
      medicationList.appendChild(newLi);
      treatmentList.removeChild(li);
    }
  });

  // 3) IV Order='O'인 경우 infusion-list
  if (ivFlag === 'O') {
    Array.from(medicationList.children).forEach(li => {
      if (li.textContent.includes(name)) {
        const newLi = document.createElement('li');
        const a     = document.createElement('a');
        a.href      = `/patient_emr_nur?name=${encodeURIComponent(name)}&birth_date=${encodeURIComponent(birth)}`;
        a.textContent = `${name} (${birth})`;
        newLi.appendChild(a);
        infusionList.appendChild(newLi);
      }
    });
  }

  // 4) 세션 정리
  sessionStorage.removeItem('completedPatient');
}


// 오른쪽 하단 환자 검색 버튼
  document.getElementById("confirm-name-search").addEventListener("click", function() {
    const query = document.getElementById("patient-name-search").value.trim();
    if (!query) {
      alert("환자 이름을 입력하세요.");
      return;
    }

    fetch(`/dashboard/search?newname=${encodeURIComponent(query)}`)
      .then(response => {
        if (!response.ok) throw new Error("서버 응답 오류");
        return response.json();
      })
      .then(data => {
        const resultsDiv = document.getElementById("search-results");
        resultsDiv.innerHTML = "";

        if (data.result && data.result.length > 0) {
          data.result.forEach(item => {
            // div 대신 a 태그를 써서 클릭 시 바로 이동하게 만들어도 좋습니다.
            const entry = document.createElement("div");
            entry.textContent = `${item.name} (${item.birth_date})`;
            entry.style.cursor = "pointer";
            entry.addEventListener("click", () => {
              // 클릭하면 patient_emr 페이지로 이동
              const url = `/patient_emr?name=${encodeURIComponent(item.name)}&birth_date=${encodeURIComponent(item.birth_date)}`;
              window.location.href = url;
            });
            resultsDiv.appendChild(entry);
          });
        } else {
          resultsDiv.textContent = "검색 결과가 없습니다.";
        }
      })
      .catch(err => {
        console.error(err);
        alert("데이터를 불러오는 중 오류가 발생했습니다.");
      });
  });