from fastapi import FastAPI, Request, Form, Depends, HTTPException, Body, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime
from sqlalchemy import text
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import CheckConstraint
from sqlalchemy import Float
from pydantic import BaseModel
<<<<<<< Updated upstream
from typing import List
=======
from typing import List, Optional 
>>>>>>> Stashed changes


# === DATABASE SETUP ===
DATABASE_URL = "mysql+pymysql://root:%40KOOdo0506@localhost/emr_db"
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
    notes = Column(Text, nullable=True, default="") #환자 비고 부분
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
    age = Column(String(20), nullable=False)  # 나이
    bt = Column(Float)  # BT (체온)
    bp = Column(String(20))  # BP (혈압)
    hr = Column(Integer)  # HR (맥박)
    bp2 = Column(String(20))  # 2차 BP
    bst = Column(Integer)  # BST (혈당)
    post_bst = Column(Integer)  # 식후(시간)
    cc = Column(Text)  # 주호소
    onset = Column(String(50))  # Onset
    duration = Column(String(50))  # Duration
    assoc = Column(String(100))  # Assoc. Sx.
    medication_hx = Column(Text)  # Medication Hx.
    pmhx = Column(Text)  # PMHx.
    allergy = Column(Text)  # Allergy
    fhx = Column(Text)  # FHx.
    social = Column(Text)  # Social
    pi = Column(Text)  # P.I. (병력)
    ros = Column(Text)  # ROS
    pe = Column(Text)  # P/E
    problem_list = Column(Text)  # Problem list
    assessment = Column(Text)  # Assessment
    mmse = Column(Integer)  # MMSE
    cdr = Column(Float)  # CDR
    psqi = Column(Integer)  # PSQI
    isi = Column(Integer)  # ISI

    patient = relationship("Patient", back_populates="emrs")

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
        orm_mode = True

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
    occupation = Column(String(100))
    religion = Column(String(50))
    education = Column(String(50))
    marital_status = Column(String(50))
    other_info = Column(Text)
    bt = Column(Float)
    pr = Column(Integer)
    rr = Column(Integer)
    bp = Column(String(20))
    height = Column(Float)
    weight = Column(Float)
    allergy = Column(String(10))
    allergy_detail = Column(Text)
    history_DM = Column(String(10))
    history_DM_detail = Column(Text)
    history_HTN = Column(String(10))
    history_HTN_detail = Column(Text)
    history_HEPA = Column(String(10))
    history_HEPA_detail = Column(Text)
    history_TB = Column(String(10))
    history_TB_detail = Column(Text)
    history_OA = Column(String(10))
    history_OA_detail = Column(Text)
    history_ETC = Column(String(10))
    history_ETC_detail = Column(Text)

#환자 비고란을 위한 Class
class NotesIn(BaseModel):
    name: str
    birth_date: str
    notes: str

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
    #생년월일 확인 메커니즘
    # ① 길이가 6자리인지 확인
    if len(birth_date) != 6:
        raise HTTPException(400, "생년월일은 YYMMDD 형식의 6자리여야 합니다.")
    # ② 파싱 시도: YYMMDD → date 객체
    try:
        parsed: datetime = datetime.strptime(birth_date, "%y%m%d")
    except ValueError:
        raise HTTPException(400, "유효한 생년월일을 입력하세요 (YYMMDD).")
    
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
     # 0) 중복 검사
    existing_reg = db.query(Registration).filter(
        Registration.patient_name == patient_name,
        Registration.birth_date == birth_date,
        Registration.status.in_(['대기', '진료'])
    ).first()

    if existing_reg:
        return JSONResponse(status_code=400, content={"message": "이미 대기 중인 환자입니다."})


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
    if new_status not in ("대기", "진료"):
        raise HTTPException(400, "올바르지 않은 상태입니다.")
    reg.status = new_status
    db.commit()
    db.refresh(reg)
    return reg


# === 3. 환자 개별 페이지 (환자 방문 기록 및 진료 입력) ===
@app.get("/patient_emr", response_class=HTMLResponse)
async def patient_emr(
    request: Request,
    name: str,
    birth_date: str,
    db: Session = Depends(get_db)
):
    try:
        if len(birth_date) == 6:
            parsed_birth_date = datetime.strptime(birth_date, "%y%m%d").date()
        else:
            parsed_birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()
    except ValueError as e:
        print("생년월일 파싱 오류:", e)
        raise HTTPException(status_code=400, detail="잘못된 생년월일 형식입니다.")

    # 환자 조회
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        print("환자 조회 실패:", name, birth_date)
        raise HTTPException(status_code=404, detail="해당 환자를 찾을 수 없습니다.")

    # 환자의 진료 기록 조회
    visit_records = db.query(EMR).filter(EMR.patient_id == patient.id).order_by(EMR.record_date.desc()).all()
    if visit_records:
        latest_record = visit_records[0]
        # latest_record의 날짜와 환자의 이름으로 cc와 pi 조회
        cc = latest_record.cc
        pi = latest_record.pi
    else:
        visit_records = []
        latest_record = None
        cc = None
        pi = None

    print("환자 조회 성공:", patient, "진료 기록 수:", len(visit_records))

    return templates.TemplateResponse("patient_emr.html", {
        "request": request,
        "name": name,
        "birth_date": birth_date,
        "patient": patient,
        "visit_records": visit_records,
        "latest_record": latest_record,
        "cc": cc,
        "pi": pi
    })

