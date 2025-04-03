from fastapi import FastAPI, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from sqlalchemy import text
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import CheckConstraint

# === DATABASE SETUP ===
DATABASE_URL = "mysql+pymysql://root:Tmdrnjs159!@localhost/emr_db"
engine = create_engine(DATABASE_URL)
Base = declarative_base()

def get_db():
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()

# # EMR 기록 모델
# class EMR(Base):
#     __tablename__ = 'emrs'
#     id = Columns(Integer, primary_key=True, index=True)
#     name = Column(String(100), nullable=False)
#     birth_date = Column(Date, nullable=False)
#     visit_date = Column(Date, nullable=False)
#     symptoms = Column(Text, nullable=False)
#     treatment = Column(Text, nullable=False)

# # 환자 접수표 모델
# class Registration(Base):
#     __tablename__ = 'registrations'
#     id = Column(Integer, primary_key=True, index=True)
#     patient_name = Column(String(100), nullable=False)
#     status = Column(String(100), nullable=False)


class New_patient(Base):
    __tablename__ = 'newpatients'
    patient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)


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


# 모든 테이블 생성
Base.metadata.create_all(bind=engine)

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
        return templates.TemplateResponse("dashboard.html", {"request": request})
    else:
        return templates.TemplateResponse("login.html", {"request": request, "error": "아이디 또는 비밀번호가 올바르지 않습니다."})

# # === 2. 대시보드 (환자 검색 및 이동) ===
# === 2. 대시보드 (환자 검색 및 이동) ===
# @app.get("/dashboard")
# def dashboard(newname: str = None, db: Session = Depends(get_db)):
#     if newname:
#         patient = db.query(New_patient).filter(New_patient.name == newname).first()
#         if patient is None:
#             result = f"{newname}(000000)"

#         else:
#             result = f"{patient.name}"
#         return {"result": result}
#     else:
#         return {"message": "No 'newname' query parameter provided."}


# # # === 3. 환자 개별 페이지 (환자 방문 기록 및 진료 입력) ===
# @app.get("/patient_detail", response_class=HTMLResponse)
# async def patient_detail(
#     request: Request, 
#     name: str, 
#     birth_date: str, 
#     db: Session = Depends(get_db)
# ):
#     try:
#         birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()
#     except ValueError:
#         raise HTTPException(status_code=400, detail="잘못된 생년월일 형식입니다.")

#     visit_records = (
#         db.query(EMR.visit_date)
#         .filter(EMR.name == name, EMR.birth_date == birth_date_obj)
#         .order_by(EMR.visit_date.desc())
#         .all()
#     )

#     latest_record = (
#         db.query(EMR)
#         .filter(EMR.name == name, EMR.birth_date == birth_date_obj)
#         .order_by(EMR.visit_date.desc())
#         .first()
#     )

#     # 🔹 초진차트가 없는 경우 #2-1 환자 초진차트로 이동
#     if not latest_record:
#         return RedirectResponse(url=f"/new_patient_chart?name={name}&birth_date={birth_date}", status_code=302)

#     return templates.TemplateResponse("patient_detail.html", {
#         "request": request,
#         "name": name,
#         "birth_date": birth_date,
#         "visit_records": visit_records,
#         "latest_record": latest_record
#     })

# @app.post("/patient_detail/new_emr")
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
#         return RedirectResponse(url=f"/patient_detail?name={name}&birth_date={birth_date}&error=날짜 오류", status_code=302)

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
