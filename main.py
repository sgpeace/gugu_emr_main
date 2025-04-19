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
from typing   import List

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
    visit_date = Column(Date, nullable=False)
    symptoms = Column(Text, nullable=False)
    treatment = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default=text("'진료중'"))

    # Vital 및 SOAP
    bp = Column(String(20))         # 혈압
    hr = Column(Integer)           # 맥박
    glucose = Column(Integer)      # 혈당
    temp = Column(Float)           # 체온
    objective = Column(Text)       # 징후 (Signs)
    assessment = Column(Text)      # 진단 (Assessment)

    patient = relationship("Patient", back_populates="emrs")

# Registration 모델: 접수 대기 환자 목록을 저장
class Registration(Base):
    __tablename__ = 'registrations'
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(100), nullable=False)
    birth_date   = Column(String(6), nullable=False)
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


Base.metadata.create_all(bind=engine)

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

    # 환자 조회 시 로그 추가
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        print("환자 조회 실패:", name, birth_date)
        raise HTTPException(status_code=404, detail="해당 환자를 찾을 수 없습니다.")

    # 환자의 진료 기록 조회
    visit_records = db.query(EMR).filter(EMR.patient_id == patient.id).order_by(EMR.visit_date.desc()).all()
    if visit_records:
        latest_record = visit_records[0]
    else:
        visit_records = []
        latest_record = None

    print("환자 조회 성공:", patient, "진료 기록 수:", len(visit_records))

    return templates.TemplateResponse("patient_emr.html", {
        "request": request,
        "name": name,
        "birth_date": birth_date,
        "patient": patient,
        "visit_records": visit_records,
        "latest_record": latest_record
    })

# === 새로운 EMR 저장 API ===
@app.post("/patient_emr/new_emr")
async def create_new_emr(
    name: str = Form(...),
    birth_date: str = Form(...),
    visit_date: str = Form(...),
    symptoms: str = Form(...),
    treatment: str = Form(...),
    vitals_bp: str = Form(None),
    vitals_hr: int = Form(None),
    vitals_glucose: int = Form(None),
    vitals_temp: float = Form(None),
    objective: str = Form(None),
    assessment: str = Form(None),
    db: Session = Depends(get_db)
):
    # 환자 찾기
    patient = db.query(Patient).filter(Patient.name == name, Patient.birth_date == birth_date).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    # 날짜 파싱
    try:
        visit_date_obj = datetime.strptime(visit_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식 오류")

    # EMR 저장
    new_emr = EMR(
        patient_id=patient.id,
        visit_date=visit_date_obj,
        symptoms=symptoms,
        treatment=treatment,
        bp=vitals_bp,
        hr=vitals_hr,
        glucose=vitals_glucose,
        temp=vitals_temp,
        objective=objective,
        assessment=assessment
    )
    db.add(new_emr)
    db.commit()
    db.refresh(new_emr)

    return JSONResponse(content={
    "message": "진료차트가 성공적으로 저장되었습니다.",
})




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
