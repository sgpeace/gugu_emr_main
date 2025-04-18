// dashboard.js

// Helper 함수: 환자를 테이블에 추가하는 기능
function addPatientToTable(patient) {
    const table = document.getElementById('patient-list');
    const row = document.createElement('tr');
    const index = table.children.length + 1;
    row.innerHTML = `
        <td>${index}</td>
        <td>${patient.name} <span class="small-birthdate">(${patient.birth_date})</span></td>
        <td class="status-cell">대기</td>
        <td><button class="enter-button">+</button></td>
        <td class="delete-col"><button class="delete-button">삭제</button></td>
    `;
    table.appendChild(row);

    // 진료 시작 버튼 클릭 시: 확인 창 후 처리
    row.querySelector('.enter-button').addEventListener('click', function () {
        const confirmMsg = `${patient.name} (${patient.birth_date}) 님의 진료를 시작하시겠습니까?`;
        if (confirm(confirmMsg)) {
            // 버튼 비활성화 및 텍스트 변경
            this.disabled = true;
            this.textContent = "-";
            
            // 테이블 상태 셀 업데이트: 대기 → 진료
            const statusCell = row.querySelector('.status-cell');
            statusCell.textContent = "진료";

            // 오른쪽 진료중 박스에 하이퍼링크 추가
            // 링크는 /patient_emr?name=환자명&birth_date=생년월일 형식으로 전달 (날짜는 원래 포맷에 맞게 조정 필요)
            const link = document.createElement("a");
            // URL 인코딩 포함
            link.href = `/patient_emr?name=${encodeURIComponent(patient.name)}&birth_date=${encodeURIComponent(patient.birth_date)}`;
            link.innerHTML = `${patient.name} <span class="small-birthdate">(${patient.birth_date})</span>`;
            // 스타일: 링크의 기본 스타일을 제거하거나 필요에 맞게 조정
            link.style.textDecoration = "none";
            link.style.color = "inherit";

            const li = document.createElement("li");
            li.appendChild(link);
            document.getElementById('treatment-list').appendChild(li);
        }
    });

    // [2] 삭제 버튼
    row.querySelector('.delete-button').addEventListener('click', function () {
        row.remove();
    });
}

// 관리 버튼(Admin) 클릭 시 동작
document.addEventListener("DOMContentLoaded", function () {
    // 관리 버튼
    const manageBtn = document.getElementById("manage-button");
    manageBtn.addEventListener("click", function () {
        // .patient-table 요소를 찾아서 classList.toggle("management-mode");
        const patientTable = document.querySelector(".patient-table");
        patientTable.classList.toggle("management-mode");
    });
});


// 초기화 버튼
const resetButton = document.getElementById('reset-patients');
const patientList = document.getElementById('patient-list');

if (resetButton && patientList) {
    resetButton.addEventListener('click', function () {
        patientList.innerHTML = "";
    });
}

// dashboard 상 '환자 등록' 칸에 환자 이름을 넣고 '확인' 버튼 누르면 작동하는 부분 + 환자 이름 클릭하면 테이블로 이동하도록 하는 부분
document.getElementById("confirm-patient").addEventListener("click", function () {
    const patientName = document.getElementById("patient-search").value.trim();
    if (!patientName) {
        alert("환자 이름을 입력하세요.");
        return;
    }

    fetch(`/dashboard/search?newname=${encodeURIComponent(patientName)}`)
        .then(response => response.json())
        .then(data => {
            const suggestionBox = document.getElementById("new-patient-search"); // new-patient-search는 결과를 저장할 요소
            suggestionBox.innerHTML = ""; // 기존 결과 초기화
            if (data.result && data.result.length > 0) {
                let list = document.createElement("ul");
                list.classList.add("suggestion-list");
                data.result.forEach(item => {
                    let li = document.createElement("li");
                    li.textContent = `${item.name} (${item.birth_date})`;
                    li.addEventListener("click", function () {
                        addPatientToTable(item);
                        document.getElementById("patient-search").value = item.name;
                        suggestionBox.innerHTML = "";
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

// 신환등록 버튼을 눌렀을 때 작용하는 코드들
document.getElementById("new-patient").addEventListener("click", function () {
    // 이름과 생년월일 입력을 위한 창 생성
    const formHtml = `
    <div class="popup-overlay">
        <div id="new-patient-form" class="popup-form">
            <h3>신환 등록</h3>
            <label>이름: <input type="text" id="new-patient-name" /></label><br/>
            <label>생년월일(6자리): <input type="text" id="new-patient-birth" maxlength="6" /></label><br/>
            <button id="save-new-patient">저장</button>
            <button id="cancel-new-patient">취소</button>
        </div>
    </div>
`;
    const container = document.createElement("div");
    container.innerHTML = formHtml;
    document.body.appendChild(container);

    document.getElementById("save-new-patient").addEventListener("click", function () {
        const name = document.getElementById("new-patient-name").value.trim();
        const birth = document.getElementById("new-patient-birth").value.trim();

        if (!name || !birth || birth.length !== 6) {
            alert("이름과 생년월일(6자리)을 정확히 입력하세요.");
            return;
        }

        fetch("/dashboard/add_patient", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                name: name,
                birth_date: birth
            })
        })
        .then(res => {
            if (res.ok) return res.json();
            else throw new Error("등록 실패");
        })
        .then(data => {
            alert("환자가 성공적으로 등록되었습니다.");
            document.body.removeChild(container);
        })
        .catch(err => {
            console.error(err);
            alert("환자 등록 중 오류 발생");
        });
    });

    document.getElementById("cancel-new-patient").addEventListener("click", function () {
        document.body.removeChild(container);
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