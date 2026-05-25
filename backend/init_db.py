from app.database import engine, Base
from app import models

Base.metadata.create_all(bind=engine)
print("数据库初始化完成")
