from fastapi import FastAPI, Request, Form, Depends, HTTPException, Body, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, DateTime, ForeignKey, UniqueConstraint, text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime
from sqlalchemy import text
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import CheckConstraint
from sqlalchemy import Float
from pydantic import BaseModel
from typing import List, Optional


# === DATABASE SETUP ===
DATABASE_URL = "mysql+pymysql://root:Tmdrnjs159!@localhost/emr_db"
engine = create_engine(DATABASE_URL, echo=True)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === 데이터베이스 모델 정의 ===

# 환자 정보 테이블: 이름과 6자리 생년월일을 저장하여 동명이인 문제를 방지
# 신환 등록 때 작성되는 테이블
class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    birth_date = Column(String(6), nullable=False)  # 예: "000506"
    __table_args__ = (UniqueConstraint('name', 'birth_date', name='_name_birth_uc'),)
    
    # 한 환자가 여러 EMR 기록을 가질 수 있도록 설정
    emrs = relationship("EMR", back_populates="patient", cascade="all, delete-orphan")

# 진료 기록 테이블: 각 방문마다의 기록을 저장하며, 환자와 연결됨

# === 환자 EMR 모델 ===
class EMR(Base):
    __tablename__ = 'emrs'
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    record_date = Column(Date, nullable=False)
    name = Column(String(100), nullable=False)  # 성명
    gender = Column(String(10), nullable=False)  # 성별
    age = Column(String(20), nullable=True)  # 나이
    bt = Column(Float, nullable = True)  # BT (체온)
    bp = Column(String(20), nullable = True)  # BP (혈압)
    hr = Column(Integer, nullable = True)  # HR (맥박)
    bp2 = Column(String(20), nullable = True)  # 2차 BP
    bst = Column(Integer, nullable = True)  # BST (혈당)
    post_bst = Column(Integer, nullable = True)  # 식후(시간)
    cc = Column(Text, nullable = True)  # 주호소
    onset = Column(String(50), nullable = True)  # Onset
    duration = Column(String(50), nullable = True)  # Duration
    assoc = Column(String(100), nullable = True)  # Assoc. Sx.
    medication_hx = Column(Text, nullable = True)  # Medication Hx.
    pmhx = Column(Text, nullable = True)  # PMHx.
    allergy = Column(Text, nullable = True)  # Allergy
    fhx = Column(Text, nullable = True)  # FHx.
    social = Column(Text, nullable = True)  # Social
    pi = Column(Text, nullable = True)  # P.I. (병력)
    ros = Column(Text, nullable = True)  # ROS
    pe = Column(Text, nullable = True)  # P/E
    problem_list = Column(Text, nullable = True)  # Problem list
    assessment = Column(Text, nullable = True)  # Assessment
    mmse = Column(Integer, nullable = True)  # MMSE
    cdr = Column(Float, nullable = True)  # CDR
    psqi = Column(Integer, nullable = True)  # PSQI
    isi = Column(Integer, nullable = True)  # ISI
    gds = Column(Integer, nullable = True)  # GDS
    plan_desc_1 = Column(Text, nullable = True)
    plan_desc_2 = Column(Text, nullable = True)
    plan_desc_3 = Column(Text, nullable = True)
    plan_desc_4 = Column(Text, nullable = True)
    plan_desc_5 = Column(Text, nullable = True)
    plan_method_1 = Column(Text, nullable = True)
    plan_method_2 = Column(Text, nullable = True)
    plan_method_3 = Column(Text, nullable = True)
    plan_method_4 = Column(Text, nullable = True)
    plan_method_5 = Column(Text, nullable = True)
    plan_period_1 = Column(Text, nullable = True)
    plan_period_2 = Column(Text, nullable = True)
    plan_period_3 = Column(Text, nullable = True)
    plan_period_4 = Column(Text, nullable = True)
    plan_period_5 = Column(Text, nullable = True)
    plan_pas_6 = Column(String(10), nullable = True)
    plan_pas_period_6 = Column(String(10), nullable = True)
    plan_bear_7 = Column(String(10), nullable = True)
    plan_anti_8 = Column(String(10), nullable = True)
    plan_ruma_8 = Column(String(10), nullable = True)
    plan_tinea_site_9 = Column(Text, nullable = True)
    plan_tinea_9 = Column(String(10), nullable = True)
    plan_derma_site_10 = Column(Text, nullable = True)
    plan_derma_10 = Column(String(10), nullable = True)
    med_counseling = Column(Text, nullable = True)
    iv_order = Column(String(10), nullable = True)
    sign_dr = Column(String(100), nullable = True)
    ne_cog = Column(Boolean, default=False, nullable = True)  # 인지저하
    ne_sleep = Column(Boolean, default=False, nullable = True)  # 수면장애
    ne_depress = Column(Boolean, default=False, nullable = True)  # 우울감
    #  ─── 간호부 전용 필드 ───────────────────
    #  ─── 간호부 전용 필드 ───────────────────
    iv_route_1       = Column(String(100), nullable=True)
    nursing_result_1 = Column(Text, nullable=True)
    sign_nurse_1     = Column(String(100), nullable=True)

    iv_route_2       = Column(String(100), nullable=True)
    nursing_result_2 = Column(Text, nullable=True)
    sign_nurse_2     = Column(String(100), nullable=True)

    iv_route_3       = Column(String(100), nullable=True)
    nursing_result_3 = Column(Text, nullable=True)
    sign_nurse_3     = Column(String(100), nullable=True)

    nurse_note       = Column(Text, nullable=True)
    # ──── 약국부 전용 필드 ──────────────────
    counseling_pharmacist = Column(String(100), nullable=True)  # 복약지도 담당
    sign_pharmacist = Column(String(100), nullable=True)        # 약국부장
    patient = relationship("Patient", back_populates="emrs")

