from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel

DATABASE_URL = "mysql+pymysql://root:Tmdrnjs159!@localhost/emr_db"
engine = create_engine(DATABASE_URL)
Base = declarative_base()

def get_db():
    db = Session(bind=engine)
    try:
        yield db
    finally:
        db.close()

app = FastAPI()

class New_patient(Base):
    __tablename__ = 'newpatients'
    patient_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

class UserCreate(BaseModel):
    name: str

Base.metadata.create_all(bind=engine)

@app.get("/dashboard")
def dashboard(newname: str = None, db: Session = Depends(get_db)):
    """
    쿼리 파라미터 'newname'을 받아서,
    newpatients 테이블에서 해당 이름이 존재하는지 확인하고 결과를 반환합니다.
    사용 예: /dashboard?newname=홍길동
    """
    if newname:
        patient = db.query(New_patient).filter(New_patient.name == newname).first()
        if patient is None:
            result = f"{newname}"
        else:
            result = f"{patient.name}(000000)"
        return {"result": result}
    else:
        # newname이 전달되지 않은 경우에 대한 처리(필요 시 수정)
        return {"message": "No 'newname' query parameter provided."}