<<<<<<< Updated upstream
=======
# ── ① GET: 기존 환자 비고를 불러오는 엔드포인트 ─────────────────
@app.get("/patient_emr/get_patient_notes")
async def get_patient_notes(name: str, birth_date: str, db: Session = Depends(get_db)):
    # 1) 해당 이름·생년월일의 Patient 조회
    patient = db.query(Patient).filter(
        Patient.name == name,
        Patient.birth_date == birth_date
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="해당 환자를 찾을 수 없습니다.")
    # 2) notes 컬럼이 비어 있으면 빈 문자열, 아니면 실제 메모 반환
    return JSONResponse(content={"notes": patient.notes or ""})

@app.post("/patient_emr/save_patient_notes")
async def save_patient_notes(payload: NotesIn, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(
        Patient.name == payload.name,
        Patient.birth_date == payload.birth_date
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="해당 환자를 찾을 수 없습니다.")
    patient.notes = payload.notes
    db.commit()
    db.refresh(patient)
    return JSONResponse(content={"message": "메모 저장 완료"})




>>>>>>> Stashed changes
@app.post("/patient_emr/new_emr")
async def create_new_emr(
    name: str = Form(...),
    birth_date: str = Form(...),
    record_date: str = Form(...),
    gender: str = Form(...),
    age: str = Form(...),
    bt: float = Form(None),
    bp: str = Form(None),
    hr: int = Form(None),
    bp2: str = Form(None),
    bst: int = Form(None),
    post_bst: int = Form(None),
    cc: str = Form(None),
    onset: str = Form(None),
    duration: str = Form(None),
    assoc: str = Form(None),
    medication_hx: str = Form(None),
    pmhx: str = Form(None),
    allergy: str = Form(None),
    fhx: str = Form(None),
    social: str = Form(None),
    pi: str = Form(None),
    ros: str = Form(None),
    pe: str = Form(None),
    problem_list: str = Form(None),
    assessment: str = Form(None),
    mmse: int = Form(None),
    cdr: float = Form(None),
    psqi: int = Form(None),
    isi: int = Form(None),
    gds: int = Form(None),
    db: Session = Depends(get_db)
):
    # 환자 찾기
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 날짜 파싱
    try:
        record_date_obj = datetime.strptime(record_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식 오류")

    # EMR 저장
    new_emr = EMR(
        patient_id=patient.id,
        record_date=record_date_obj,
        name=name,
        gender=gender,
        age=age,
        bt=bt,
        bp=bp,
        hr=hr,
        bp2=bp2,
        bst=bst,
        post_bst=post_bst,
        cc=cc,
        onset=onset,
        duration=duration,
        assoc=assoc,
        medication_hx=medication_hx,
        pmhx=pmhx,
        allergy=allergy,
        fhx=fhx,
        social=social,
        pi=pi,
        ros=ros,
        pe=pe,
        problem_list=problem_list,
        assessment=assessment,
        mmse=mmse,
        cdr=cdr,
        psqi=psqi,
        isi=isi,
    )
    db.add(new_emr)
    db.commit()
    db.refresh(new_emr)

    return JSONResponse(content={
        "message": "진료차트가 성공적으로 저장되었습니다.",
        "emr_id": new_emr.id
    })

# 과거 EMR 기록 불러오기
@app.get("/patient_emr/past_emr")
async def get_past_emr(visit_date: str, name: str, db: Session = Depends(get_db)):
    try:
        # 방문 날짜를 파싱
        visit_date_obj = datetime.strptime(visit_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="잘못된 날짜 형식입니다.")

    # 방문 날짜와 이름에 해당하는 EMR 기록 조회
    emr_record = (
        db.query(EMR)
        .join(Patient, EMR.patient_id == Patient.id)
        .filter(EMR.record_date == visit_date_obj, Patient.name == name)
        .first()
    )
    if not emr_record:
        raise HTTPException(status_code=404, detail="해당 날짜와 이름의 진료 기록을 찾을 수 없습니다.")

    # 결과 반환 (JSONResponse 형식으로 수정)
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
        "onset": emr_record.onset,
        "duration": emr_record.duration,
        "assoc": emr_record.assoc,
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
    })

#신환차트 버튼 클릭시
@app.get("/patient_emr/new_patient_chart", response_class=HTMLResponse)
async def new_patient_chart(request: Request, name: str, birth_date: str, db: Session = Depends(get_db)):
    # 환자 정보 조회
    patient_chart = db.query(NewPatientChart).filter(
        NewPatientChart.name == name,
        NewPatientChart.birth_date == birth_date
    ).first()

    if not patient_chart:
        # 환자 정보가 없으면 빈 값으로 렌더링
        return templates.TemplateResponse("new_emr.html", {
            "request": request,
            "name": name,
            "birth_date": birth_date,
            "chart": None
        })

    # 환자 정보가 있으면 해당 데이터를 템플릿에 전달
    return templates.TemplateResponse("new_emr.html", {
        "request": request,
        "name": name,
        "birth_date": birth_date,
        "chart": patient_chart
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
    return RedirectResponse(
        url=f"/patient_emr/new_patient_chart?name={name}&birth_date={birth_date}",
        status_code=302)

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
