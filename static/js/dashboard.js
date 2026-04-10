// ──────────────────────────────
// Helper Functions
// ──────────────────────────────

function updateRowNumbers() {
  const rows = document.querySelectorAll('#patient-list tr');
  const total = rows.length;
  rows.forEach((row, i) => {
    const cell = row.querySelector('.row-index');
    if (cell) cell.textContent = total - i;
  });
}

// ──────────────────────────────
// Chart Picker Modal (동적 생성)
// ──────────────────────────────
let chartPickerModal, chartPickerClose, goMed, goPha, goNur;

function ensureChartPickerModal() {
  if (chartPickerModal) return; // 한 번만 생성
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div id="chart-picker-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width:380px;">
        <span class="close-button" id="chart-picker-close">&times;</span>
        <h3 style="margin-top:0;">조회하려는 차트를 선택하시오.</h3>
        <p style="color:#666; margin:6px 0 16px;">부서를 선택하면 해당 차트로 이동합니다.</p>
        <div class="button-group" style="justify-content:space-between;">
          <a id="go-med" class="button" style="flex:1;">진료부</a>
          <a id="go-pha" class="button" style="flex:1; background:#6c63ff;">약국부</a>
          <a id="go-nur" class="button" style="flex:1; background:#ff7f50;">간호부</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  chartPickerModal = document.getElementById('chart-picker-modal');
  chartPickerClose = document.getElementById('chart-picker-close');
  goMed = document.getElementById('go-med');
  goPha = document.getElementById('go-pha');
  goNur = document.getElementById('go-nur');

  chartPickerClose.addEventListener('click', closeChartPicker);
  window.addEventListener('click', (e) => { if (e.target === chartPickerModal) closeChartPicker(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChartPicker(); });
}

function openChartPicker(name, birth) {
  ensureChartPickerModal();
  const n = encodeURIComponent(name);
  const b = encodeURIComponent(birth);
  goMed.setAttribute('href', `/patient_emr?name=${n}&birth_date=${b}`);
  goPha.setAttribute('href', `/patient_emr_pha?name=${n}&birth_date=${b}`);
  goNur.setAttribute('href', `/patient_emr_nur?name=${n}&birth_date=${b}`);
  chartPickerModal.style.display = 'block';
}

function closeChartPicker() {
  if (chartPickerModal) chartPickerModal.style.display = 'none';
}

// ▶ 진료 링크: 진료 중인 환자의 링크를 만들어 treatment-list에 추가
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

// ▶ 복약중 링크: 복약 중인 환자의 링크를 만들어 medication-list에 추가
function appendToMedicationList(patient) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `/patient_emr_pha?name=${encodeURIComponent(patient.name)}&birth_date=${encodeURIComponent(patient.birth_date)}`;
  a.textContent = `${patient.name} (${patient.birth_date})`;
  li.appendChild(a);
  document.getElementById('medication-list').appendChild(li);
}

// ▶ 수액대기중 링크
function appendToInfusionWaitingList(patient) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `/patient_emr_nur?name=${encodeURIComponent(patient.name)}&birth_date=${encodeURIComponent(patient.birth_date)}`;
  a.textContent = `${patient.name} (${patient.birth_date})`;
  li.appendChild(a);
  document.getElementById('infusion-waiting-list').appendChild(li);
}

// ▶ 수액중 링크
function appendToInfusionInProgressList(patient) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `/patient_emr_nur?name=${encodeURIComponent(patient.name)}&birth_date=${encodeURIComponent(patient.birth_date)}`;
  a.textContent = `${patient.name} (${patient.birth_date})`;
  li.appendChild(a);
  document.getElementById('infusion-inprogress-list').appendChild(li);
}

// ──────────────────────────────
// Main Table Renderer
// ──────────────────────────────

function addPatientToTable(patient) {
  const table = document.getElementById('patient-list');
  const row = document.createElement('tr');
  row.dataset.id = patient.id;
  row.innerHTML = `
    <td class="row-index"></td>
    <td>${patient.name} <span class="small-birthdate">(${patient.birth_date})</span></td>
    <td class="status-cell">${patient.status}</td>
    <td><button class="enter-button"></button></td>
    <td><button class="delete-button">삭제</button></td>
  `;
  table.prepend(row);
  updateRowNumbers();

  const statusCell = row.querySelector('.status-cell');
  const enterBtn = row.querySelector('.enter-button');

  // ▶ 상태 분기 처리
  if (patient.status === "대기") {
    // 진료 시작 가능
    enterBtn.disabled = false;
    enterBtn.textContent = "+";
  } else {
    // 진료 중 / 복약중 / 수액중 / 완료 → 입장 불가능
    enterBtn.disabled = true;
    enterBtn.textContent = "-";

    if (patient.status === "진료") {
      appendTreatmentLink(patient);
    }
    if (patient.status.includes("복약")) {
      appendToMedicationList(patient);
    }
   // ✅ 수액 상태 분기
const st = String(patient.status || "");
if (st.includes("수액대기중")) {
  appendToInfusionWaitingList(patient);
} else if (st.includes("수액중")) {
  appendToInfusionInProgressList(patient);
} else if (st.includes("수액")) {
  // (과거 데이터 호환: "수액 복약" 같은 레거시 상태는 수액중으로 취급)
  appendToInfusionInProgressList(patient);
}
  }

  // ▶ 진료 시작 버튼
  enterBtn.addEventListener('click', () => {
    if (!confirm(`❗️ ${patient.name}님의 진료를 시작하시겠습니까?`)) return;

    fetch(`/dashboard/registrations/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "진료" })
    })
      .then(res => {
        if (!res.ok) throw new Error("상태 업데이트 실패");
        return res.json();
      })
      .then(updated => {
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

  // ▶ 삭제 버튼
  // ▶ 삭제 버튼
row.querySelector('.delete-button').addEventListener('click', () => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  fetch(`/dashboard/registrations/${patient.id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('삭제 실패');

      // 환자 테이블에서 삭제
      row.remove();
      updateRowNumbers();

      // 이름과 생년월일 기반으로 리스트에서 삭제
      const name = patient.name;
      const birth = patient.birth_date;

      const removeFromList = (listId) => {
        const list = document.getElementById(listId);
        Array.from(list.children).forEach(li => {
          if (li.textContent.includes(name) && li.textContent.includes(birth)) {
            list.removeChild(li);
          }
        });
      };

      removeFromList('treatment-list');
      removeFromList('infusion-waiting-list');
      removeFromList('infusion-inprogress-list');
      removeFromList('medication-list');
    })
    .catch(err => {
      console.error(err);
      alert('삭제에 실패했습니다.');
    });
});
}