class VitalsUpdate(BaseModel):
    name: str
    birth_date: str
    record_date: str                # "YYYY-MM-DD"
    gender: str
    age: Optional[str] = None

    bt: Optional[str] = None
    bp: Optional[str] = None
    hr: Optional[str] = None
    bp2: Optional[str] = None
    bst: Optional[str] = None
    post_bst: Optional[str] = None

# Registration 모델: 접수 대기 환자 목록을 저장
class Registration(Base):
    __tablename__ = 'registrations'
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(100), nullable=False)
    birth_date = Column(String(6), nullable=False)
    status = Column(String(20), nullable=False, default="대기")
    created_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))

class RegistrationOut(BaseModel):
    id:           int
    patient_name: str
    birth_date:   str
    status:       str
    class Config:
        from_attributes = True

class RegistrationCreate(BaseModel):
    patient_name:   str
    birth_date:     str

#신환차트정보
class NewPatientChart(Base):
    __tablename__ = "new_patient_chart"
    id = Column(Integer, primary_key=True, index=True)
    form_date = Column(Date, nullable=False)
    provider = Column(String(50), nullable=False)
    author = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    birth_date = Column(Date, nullable=False)
    address = Column(String(255), nullable=False)
    occupation = Column(String(100), nullable=True)
    religion = Column(String(50), nullable=True)
    education = Column(String(50), nullable=True)
    marital_status = Column(String(50), nullable=True)
    other_info = Column(Text, nullable=True)
    bt = Column(Float, nullable=True)
    pr = Column(Integer, nullable=True)
    rr = Column(Integer, nullable=True)
    bp = Column(String(20), nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    allergy = Column(String(10), nullable=True)
    allergy_detail = Column(Text, nullable=True)
    history_DM = Column(String(10), nullable=True)
    history_DM_detail = Column(Text, nullable=True)
    history_HTN = Column(String(10), nullable=True)
    history_HTN_detail = Column(Text, nullable=True)
    history_HEPA = Column(String(10), nullable=True)
    history_HEPA_detail = Column(Text, nullable=True)
    history_TB = Column(String(10), nullable=True)
    history_TB_detail = Column(Text, nullable=True)
    history_OA = Column(String(10), nullable=True)
    history_OA_detail = Column(Text, nullable=True)
    history_ETC = Column(String(10), nullable=True)
    history_ETC_detail = Column(Text, nullable=True)


# (추후Visit, Chart 등 추가 가능)

# # === 방문 기록 테이블 (Visit) ===
# class Visit(Base):
#     __tablename__ = 'visits'
#     visit_id = Column(Integer, primary_key=True, autoincrement=True)  # 방문 고유 ID
#     patient_id = Column(Integer, ForeignKey("patients.patient_id", ondelete="CASCADE"), nullable=False)  # patients table에서 가져옴
#     visit_date = Column(Date, nullable=False)  # 방문 날짜
#     patient = relationship("Patient", back_populates="visits")  # 환자 정보 연결
#     chart = relationship("Chart", back_populates="visit", uselist=False, cascade="all, delete-orphan")  # 진료 기록 연결


# # === 진료 기록 테이블 (Chart) ===
# class Chart(Base):
#     __tablename__ = 'charts'
#     visit_id = Column(Integer, ForeignKey("visits.visit_id", ondelete="CASCADE"), primary_key=True)  # visits table에서 가져옴
#     birth_date = Column(Date, nullable=True)  # 생년월일
#     symptoms = Column(Text, nullable=True)  # 증상
#     treatment = Column(Text, nullable=True)  # 치료 내용
#     visit = relationship("Visit", back_populates="chart")  # 방문 기록과 연결




# === FASTAPI SETUP ===
app = FastAPI()

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# 정적파일 경로 설정
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# === 1. 로그인 화면 ===
@app.get("/", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == "admin" and password == "admin":
        # 대시보드 페이지로 리다이렉트
        return RedirectResponse(url="/dashboard", status_code=302)
    else:
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "아이디 또는 비밀번호가 올바르지 않습니다."} #login.html에 에러 메세지 전송
        )
    
@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


# === 2. 대시보드 (환자 검색 및 이동) ===
@app.get("/dashboard/search")
def search_patient(newname: str = None, db: Session = Depends(get_db)):
    if newname:
        patients = db.query(Patient).filter(Patient.name.ilike(f"%{newname}%")).all()
        if patients:
            result = [{"id": patient.id, "name": patient.name, "birth_date": patient.birth_date} for patient in patients]
        else:
            result = []
        return {"result": result}
    else:
        return {"result": []}

# 신환등록 관련
@app.post("/dashboard/add_new_patient")
def add_new_patient(name: str = Form(...), birth_date: str = Form(...), db: Session = Depends(get_db)):
    # 이름과 생년월일 모두로 중복 체크
    existing_patient = db.query(Patient).filter(
        Patient.name == name,
        Patient.birth_date == birth_date
    ).first()
    if existing_patient:
        return JSONResponse(status_code=400, content={"message": "환자가 이미 등록되어 있습니다."})
    
    # 환자 저장
    new_patient = Patient(name=name, birth_date=birth_date)
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "patient": {
            "id": new_patient.id,
            "name": new_patient.name,
            "birth_date": new_patient.birth_date
        }
    }

# 환자 접수 관리 페이지
@app.get("/dashboard/registrations", response_model=List[RegistrationOut])
def list_registrations(db: Session = Depends(get_db)):
    regs = db.query(Registration).order_by(Registration.id).all()
    return regs

@app.post("/dashboard/registrations", response_model = RegistrationOut, status_code = status.HTTP_201_CREATED,)
def create_registration(reg_in: RegistrationCreate= Body(...), db: Session = Depends(get_db),):
    new_reg = Registration(
        patient_name = reg_in.patient_name,
        birth_date = reg_in.birth_date,
        status = "대기",)
    
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg


