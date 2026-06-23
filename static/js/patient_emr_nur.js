document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  
  // ✅ 완료 버튼은 '수액중' 상태에서만 활성화 (수액대기중에서는 잠금)
const completeBtn = document.getElementById("nur-complete-btn");

async function setCompleteButtonLockByStatus() {
  if (!completeBtn) return;

  const name = form?.querySelector('input[name="name"]')?.value || "";
  const birth = form?.querySelector('input[name="birth_date"]')?.value || "";

  // 기본값: 잠금
  completeBtn.disabled = true;
  if (!name || !birth) return;

  try {
    const r = await fetch("/dashboard/registrations", { method: "GET" });
    if (!r.ok) throw new Error("registrations 조회 실패");
    const regs = await r.json();

    // API는 id DESC 정렬로 반환 → 동일 환자의 가장 최신 등록건을 id 기준으로 정렬해 선택
    // ⚠️ 이전 코드: 배열 뒤에서부터 탐색 → 오래된 등록건(이전 방문)을 최신으로 오인하는 버그
    const candidates = regs.filter(it => it.patient_name === name && it.birth_date === birth);
    candidates.sort((a, b) => b.id - a.id);   // id 큰 것 = 최신
    const latest = candidates[0] || null;

    const status = latest?.status || "";

    // '수액중'일 때만 완료 버튼 활성화
    // (예: '수액중 복약' / '복약 수액중' 모두 포함 처리)
    completeBtn.disabled = !status.includes("수액중");
  } catch (e) {
    console.error(e);
    // 조회 실패 시 안전하게 잠금 유지
    completeBtn.disabled = true;
  }
}

setCompleteButtonLockByStatus();
  const finishBtn = document.getElementById("nur-complete-btn");

  // status 토큰 파서/조립
  function splitTokens(status) {
    // 현재 DB는 "수액대기중 복약" 처럼 공백 조합도 있고,
    // 과거엔 "수액, 복약" 처럼 콤마도 있을 수 있으니 둘 다 처리
    return String(status || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(t => t.split(" ").map(x => x.trim()).filter(Boolean));
  }

  function joinTokens(tokens) {
    // UI/DB는 공백 조합("수액대기중 복약")으로 맞추자
    return tokens.join(" ");
  }

  // ✅ 저장 버튼: 수액대기중 → 수액중 (복약 토큰은 유지)
  function promoteWaitingToInProgress(status) {
    const tokens = splitTokens(status);

    // 레거시 "수액"은 "수액중"으로 취급
    const normalized = tokens.map(t => (t === "수액" ? "수액중" : t));

    const next = normalized.map(t => (t === "수액대기중" ? "수액중" : t));

    // 혹시 중복 생기면 제거
    const uniq = Array.from(new Set(next));

    return joinTokens(uniq);
  }

  // ✅ 완료 버튼: 수액 관련 토큰 제거 (수액중/수액대기중/수액 모두 제거)
  function removeInfusionTokens(status) {
    const tokens = splitTokens(status);
    const filtered = tokens.filter(t => !t.includes("수액"));
    return filtered.length ? joinTokens(Array.from(new Set(filtered))) : "완료";
  }

  // Registration 최신건 찾기 (동명이인 방지: name+birth)
  async function findLatestRegistration(name, birth) {
    const r = await fetch("/dashboard/registrations", { method: "GET" });
    if (!r.ok) throw new Error("registrations 조회 실패");
    const regs = await r.json();

    // ⚠️ 지금 코드는 배열 앞쪽부터 find()라 “최신” 보장이 약함
    // id 큰 게 최신이므로 desc로 찾아줌
    const candidates = regs.filter(x => x.patient_name === name && x.birth_date === birth);
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.id - a.id);
    return candidates[0];
  }

  async function patchStatusByIdentity(name, birth, status) {
    const res = await fetch("/dashboard/update_status_by_identity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, birth_date: birth, status })
    });
    if (!res.ok) throw new Error("상태 PATCH 실패");
    // 백엔드가 JSON을 주므로 읽되, 실패 대비
    try { return await res.json(); } catch { return null; }
  }

  // 토스트
  function showToast(message) {
    const toast = document.getElementById("custom-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("visible");
    setTimeout(() => {
      toast.classList.remove("visible");
      toast.classList.add("hidden");
    }, 2200);
  }

  // (1) 저장 submit: EMR 저장 → status 수액대기중→수액중 → dashboard 복귀
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const saveRes = await fetch("/patient_emr_nur", { method: "POST", body: formData });
      if (!saveRes.ok) throw new Error("저장 실패");
      const data = await saveRes.json();

      const name = formData.get("name");
      const birth = formData.get("birth_date");

      const latest = await findLatestRegistration(name, birth);
      if (latest) {
        const updatedStatus = promoteWaitingToInProgress(latest.status);
        await patchStatusByIdentity(name, birth, updatedStatus);
      }

      showToast(data.message || "저장이 완료되었습니다.");
      setTimeout(() => (window.location.href = "/dashboard"), 600);

    } catch (err) {
      console.error(err);
      showToast("저장/상태 업데이트 중 오류가 발생했습니다.");
    }
  });

  // (2) 완료 버튼: status에서 수액 토큰 제거 → dashboard 복귀
  if (finishBtn) {
    finishBtn.addEventListener("click", async () => {
      try {
        const name = form.querySelector('input[name="name"]').value;
        const birth = form.querySelector('input[name="birth_date"]').value;

        const latest = await findLatestRegistration(name, birth);
        if (!latest) {
          showToast("등록 정보가 없어 완료 처리할 수 없습니다.");
          return;
        }

        const updatedStatus = removeInfusionTokens(latest.status);
        await patchStatusByIdentity(name, birth, updatedStatus);

        showToast("수액 처리가 완료되었습니다.");
        setTimeout(() => (window.location.href = "/dashboard"), 600);

      } catch (err) {
        console.error(err);
        showToast("완료 처리 중 오류가 발생했습니다.");
      }
    });
  }
});