// ──────────────────────────────
// DOMContentLoaded 이벤트
// ──────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // ▶ 등록된 환자 불러오기
  fetch("/dashboard/registrations")
    .then(r => r.json())
    .then(regs => {
      // API는 최신순(내림차순) 반환 → reverse 후 prepend하면 최신이 맨 위, 번호도 올바르게 부여됨
      [...regs].reverse().forEach(reg => {
        addPatientToTable({
          id: reg.id,
          name: reg.patient_name,
          birth_date: reg.birth_date,
          status: reg.status
        });
      });
    })
    .catch(err => console.error("등록 목록 로드 실패:", err));

  // ▶ 대기열 초기화
  document.getElementById("reset-patients").addEventListener("click", () => {
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

  // ▶ 신환 등록
  document.getElementById("new-patient").addEventListener("click", () => {
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
    container.querySelector(".popup-overlay").addEventListener("click", e => {
      if (e.target === container.querySelector(".popup-overlay")) close();
    });
  });

  // ▶ 오른쪽 하단 환자 이름 검색 → patient_emr로 이동
  document.getElementById("confirm-name-search").addEventListener("click", () => {
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
            const entry = document.createElement("div");
            entry.innerHTML = `
            <a href="#" class="open-chart-picker"
               data-name="${item.name}"
               data-birth="${item.birth_date}">
               ${item.name} <span class="small-birthdate">(${item.birth_date})</span>
            </a>`;
          entry.addEventListener("click", (e) => {
            const a = e.target.closest('.open-chart-picker');
            if (!a) return;
            e.preventDefault();
            openChartPicker(a.getAttribute('data-name'), a.getAttribute('data-birth'));
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

  // ▶ 상단 '확인' 버튼 클릭 시 환자 리스트 표시
  document.getElementById("confirm-patient").addEventListener("click", () => {
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
          const ul = document.createElement("ul");
          ul.classList.add("suggestion-list");
          data.result.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} (${item.birth_date})`;
            li.addEventListener("click", () => {
              fetch("/dashboard/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patient_name: item.name,
                  birth_date: item.birth_date
                })
              })
                .then(res => res.ok ? res.json() : Promise.reject("등록 실패"))
                .then(reg => {
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

              suggestionBox.innerHTML = "";
              document.getElementById("patient-search").value = "";
            });
            ul.appendChild(li);
          });
          suggestionBox.appendChild(ul);
        } else {
          suggestionBox.innerHTML = "<div class='no-result'>해당 환자 없음. 신규 등록 가능합니다.</div>";
        }
      })
      .catch(err => {
        console.error("검색 실패:", err);
        alert("데이터 불러오기 실패");
      });
  });
});

// 내보내기 버튼 클릭시 '오늘의 환자' 테이블을 엑셀 파일로 저장
document.getElementById("export-patients").addEventListener("click", async function () {
  try {
    const res = await fetch("/dashboard/export_summary");
    if (!res.ok) throw new Error("서버 오류");
    const data = await res.json();

    const rows = [["순번", "이름", "생년월일", "수액여부", "수액성공여부"]];
    data.forEach(p => {
      rows.push([p.seq, p.name, p.birth_date, p.iv_order, p.iv_success]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // 열 너비 설정
    worksheet["!cols"] = [
      { wch: 6 },   // 순번
      { wch: 12 },  // 이름
      { wch: 12 },  // 생년월일
      { wch: 10 },  // 수액여부
      { wch: 14 },  // 수액성공여부
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Today_Patients");

    const today = new Date();
    const y = String(today.getFullYear()).slice(-2);
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const filename = `today_patients_${y}${m}${d}.xlsx`;

    XLSX.writeFile(workbook, filename);
  } catch (e) {
    alert("내보내기 실패: " + e.message);
  }
});