@app.post("/dashboard/registrations/add", response_class=JSONResponse)
def add_to_registration(patient_name: str = Form(...), birth_date: str = Form(...), db: Session = Depends(get_db)):
    # 1) Insert into Registration
    new_reg = Registration(
        patient_name=patient_name,
        birth_date=birth_date,
        status="대기"
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)

    # 2) Return exactly the fields your JS needs
    return {
        "id":            new_reg.id,
        "patient_name":  new_reg.patient_name,
        "birth_date":    new_reg.birth_date,
        "status":        new_reg.status
    }


# DELETE a single registration
@app.delete("/dashboard/registrations/{reg_id}", status_code=204)
def delete_registration(reg_id: int, db: Session = Depends(get_db)):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(404, "등록된 환자를 찾을 수 없습니다.")
    db.delete(reg)
    db.commit()
    return  # 204 No Content

# POST to reset (clear) all registrations
@app.post("/dashboard/registrations/reset",status_code=204)
def reset_registrations(db: Session = Depends(get_db)):
    db.query(Registration).delete()
    db.commit()
    return

from fastapi import Body

@app.patch("/patient_emr/vitals")
async def upsert_vitals(
    payload: VitalsUpdate,
    db: Session = Depends(get_db)
):
    # 1) 환자 조회
    patient = db.query(Patient).filter(
        Patient.name == payload.name,
        Patient.birth_date == payload.birth_date
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 2) 날짜 파싱
    try:
        record_date_obj = datetime.strptime(payload.record_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식 오류 (YYYY-MM-DD)")

    # 3) 파싱 함수
    def parse_int(x: Optional[str]) -> Optional[int]:
        if x is None: 
            return None
        x = x.strip()
        if x == "":
            return None
        try:
            return int(x)
        except:
            return None

    def parse_float(x: Optional[str]) -> Optional[float]:
        if x is None:
            return None
        x = x.strip()
        if x == "":
            return None
        try:
            return float(x)
        except:
            return None

    # 4) 오늘자 EMR 찾기 (없으면 생성: Vital 먼저 입력하는 플로우 지원)
    emr = db.query(EMR).filter(
        EMR.patient_id == patient.id,
        EMR.record_date == record_date_obj
    ).first()

    if not emr:
        emr = EMR(
            patient_id=patient.id,
            record_date=record_date_obj,
            name=payload.name,
            gender=payload.gender,
            age=parse_int(payload.age) if payload.age else None,
        )
        db.add(emr)
        db.flush()  # emr.id 확보

    # 5) Vital 업데이트 (빈값이면 None 처리)
    emr.bt = parse_float(payload.bt)
    emr.bp = payload.bp.strip() if payload.bp else None
    emr.hr = parse_int(payload.hr)
    emr.bp2 = payload.bp2.strip() if payload.bp2 else None
    emr.bst = parse_int(payload.bst)
    emr.post_bst = parse_int(payload.post_bst)

    db.commit()
    db.refresh(emr)

    return {
        "message": "Vital signs 저장 완료",
        "emr_id": emr.id,
        "record_date": emr.record_date.strftime("%Y-%m-%d")
    }

@app.patch("/dashboard/registrations/{reg_id}", response_model=RegistrationOut)
def update_registration_status(
    reg_id: int,
    payload: dict = Body(...),          # expects {"status": "..."}
    db: Session = Depends(get_db)
):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(404, "등록된 환자를 찾을 수 없습니다.")
    new_status = payload.get("status")
    if new_status not in ("대기", "진료", "복약중", "완료"):
        raise HTTPException(400, "올바르지 않은 상태입니다.")
    reg.status = new_status
    db.commit()
    db.refresh(reg)
    return reg

@app.patch("/dashboard/update_status_by_identity")
async def update_status_by_identity(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    요청 JSON 예:
    {
        "name": "홍길동",
        "birth_date": "980101",
        "status": "복약"  # 또는 "수액, 복약"
    }
    """

    name = payload.get("name")
    birth_date = payload.get("birth_date")
    status = payload.get("status")

    if not name or not birth_date or not status:
        raise HTTPException(status_code=400, detail="모든 필드(name, birth_date, status)가 필요합니다.")

    # 상태값 유효성 검증
    valid_statuses = {
    "대기", "진료", "복약", "완료",

    # 레거시
    "수액", "수액 복약", "복약 수액",

    # 신규: 수액대기중/수액중
    "수액대기중", "수액중",
    "수액대기중 복약", "복약 수액대기중",
    "수액중 복약", "복약 수액중",
}
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"올바르지 않은 상태입니다: {status}")

    reg = db.query(Registration).filter(
        Registration.patient_name == name,
        Registration.birth_date == birth_date
    ).order_by(Registration.id.desc()).first()  # 가장 최근 등록건 찾기

    if not reg:
        raise HTTPException(status_code=404, detail="해당 환자 등록 정보를 찾을 수 없습니다.")

    reg.status = status
    db.commit()

    return {"message": "상태가 성공적으로 업데이트되었습니다.", "new_status": status}


# === 3. 환자 개별 페이지 (환자 방문 기록 및 진료 입력) ===
from datetime import date  # ✅ 추가 (파일 상단에 이미 있으면 중복 추가 X)

@app.get("/patient_emr", response_class=HTMLResponse)
async def patient_emr(
    request: Request,
    name: str,
    birth_date: str,
    db: Session = Depends(get_db)
):
    # ✅ birth_date는 여기서는 검증만 하고, parsed_birth_date는 사용하지 않으므로(현재 코드 기준) 유지/삭제 선택 가능
    try:
        if len(birth_date) == 6:
            _ = datetime.strptime(birth_date, "%y%m%d").date()
        else:
            _ = datetime.strptime(birth_date, "%Y-%m-%d").date()
    except ValueError as e:
        print("생년월일 파싱 오류:", e)
        raise HTTPException(status_code=400, detail="잘못된 생년월일 형식입니다.")

    # 1) 환자 조회
    patient = db.query(Patient).filter(
        Patient.name == name,
        Patient.birth_date == birth_date
    ).first()
    if not patient:
        print("환자 조회 실패:", name, birth_date)
        raise HTTPException(status_code=404, detail="해당 환자를 찾을 수 없습니다.")

    # 2) 환자의 전체 진료 기록(방문 기록) 조회: 왼쪽 방문기록 리스트용 (항상 최신순)
    visit_records = (
        db.query(EMR)
          .filter(EMR.patient_id == patient.id)
          .order_by(EMR.record_date.desc())
          .all()
    )
    latest_record = visit_records[0] if visit_records else None

    # 3) ✅ “오늘 날짜” EMR이 있을 때만 폼에 자동 채우기
    today = date.today()
    today_emr = (
        db.query(EMR)
          .filter(EMR.patient_id == patient.id, EMR.record_date == today)
          .first()
    )

    # 폼에 들어갈 emr: 오늘 기록이 있으면 그걸, 없으면 None(빈 폼)
    emr_for_form = today_emr

    # cc/pi도 “폼 기준(오늘 기록)”으로 보여주고 싶으면 이렇게
    cc = emr_for_form.cc if emr_for_form else None
    pi = emr_for_form.pi if emr_for_form else None

    print(
        "환자 조회 성공:", patient,
        "진료 기록 수:", len(visit_records),
        "오늘 기록 존재:", bool(today_emr)
    )

    return templates.TemplateResponse("patient_emr.html", {
        "request": request,
        "name": name,
        "birth_date": birth_date,
        "patient": patient,
        "visit_records": visit_records,   # 방문기록 리스트는 그대로 전체
        "latest_record": latest_record,   # (참고용) 최신기록도 유지
        "emr": emr_for_form,              # ✅ 핵심: 오늘 기록 있을 때만 자동 채움
        "cc": cc,
        "pi": pi,
        "getattr": getattr,               # ✅ 템플릿에서 getattr 사용 시 필수
    })

from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Form, Depends, HTTPException

@app.post("/patient_emr/new_emr")
async def create_new_emr(
    name: str                       = Form(...),
    birth_date: str                 = Form(...),
    record_date: str                = Form(...),       # "YYYY-MM-DD"
    gender: str                     = Form(...),
    age: Optional[str]              = Form(None),
    bt: Optional[str]               = Form(None),
    bp: Optional[str]               = Form(None),
    hr: Optional[str]               = Form(None),
    bp2: Optional[str]              = Form(None),
    bst: Optional[str]              = Form(None),
    post_bst: Optional[str]         = Form(None),
    cc: Optional[str]               = Form(None),
    medication_hx: Optional[str]    = Form(None),
    pmhx: Optional[str]             = Form(None),
    allergy: Optional[str]          = Form(None),
    fhx: Optional[str]              = Form(None),
    social: Optional[str]           = Form(None),
    pi: Optional[str]               = Form(None),
    ros: Optional[str]              = Form(None),
    pe: Optional[str]               = Form(None),
    problem_list: Optional[str]     = Form(None),
    assessment: Optional[str]       = Form(None),
    mmse: Optional[str]             = Form(None),
    cdr: Optional[str]              = Form(None),
    psqi: Optional[str]             = Form(None),
    isi: Optional[str]              = Form(None),
    gds: Optional[str]              = Form(None),
    ne_cog: Optional[str]           = Form(None),
    ne_sleep: Optional[str]         = Form(None),
    ne_depress: Optional[str]       = Form(None),

    plan_desc_1: Optional[str]      = Form(None),
    plan_desc_2: Optional[str]      = Form(None),
    plan_desc_3: Optional[str]      = Form(None),
    plan_desc_4: Optional[str]      = Form(None),
    plan_desc_5: Optional[str]      = Form(None),
    plan_method_1: Optional[str]    = Form(None),
    plan_method_2: Optional[str]    = Form(None),
    plan_method_3: Optional[str]    = Form(None),
    plan_method_4: Optional[str]    = Form(None),
    plan_method_5: Optional[str]    = Form(None),
    plan_period_1: Optional[str]    = Form(None),
    plan_period_2: Optional[str]    = Form(None),
    plan_period_3: Optional[str]    = Form(None),
    plan_period_4: Optional[str]    = Form(None),
    plan_period_5: Optional[str]    = Form(None),

    plan_pas_6: Optional[str]       = Form(None),
    plan_pas_period_6: Optional[str]= Form(None),
    plan_bear_7: Optional[str]      = Form(None),
    plan_anti_8: Optional[str]      = Form(None),
    plan_ruma_8: Optional[str]      = Form(None),

    plan_tinea_site_9: Optional[str]= Form(None),
    plan_tinea_9: Optional[str]     = Form(None),
    plan_derma_site_10: Optional[str]= Form(None),
    plan_derma_10: Optional[str]    = Form(None),

    med_counseling: Optional[str]   = Form(None),
    iv_order: Optional[str]         = Form(None),

    sign_dr: Optional[str]          = Form(None),
    sign_pharmacist: Optional[str]  = Form(None),
    counseling_pharmacist: Optional[str] = Form(None),

    db: Session                     = Depends(get_db)
):
    # 1) 환자 찾기
    patient = db.query(Patient).filter(
        Patient.name == name,
        Patient.birth_date == birth_date
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 2) 날짜 파싱
    try:
        record_date_obj = datetime.strptime(record_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식 오류 (YYYY-MM-DD)")

    # 3) 숫자 파싱 헬퍼
    def parse_int(x: Optional[str]) -> Optional[int]:
        if x is None:
            return None
        x = x.strip()
        if x == "":
            return None
        # 음수/공백 등은 여기서는 무시(필요 시 확장)
        if not x.isdigit():
            return None
        return int(x)

    def parse_float(x: Optional[str]) -> Optional[float]:
        if x is None:
            return None
        x = x.strip()
        if x == "":
            return None
        try:
            return float(x)
        except:
            return None

    age_val       = parse_int(age)
    bt_val        = parse_float(bt)
    hr_val        = parse_int(hr)
    bst_val       = parse_int(bst)
    post_bst_val  = parse_int(post_bst)
    mmse_val      = parse_int(mmse)
    cdr_val       = parse_float(cdr)
    psqi_val      = parse_int(psqi)
    isi_val       = parse_int(isi)
    gds_val       = parse_int(gds)

    # 4) ✅ 업서트 핵심: 오늘자 EMR 있으면 UPDATE, 없으면 INSERT
    emr = db.query(EMR).filter(
        EMR.patient_id == patient.id,
        EMR.record_date == record_date_obj
    ).first()

    created = False
    if not emr:
        emr = EMR(
            patient_id=patient.id,
            record_date=record_date_obj,
            name=name,
            gender=gender,
            age=age_val
        )
        db.add(emr)
        created = True

    # 5) 필드 업데이트(있던 레코드든 새 레코드든 동일 적용)
    emr.name = name
    emr.gender = gender
    emr.age = age_val

    emr.bt = bt_val
    emr.bp = bp.strip() if bp else None
    emr.hr = hr_val
    emr.bp2 = bp2.strip() if bp2 else None
    emr.bst = bst_val
    emr.post_bst = post_bst_val

    emr.cc = cc
    emr.medication_hx = medication_hx
    emr.pmhx = pmhx
    emr.allergy = allergy
    emr.fhx = fhx
    emr.social = social
    emr.pi = pi
    emr.ros = ros
    emr.pe = pe
    emr.problem_list = problem_list
    emr.assessment = assessment

    emr.mmse = mmse_val
    emr.cdr = cdr_val
    emr.psqi = psqi_val
    emr.isi = isi_val
    emr.gds = gds_val

    # Boolean(체크박스) 처리: HTML 폼에서 체크되면 보통 "on"이 들어옴
    truthy = {"on", "true", "1", "yes", "o"}
    emr.ne_cog     = True if (ne_cog and ne_cog.lower() in truthy) else False
    emr.ne_sleep   = True if (ne_sleep and ne_sleep.lower() in truthy) else False
    emr.ne_depress = True if (ne_depress and ne_depress.lower() in truthy) else False

    emr.plan_desc_1 = plan_desc_1
    emr.plan_desc_2 = plan_desc_2
    emr.plan_desc_3 = plan_desc_3
    emr.plan_desc_4 = plan_desc_4
    emr.plan_desc_5 = plan_desc_5

    emr.plan_method_1 = plan_method_1
    emr.plan_method_2 = plan_method_2
    emr.plan_method_3 = plan_method_3
    emr.plan_method_4 = plan_method_4
    emr.plan_method_5 = plan_method_5

    emr.plan_period_1 = plan_period_1
    emr.plan_period_2 = plan_period_2
    emr.plan_period_3 = plan_period_3
    emr.plan_period_4 = plan_period_4
    emr.plan_period_5 = plan_period_5

    emr.plan_pas_6 = plan_pas_6
    emr.plan_pas_period_6 = plan_pas_period_6
    emr.plan_bear_7 = plan_bear_7
    emr.plan_anti_8 = plan_anti_8
    emr.plan_ruma_8 = plan_ruma_8

    emr.plan_tinea_site_9 = plan_tinea_site_9
    emr.plan_tinea_9 = plan_tinea_9
    emr.plan_derma_site_10 = plan_derma_site_10
    emr.plan_derma_10 = plan_derma_10

    emr.med_counseling = med_counseling
    emr.iv_order = iv_order

    emr.sign_dr = sign_dr
    emr.sign_pharmacist = sign_pharmacist
    emr.counseling_pharmacist = counseling_pharmacist

    # 6) 저장
    db.commit()
    db.refresh(emr)

    return JSONResponse(content={
        "message": "진료차트가 성공적으로 저장되었습니다." if created else "진료차트가 성공적으로 업데이트되었습니다.",
        "emr_id": emr.id,
        "record_date": emr.record_date.strftime("%Y-%m-%d")
    })

# 과거 EMR 기록 불러오기
@app.get("/patient_emr/past_emr")
async def get_past_emr(
    visit_date: str,
    name: str,
    birth_date: str,              # ✅ 추가
    db: Session = Depends(get_db)
):
    # 1) 날짜 파싱
    try:
        visit_date_obj = datetime.strptime(visit_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 날짜 형식입니다.")

    # 2) 환자 조회 (name + birth_date)
    patient = db.query(Patient).filter(
        Patient.name == name,
        Patient.birth_date == birth_date
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 3) EMR 조회 (patient_id + record_date)
    emr_record = db.query(EMR).filter(
        EMR.patient_id == patient.id,
        EMR.record_date == visit_date_obj
    ).first()

    if not emr_record:
        raise HTTPException(status_code=404, detail="해당 날짜의 진료 기록을 찾을 수 없습니다.")

    # 4) JSON 리턴 (기존 content 그대로 유지)
    return JSONResponse(content={
        "message": "진료 기록이 성공적으로 조회되었습니다.",
        "emr_id": emr_record.id,
        "patient_id": emr_record.patient_id,
        "record_date": emr_record.record_date.strftime("%Y-%m-%d"),
        "name": emr_record.name,
        "gender": emr_record.gender,
        "age": emr_record.age,
        "bt": emr_record.bt,
        "bp": emr_record.bp,
        "hr": emr_record.hr,
        "bp2": emr_record.bp2,
        "bst": emr_record.bst,
        "post_bst": emr_record.post_bst,
        "cc": emr_record.cc,
        "medication_hx": emr_record.medication_hx,
        "pmhx": emr_record.pmhx,
        "allergy": emr_record.allergy,
        "fhx": emr_record.fhx,
        "social": emr_record.social,
        "pi": emr_record.pi,
        "ros": emr_record.ros,
        "pe": emr_record.pe,
        "problem_list": emr_record.problem_list,
        "assessment": emr_record.assessment,
        "mmse": emr_record.mmse,
        "cdr": emr_record.cdr,
        "psqi": emr_record.psqi,
        "isi": emr_record.isi,
        "gds": emr_record.gds,
        "ne_cog": emr_record.ne_cog,
        "ne_sleep": emr_record.ne_sleep,
        "ne_depress": emr_record.ne_depress,

        "plan_desc_1": emr_record.plan_desc_1,
        "plan_method_1": emr_record.plan_method_1,
        "plan_period_1": emr_record.plan_period_1,
        "plan_desc_2": emr_record.plan_desc_2,
        "plan_method_2": emr_record.plan_method_2,
        "plan_period_2": emr_record.plan_period_2,
        "plan_desc_3": emr_record.plan_desc_3,
        "plan_method_3": emr_record.plan_method_3,
        "plan_period_3": emr_record.plan_period_3,
        "plan_desc_4": emr_record.plan_desc_4,
        "plan_method_4": emr_record.plan_method_4,
        "plan_period_4": emr_record.plan_period_4,
        "plan_desc_5": emr_record.plan_desc_5,
        "plan_method_5": emr_record.plan_method_5,
        "plan_period_5": emr_record.plan_period_5,

        "plan_pas_6": emr_record.plan_pas_6,
        "plan_pas_period_6": emr_record.plan_pas_period_6,
        "plan_bear_7": emr_record.plan_bear_7,
        "plan_anti_8": emr_record.plan_anti_8,
        "plan_ruma_8": emr_record.plan_ruma_8,
        "plan_tinea_site_9": emr_record.plan_tinea_site_9,
        "plan_tinea_9": emr_record.plan_tinea_9,
        "plan_derma_site_10": emr_record.plan_derma_site_10,
        "plan_derma_10": emr_record.plan_derma_10,

        "med_counseling": emr_record.med_counseling,
        "iv_order": emr_record.iv_order,
        "sign_dr": emr_record.sign_dr,
    })

@app.get("/patient_emr/new_patient_chart", response_class=HTMLResponse)
async def new_patient_chart(request: Request, name: str, birth_date: str, db: Session = Depends(get_db)):
    # birth_date 변환 로직
    try:
        if int(birth_date[:2]) < 10:
            formatted_birth_date = f"20{birth_date[:2]}-{birth_date[2:4]}-{birth_date[4:]}"
        else:
            formatted_birth_date = f"19{birth_date[:2]}-{birth_date[2:4]}-{birth_date[4:]}"
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 생년월일 형식입니다.")

    # 데이터베이스에서 환자 정보 조회
    patient_chart = db.query(NewPatientChart).filter(
        NewPatientChart.name == name,
        NewPatientChart.birth_date == formatted_birth_date
    ).first()

    # 템플릿 렌더링
    return templates.TemplateResponse("new_emr.html", {
        "request": request,
        "chart": patient_chart,
        "getattr": getattr  # Jinja2 템플릿에서 사용할 수 있도록 추가
    })

@app.post("/patient_emr/new_patient_chart/information")
async def save_new_patient_chart(
    form_date: str = Form(...),
    provider: str = Form(...),
    author: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    birth_date: str = Form(...),
    address: str = Form(...),
    occupation: str = Form(None),
    religion: str = Form(None),
    education: str = Form(None),
    marital_status: str = Form(None),
    other_info: str = Form(None),
    bt: float = Form(None),
    pr: int = Form(None),
    rr: int = Form(None),
    bp: str = Form(None),
    height: float = Form(None),
    weight: float = Form(None),
    allergy: str = Form(None),
    allergy_detail: str = Form(None),
    history_DM: str = Form(None),
    history_DM_detail: str = Form(None),
    history_HTN: str = Form(None),
    history_HTN_detail: str = Form(None),
    history_HEPA: str = Form(None),
    history_HEPA_detail: str = Form(None),
    history_TB: str = Form(None),
    history_TB_detail: str = Form(None),
    history_OA: str = Form(None),
    history_OA_detail: str = Form(None),
    history_ETC: str = Form(None),
    history_ETC_detail: str = Form(None),
    db: Session = Depends(get_db)
):
    new_chart = NewPatientChart(
        form_date=form_date,
        provider=provider,
        author=author,
        name=name,
        gender=gender,
        birth_date=birth_date,
        address=address,
        occupation=occupation,
        religion=religion,
        education=education,
        marital_status=marital_status,
        other_info=other_info,
        bt=bt,
        pr=pr,
        rr=rr,
        bp=bp,
        height=height,
        weight=weight,
        allergy=allergy,
        allergy_detail=allergy_detail,
        history_DM=history_DM,
        history_DM_detail=history_DM_detail,
        history_HTN=history_HTN,
        history_HTN_detail=history_HTN_detail,
        history_HEPA=history_HEPA,
        history_HEPA_detail=history_HEPA_detail,
        history_TB=history_TB,
        history_TB_detail=history_TB_detail,
        history_OA=history_OA,
        history_OA_detail=history_OA_detail,
        history_ETC=history_ETC,
        history_ETC_detail=history_ETC_detail,
    )
    db.add(new_chart)
    db.commit()
    db.refresh(new_chart)
    return {"message": "환자 정보가 성공적으로 저장되었습니다.", "id": new_chart.id}

@app.post("/patient_emr/vitals")
async def save_vitals(
    name: str = Form(...),
    birth_date: str = Form(...),
    record_date: str = Form(...),
    gender: str = Form(...),
    age: Optional[str] = Form(None),

    bt: Optional[str] = Form(None),
    bp: Optional[str] = Form(None),
    hr: Optional[str] = Form(None),
    bp2: Optional[str] = Form(None),
    bst: Optional[str] = Form(None),
    post_bst: Optional[str] = Form(None),

    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        raise HTTPException(404, "환자를 찾을 수 없습니다.")

    try:
        record_date_obj = datetime.strptime(record_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "날짜 형식 오류 (YYYY-MM-DD)")

    def parse_int(x: Optional[str]) -> Optional[int]:
        return int(x) if x and x.strip().isdigit() else None

    def parse_float(x: Optional[str]) -> Optional[float]:
        if not x: return None
        x = x.strip()
        try:
            return float(x)
        except:
            return None

    # ✅ 오늘자(해당 record_date) EMR 찾기
    emr = db.query(EMR).filter(EMR.patient_id == patient.id, EMR.record_date == record_date_obj).first()

    if not emr:
        # ✅ 최소 필수값으로 새로 생성
        emr = EMR(
            patient_id=patient.id,
            record_date=record_date_obj,
            name=name,
            gender=gender,
            age=parse_int(age) if age else None,
        )
        db.add(emr)
        db.flush()  # id 확보

    # ✅ Vital update
    emr.bt = parse_float(bt)
    emr.bp = bp
    emr.hr = parse_int(hr)
    emr.bp2 = bp2
    emr.bst = parse_int(bst)
    emr.post_bst = parse_int(post_bst)

    db.commit()
    db.refresh(emr)

    return {"message": "Vital signs 저장 완료", "emr_id": emr.id}


# ─── 간호부 EMR 폼 ───────────────────────────────────────
# ─── 간호부 EMR 폼 ───────────────────────────────────────
from typing import Optional

@app.get("/patient_emr_nur", response_class=HTMLResponse)
def patient_emr_nur(
    request: Request,
    name: str,
    birth_date: str,
    emr_id: Optional[int] = None,           # ← emr_id 파라미터 추가
    db: Session = Depends(get_db)
):
    # 1) 환자 조회
    patient = db.query(Patient)\
                .filter(Patient.name == name, Patient.birth_date == birth_date)\
                .first()
    if not patient:
        raise HTTPException(404, "환자를 찾을 수 없습니다.")

    # 2) 전체 EMR 목록 (방문 기록) 조회
    visit_records = (
        db.query(EMR)
          .filter(EMR.patient_id == patient.id)
          .order_by(EMR.record_date.desc())
          .all()
    )

    # 3) 표시할 EMR 결정: emr_id가 있으면 그 레코드, 없으면 최신
    if emr_id:
        emr = db.query(EMR)\
                .filter(EMR.id == emr_id, EMR.patient_id == patient.id)\
                .first()
    else:
        emr = visit_records[0] if visit_records else None

    return templates.TemplateResponse("patient_emr_nur.html", {
        "request":       request,
        "name":          name,
        "birth_date":    birth_date,
        "visit_records": visit_records,
        "emr":           emr,
        "selected_emr_id": emr.id if emr else None      # 선택된(또는 최신) EMR
    })


@app.post("/patient_emr_nur")
def save_patient_emr_nur(
    emr_id: int = Form(...),

    iv_route_1: str = Form(None),
    nursing_result_1: str = Form(None),
    sign_nurse_1: str = Form(None),

    iv_route_2: str = Form(None),
    nursing_result_2: str = Form(None),
    sign_nurse_2: str = Form(None),

    iv_route_3: str = Form(None),
    nursing_result_3: str = Form(None),
    sign_nurse_3: str = Form(None),

    nurse_note: str = Form(None),
    db: Session = Depends(get_db)
):
    emr = db.query(EMR).filter(EMR.id == emr_id).first()
    if not emr:
        raise HTTPException(status_code=404, detail="해당 진료기록을 찾을 수 없습니다.")

    emr.iv_route_1 = iv_route_1
    emr.nursing_result_1 = nursing_result_1
    emr.sign_nurse_1 = sign_nurse_1

    emr.iv_route_2 = iv_route_2
    emr.nursing_result_2 = nursing_result_2
    emr.sign_nurse_2 = sign_nurse_2

    emr.iv_route_3 = iv_route_3
    emr.nursing_result_3 = nursing_result_3
    emr.sign_nurse_3 = sign_nurse_3

    emr.nurse_note = nurse_note
    db.commit()

    return JSONResponse(content={"message": "저장이 완료되었습니다."})



# ─── 약국부 EMR 폼 ───────────────────────────────────────
# ─── 약국부 EMR 폼 ───────────────────────────────────────
from typing import Optional

@app.get("/patient_emr_pha", response_class=HTMLResponse)
async def patient_emr_pha(
    request: Request,
    name: str,
    birth_date: str,
    emr_id: Optional[int] = None,   # ✅ emr_id 추가
    db: Session = Depends(get_db),
):
    # 1) Patient
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 2) 방문기록 전체
    visit_records = (
        db.query(EMR)
          .filter(EMR.patient_id == patient.id)
          .order_by(EMR.record_date.desc())
          .all()
    )

    # 3) 표시할 EMR: emr_id가 있으면 해당건, 없으면 최신
    if emr_id:
        emr = db.query(EMR).filter(EMR.id == emr_id, EMR.patient_id == patient.id).first()
    else:
        emr = visit_records[0] if visit_records else None
    if not emr:
        raise HTTPException(status_code=404, detail="아직 생성된 진료 기록이 없습니다.")

    # 4) 최신 Registration 1건 (기존 로직 그대로)
    registration = (
        db.query(Registration)
          .filter(Registration.patient_name == name, Registration.birth_date == birth_date)
          .order_by(Registration.id.desc())
          .first()
    )

    return templates.TemplateResponse("patient_emr_pha.html", {
        "request":       request,
        "name":          name,
        "birth_date":    birth_date,
        "visit_records": visit_records,
        "emr":           emr,              # ✅ 선택된 EMR 전달
        "registration":  registration,
    })

@app.post("/patient_emr_pha")
async def save_patient_emr_pha(
    emr_id: int = Form(...),
    sign_med_counsel: str = Form(None),
    sign_pharmacist: str = Form(None),
    registration_id: int = Form(...),
    current_status: str = Form(""),
    db: Session = Depends(get_db),
):
    # 1. EMR 저장
    emr = db.query(EMR).filter(EMR.id == emr_id).first()
    if not emr:
        raise HTTPException(status_code=404, detail="EMR not found")

    emr.counseling_pharmacist = sign_med_counsel
    emr.sign_pharmacist       = sign_pharmacist

    # 2. Registration 상태 업데이트
    reg = db.query(Registration).filter(Registration.id == registration_id).first()
    if reg:
        updated_status = current_status.replace("복약", "").strip()
        reg.status = updated_status if updated_status else "완료"

    db.commit()
    return JSONResponse({"message": "저장이 완료되었습니다."})

from datetime import date, datetime

def calculate_age(birth_date_str):
    # birth_date_str 예: "930215" (YYMMDD)
    yy = int(birth_date_str[:2])
    mm = int(birth_date_str[2:4])
    dd = int(birth_date_str[4:6])
    year_prefix = 1900 if yy > int(str(date.today().year)[2:]) else 2000
    full_year = year_prefix + yy
    birth_date = date(full_year, mm, dd)

    today = date.today()
    intl_age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    kor_age = today.year - birth_date.year + 1
    return f"{kor_age}세 (만{intl_age}세)"


# @app.post("/patient_emr/complete_visit")
# async def complete_visit(
#     payload: dict = Body(...),
#     db: Session = Depends(get_db)
# ):
#     """
#     요청 본문 예시:
#     {
#       "name": "조승권",
#       "birth_date": "010305",
#       "visit_date": "2023-04-15"
#     }
#     """
#     name = payload.get("name")
#     birth_date = payload.get("birth_date")
#     visit_date_str = payload.get("visit_date")
#     try:
#         visit_date = datetime.strptime(visit_date_str, "%Y-%m-%d").date()
#     except:
#         raise HTTPException(status_code=400, detail="잘못된 날짜 형식입니다.")
    
#     # 환자 조회
#     patient = db.query(Patient).filter(
#         Patient.name == name,
#         Patient.birth_date == birth_date
#     ).first()
#     if not patient:
#         raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    
#     # 해당 EMR 레코드 조회
#     emr = db.query(EMR).filter(
#         EMR.patient_id == patient.id,
#         EMR.visit_date == visit_date
#     ).first()
#     if not emr:
#         raise HTTPException(status_code=404, detail="진료 기록을 찾을 수 없습니다.")
    
#     # 상태 업데이트
#     emr.status = "완료"
#     db.commit()
#     return {"message": "완료 처리되었습니다.", "visit_date": visit_date_str}

# === 앱 시작 시 테이블 자동 생성 ===
if __name__ == "__main__":
    print("🔧 데이터베이스 테이블을 생성합니다...")
    Base.metadata.create_all(bind=engine)
    print("✅ 테이블 생성 완료! FastAPI 서버를 시작하려면 uvicorn main:app --reload 명령을 사용하세요.")


# @app.post("/patient_emr/new_emr")
# async def create_new_emr(
#     request: Request,
#     name: str = Form(...),
#     birth_date: str = Form(...),
#     visit_date: str = Form(...),
#     symptoms: str = Form(...),
#     treatment: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     try:
#         birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()
#         visit_date_obj = datetime.strptime(visit_date, "%Y-%m-%d").date()
#     except ValueError:
#         return RedirectResponse(url=f"/patient_emr?name={name}&birth_date={birth_date}&error=날짜 오류", status_code=302)

#     new_record = EMR(
#         name=name,
#         birth_date=birth_date_obj,
#         visit_date=visit_date_obj,
#         symptoms=symptoms,
#         treatment=treatment
#     )
#     db.add(new_record)
#     db.commit()
#     db.refresh(new_record)

#     return RedirectResponse(url=f"/patient_detail?name={name}&birth_date={birth_date}", status_code=302)

# # === 4. 환자 접수 관리 ===
# @app.get("/registration", response_class=HTMLResponse)
# async def registration_page(request: Request, db: Session = Depends(get_db)):
#     regs = db.query(Registration).order_by(Registration.id).all()
#     return templates.TemplateResponse("registration.html", {"request": request, "registrations": regs})

# @app.post("/registration/add")
# async def registration_add(
#     request: Request,
#     patient_name: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     new_reg = Registration(patient_name=patient_name, status="대기")
#     db.add(new_reg)
#     db.commit()
#     db.refresh(new_reg)
#     return RedirectResponse(url="/registration", status_code=302)

# @app.post("/registration/update")
# async def registration_update(
#     request: Request,
#     id: int = Form(...),
#     patient_name: str = Form(...),
#     status: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     reg = db.query(Registration).filter(Registration.id == id).first()
#     if reg:
#         reg.patient_name = patient_name
#         reg.status = status
#         db.commit()
#     return RedirectResponse(url="/registration", status_code=302)

# @app.post("/registration/delete")
# async def registration_delete(
#     request: Request,
#     id: int = Form(...),
#     db: Session = Depends(get_db)
# ):
#     reg = db.query(Registration).filter(Registration.id == id).first()
#     if reg:
#         db.delete(reg)
#         db.commit()
#     return RedirectResponse(url="/registration", status_code=302)

# @app.post("/registration/reset")
# async def registration_reset(request: Request, db: Session = Depends(get_db)):
#     db.query(Registration).delete()
#     db.commit()
#     db.execute(text("ALTER TABLE registrations AUTO_INCREMENT = 1"))
#     db.commit()
#     return RedirectResponse(url="/registration", status_code=302)

# 실행: uvicorn main:app --reload
