    document.getElementById('add-patient').addEventListener('click', function() {
        const name = document.getElementById('patient-search').value;
        if (!name) return;

        const table = document.getElementById('patient-list');
        const row = document.createElement('tr');
        const index = table.children.length + 1;

        row.innerHTML = `
            <td>${index}</td>
            <td>${name}</td>
            <td>대기</td>
            <td><button class="enter-button">+</button></td>
            <td><button class="delete-button">삭제</button></td>
        `;

        table.appendChild(row);

        row.querySelector('.enter-button').addEventListener('click', function() {
            document.getElementById('treatment-list').innerHTML += `<li>${name}</li>`;
        });

        row.querySelector('.delete-button').addEventListener('click', function() {
            row.remove();
        });
    });

    document.getElementById('reset-patients').addEventListener('click', function() {
        document.getElementById('patient-list').innerHTML = "";
    });


    document.getElementById("confirm-patient").addEventListener("click", function(){
        // 입력된 환자 이름을 가져옴
        const patientName = document.getElementById("patient-search").value.trim();
        if (!patientName) {
            alert("환자 이름을 입력하세요.");
            return;
        }
        
        // GET 요청: 입력된 이름을 쿼리파라미터로 전달
        fetch(`/dashboard?newname=${encodeURIComponent(patientName)}`)
            .then(response => response.json())
            .then(data => {
                // API 응답이 { result: "결과값" } 형태로 오므로 save-text-box에 출력
                document.querySelector(".save-text-box").innerText = data.result;
            })
            .catch(error => {
                console.error("Error:", error);
                alert("데이터를 불러오는데 실패했습니다.");
            });
    });


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