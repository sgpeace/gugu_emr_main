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
    const enterBtn   = row.querySelector('.enter-button');
  
    // ▶ If they’re already in 진료, immediately disable and append link
    if (patient.status === "진료") {
      enterBtn.disabled   = true;
      enterBtn.textContent = "-";
      appendTreatmentLink(patient);
    }
  
    // ▶ When “+” is clicked, PATCH the new status first…
    enterBtn.addEventListener('click', () => {
      if (!confirm(`❗️ ${patient.name}님의 진료를 시작하시겠습니까?`)) return;
  
      fetch(`/dashboard/registrations/${patient.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        // match your FastAPI update_registration_status body
        body:    JSON.stringify({ status: "진료" })
      })
      .then(res => {
        if (!res.ok) throw new Error("상태 업데이트 실패");
        return res.json();  // returns the updated RegistrationOut
      })
      .then(updated => {
        // ▶ only now mutate the DOM
        statusCell.textContent   = updated.status;
        enterBtn.disabled        = true;
        enterBtn.textContent      = "-";
        appendTreatmentLink({
            name:       updated.patient_name,
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
  
      // ─── D) Confirm‑patient search & register ───
      document.getElementById("confirm-patient").addEventListener("click", function () {
          const patientName = document.getElementById("patient-search").value.trim();
          if (!patientName) {
              alert("환자 이름을 입력하세요.");
              return;
          }
  
          fetch(`/dashboard/search?newname=${encodeURIComponent(patientName)}`)
              .then(response => response.json())
              .then(data => {
                  const suggestionBox = document.getElementById("new-patient-search");
                  suggestionBox.innerHTML = "";
                  if (data.result && data.result.length > 0) {
                      let list = document.createElement("ul");
                      list.classList.add("suggestion-list");
                      data.result.forEach(item => {
                          let li = document.createElement("li");
                          li.textContent = `${item.name} (${item.birth_date})`;
  
                          li.addEventListener("click", () => {
                              fetch("/dashboard/registrations/add", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                  body: new URLSearchParams({ 
                                  patient_name: item.name,
                                  birth_date: item.birth_date
                                  })
                              })
                                  .then(res => {
                                      if (!res.ok) return res.json().then(data => { throw new Error(data.message); });
                                      return res.json();
                                  })
                                  .then(reg => {
                                      addPatientToTable({
                                          id: reg.id,
                                          name: reg.patient_name,
                                          birth_date: reg.birth_date,
                                          status: reg.status
                                      });
                                      alert("환자 등록 완료!");
                                  })
                                  .catch(err => {
                                      console.error(err);
                                      alert("등록 오류: " + err.message);
                                  });
  
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
  
      // ─── E) New‑patient popup ───
      document.getElementById("new-patient").addEventListener("click", function () {
          const formHtml = `
          <div class="popup-overlay">
          <div id="new-patient-form" class="popup-form">
              <h3>신환 등록</h3>
              <label>이름<input type="text" id="new-patient-name" placeholder="이름을 입력하세요"></label>
              <label>생년월일<input type="text" id="new-patient-birth" maxlength="6" placeholder="6자리 입력"></label>
              <div class="button-group">
                  <button id="save-new-patient">저장</button>
                  <button id="cancel-new-patient">취소</button>
              </div>
          </div>
          </div>`;
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
      });
  
      // ─── F) 오른쪽 환자 이름 검색 ───
      document.getElementById("confirm-name-search").addEventListener("click", function () {
          const searchName = document.getElementById("patient-name-search").value.trim();
          if (!searchName) {
              alert("환자 이름을 입력하세요.");
              return;
          }
  
          fetch(`/dashboard/search?newname=${encodeURIComponent(searchName)}`)
              .then(response => response.json())
              .then(data => {
                  const resultBox = document.getElementById("search-results");
                  resultBox.innerHTML = "";
                  if (data.result && data.result.length > 0) {
                      let list = document.createElement("ul");
                      list.classList.add("suggestion-list");
                      data.result.forEach(item => {
                          let li = document.createElement("li");
                          li.textContent = `${item.name} (${item.birth_date})`;
                          li.addEventListener("click", () => {
                              window.location.href = `/patient_emr?name=${encodeURIComponent(item.name)}&birth_date=${encodeURIComponent(item.birth_date)}`;
                          });
                          list.appendChild(li);
                      });
                      resultBox.appendChild(list);
                  } else {
                      resultBox.innerHTML = "<div class='no-result'>해당 환자가 없습니다!</div>";
                  }
              });
      });
  });

// 신규 등록 버튼 (별도 AJAX 처리 가능)
// document.getElementById("new-patient").addEventListener("click", function () {
//     const patientName = document.getElementById("patient-search").value.trim();
//     if (!patientName) {
//         alert("환자 이름을 입력하세요.");
//         return;
//     }

//     fetch("/dashboard/add_patient", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/x-www-form-urlencoded"
//         },
//         body: `name=${encodeURIComponent(patientName)}`
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.patient) {
//                 alert(`환자 ${data.patient.name} 이(가) 등록되었습니다.`);
//             } else {
//                 alert(data.message);
//             }
//         })
//         .catch(error => {
//             console.error("Error:", error);
//             alert("환자 등록에 실패했습니다.");
//         });
// });



// document.addEventListener('DOMContentLoaded', function() {
//     const inputField = document.getElementById('patient-search');
//     if (!inputField) {
//         console.error("환자 등록 입력 필드를 찾을 수 없습니다.");
//         return;
//     }
//     inputField.addEventListener('input', function() {
//         console.log("환자 등록 입력 이벤트 발생:", this.value);
//         const query = this.value;
//         if (!query) {
//             document.getElementById('new-patient-result').innerText = "";
//             return;
//         }
//         // /dashboard API를 newname 파라미터와 함께 호출
//         fetch(`/dashboard?newname=${encodeURIComponent(query)}`)
//             .then(response => response.json())
//             .then(data => {
//                 document.getElementById('new-patient-result').innerText = data.result;
//             })
//             .catch(error => {
//                 console.error("Error fetching new patient info:", error);
//             });
//     });
// });
