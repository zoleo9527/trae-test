from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import date, datetime

models.Base.metadata.create_all(bind=engine)


def seed_data():
    db = SessionLocal()
    
    try:
        users = [
            models.User(username="admin", password="admin123", role="admin", name="系统管理员", department="技术部"),
            models.User(username="channel_mgr", password="123456", role="channel_manager", name="张经理", department="渠道部"),
            models.User(username="dist_specialist", password="123456", role="distribution_specialist", name="李专员", department="发行部"),
            models.User(username="finance", password="123456", role="finance", name="王会计", department="财务部"),
        ]
        for user in users:
            if not db.query(models.User).filter(models.User.username == user.username).first():
                db.add(user)
        db.commit()
        
        books = [
            models.Book(isbn="9787010000001", title="Python编程从入门到实践", author="Eric Matthes", publisher="人民邮电出版社", publish_date=date(2023, 1, 15), price=89.00, category="计算机"),
            models.Book(isbn="9787010000002", title="深度学习", author="Ian Goodfellow", publisher="机械工业出版社", publish_date=date(2023, 3, 20), price=168.00, category="计算机"),
            models.Book(isbn="9787010000003", title="人类简史", author="尤瓦尔·赫拉利", publisher="中信出版社", publish_date=date(2023, 5, 10), price=68.00, category="历史"),
            models.Book(isbn="9787010000004", title="活着", author="余华", publisher="作家出版社", publish_date=date(2023, 2, 28), price=39.00, category="文学"),
            models.Book(isbn="9787010000005", title="三体", author="刘慈欣", publisher="重庆出版社", publish_date=date(2023, 4, 15), price=93.00, category="科幻"),
        ]
        for book in books:
            if not db.query(models.Book).filter(models.Book.isbn == book.isbn).first():
                db.add(book)
        db.commit()
        
        channels = [
            models.Channel(name="当当网", type="电商平台", contact_person="陈总", phone="13800138001", address="北京市朝阳区xxx大厦", payment_terms="月结30天", credit_limit=500000),
            models.Channel(name="京东图书", type="电商平台", contact_person="刘经理", phone="13800138002", address="北京市海淀区xxx园区", payment_terms="月结45天", credit_limit=800000),
            models.Channel(name="天猫图书旗舰店", type="电商平台", contact_person="王店长", phone="13800138003", address="杭州市余杭区xxx", payment_terms="月结30天", credit_limit=300000),
            models.Channel(name="新华书店总店", type="线下渠道", contact_person="赵主任", phone="13800138004", address="北京市西城区xxx", payment_terms="月结60天", credit_limit=1000000),
            models.Channel(name="西西弗书店", type="线下渠道", contact_person="孙总", phone="13800138005", address="重庆市渝中区xxx", payment_terms="月结45天", credit_limit=200000),
        ]
        for channel in channels:
            if not db.query(models.Channel).filter(models.Channel.name == channel.name).first():
                db.add(channel)
        db.commit()
        
        channel_mgr = db.query(models.User).filter(models.User.username == "channel_mgr").first()
        dist_specialist = db.query(models.User).filter(models.User.username == "dist_specialist").first()
        
        distributions_data = [
            {"distribution_no": "PU202405010001", "book_id": 1, "channel_id": 1, "quantity": 500, "sample_quantity": 10, "distribution_date": date(2024, 5, 1), "status": "completed", "receipt_status": "confirmed", "receipt_date": date(2024, 5, 3), "tracking_no": "SF1234567890", "courier_company": "顺丰速运", "handler_id": dist_specialist.id if dist_specialist else 1, "channel_manager_id": channel_mgr.id if channel_mgr else 1, "remarks": "首发铺货"},
            {"distribution_no": "PU202405050001", "book_id": 2, "channel_id": 2, "quantity": 300, "sample_quantity": 5, "distribution_date": date(2024, 5, 5), "status": "shipped", "receipt_status": "pending", "tracking_no": "JD9876543210", "courier_company": "京东物流", "handler_id": dist_specialist.id if dist_specialist else 1, "channel_manager_id": channel_mgr.id if channel_mgr else 1, "remarks": "样书回执未确认，需跟进"},
            {"distribution_no": "PU202405100001", "book_id": 3, "channel_id": 4, "quantity": 1000, "sample_quantity": 20, "distribution_date": date(2024, 5, 10), "status": "returned", "receipt_status": "confirmed", "receipt_date": date(2024, 5, 12), "tracking_no": "YT1122334455", "courier_company": "圆通速递", "handler_id": dist_specialist.id if dist_specialist else 1, "channel_manager_id": channel_mgr.id if channel_mgr else 1, "remarks": "部分滞销退货"},
            {"distribution_no": "PU202405150001", "book_id": 4, "channel_id": 3, "quantity": 200, "sample_quantity": 3, "distribution_date": date(2024, 5, 15), "status": "completed", "receipt_status": "confirmed", "receipt_date": date(2024, 5, 17), "tracking_no": "ZT5566778899", "courier_company": "中通快递", "handler_id": dist_specialist.id if dist_specialist else 1, "channel_manager_id": channel_mgr.id if channel_mgr else 1, "remarks": ""},
            {"distribution_no": "PU202405200001", "book_id": 5, "channel_id": 5, "quantity": 150, "sample_quantity": 5, "distribution_date": date(2024, 5, 20), "status": "shipped", "receipt_status": "lost", "tracking_no": "EMS0011223344", "courier_company": "EMS", "handler_id": dist_specialist.id if dist_specialist else 1, "channel_manager_id": channel_mgr.id if channel_mgr else 1, "remarks": "样书回执丢失，需处理"},
        ]
        
        for dist_data in distributions_data:
            if not db.query(models.Distribution).filter(models.Distribution.distribution_no == dist_data["distribution_no"]).first():
                dist = models.Distribution(**dist_data)
                db.add(dist)
        db.commit()
        
        returns_data = [
            {"return_no": "RT202405200001", "distribution_id": 3, "quantity": 150, "return_date": date(2024, 5, 20), "return_reason": "销量不及预期，滞销退货", "return_type": "normal", "status": "pending", "receive_status": "pending", "handler_id": dist_specialist.id if dist_specialist else 1, "remarks": ""},
            {"return_no": "RT202405220001", "distribution_id": 1, "quantity": 50, "return_date": date(2024, 5, 22), "return_reason": "包装破损，客户拒收", "return_type": "damaged", "status": "completed", "receive_status": "confirmed", "receive_date": date(2024, 5, 25), "handler_id": dist_specialist.id if dist_specialist else 1, "quantity_discrepancy": True, "discrepancy_note": "渠道退回50册，但实际只收到45册，存在5册差异", "remarks": "退货数量存在差异，需核对"},
        ]
        
        for return_data in returns_data:
            if not db.query(models.Return).filter(models.Return.return_no == return_data["return_no"]).first():
                ret = models.Return(**return_data)
                db.add(ret)
        db.commit()
        
        payments_data = [
            {"payment_no": "PY202405250001", "distribution_id": 1, "channel_id": 1, "amount": 35600.00, "payment_date": date(2024, 5, 25), "payment_method": "银行转账", "status": "pending", "remarks": "当当网5月货款"},
            {"payment_no": "PY202405260001", "distribution_id": 4, "channel_id": 3, "amount": 6630.00, "payment_date": date(2024, 5, 26), "payment_method": "支付宝", "status": "confirmed", "finance_confirm_id": 4, "finance_confirm_date": date(2024, 5, 27), "remarks": "天猫旗舰店回款已确认"},
        ]
        
        for pay_data in payments_data:
            if not db.query(models.Payment).filter(models.Payment.payment_no == pay_data["payment_no"]).first():
                pay = models.Payment(**pay_data)
                db.add(pay)
        db.commit()
        
        exceptions_data = [
            {"related_type": "distribution", "related_id": 5, "exception_type": "receipt_lost", "description": "样书快递回执丢失，渠道未确认收货，无法进入下一环节", "status": "open", "handler_id": channel_mgr.id if channel_mgr else 1},
            {"related_type": "return", "related_id": 2, "exception_type": "quantity_discrepancy", "description": "退货数量与渠道反馈不一致，渠道报50册，实收45册，差异5册待核实", "status": "open", "handler_id": dist_specialist.id if dist_specialist else 1},
            {"related_type": "payment", "related_id": 1, "exception_type": "payment_mismatch", "description": "回款金额与应结金额存在差异，应结44500元，实到35600元", "status": "open", "handler_id": 4},
        ]
        
        for exc_data in exceptions_data:
            exc = models.ExceptionRecord(**exc_data, created_at=datetime.now())
            db.add(exc)
        db.commit()
        
        feedbacks_data = [
            {"distribution_id": 1, "feedback_type": "sales", "feedback_date": date(2024, 5, 15), "sales_quantity": 200, "feedback_content": "销售情况良好，预计两周内可完成首批销售", "feedback_by": "陈总"},
            {"distribution_id": 1, "feedback_type": "reorder", "feedback_date": date(2024, 5, 20), "sales_quantity": 0, "feedback_content": "申请补货300册", "feedback_by": "陈总"},
        ]
        
        for fb_data in feedbacks_data:
            fb = models.ChannelFeedback(**fb_data)
            db.add(fb)
        db.commit()
        
        print("演示数据已成功填充！")
        
    except Exception as e:
        print(f"填充数据时出错: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
