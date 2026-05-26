from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import OrderConfig, OrderTimeline
from app.schemas import OrderConfigCreate, OrderConfigUpdate, OrderConfigResponse

router = APIRouter()


def _add_timeline(db: Session, order_id: int, event_type: str, event_description: str, operator_name: str = "系统"):
    timeline = OrderTimeline(
        order_id=order_id,
        event_type=event_type,
        event_description=event_description,
        operator_name=operator_name,
    )
    db.add(timeline)


@router.get("/{order_id}/configs", response_model=list[OrderConfigResponse])
def list_configs(order_id: int, db: Session = Depends(get_db)):
    configs = db.query(OrderConfig).filter(OrderConfig.order_id == order_id).all()
    return [OrderConfigResponse.model_validate(c) for c in configs]


@router.post("/{order_id}/configs", response_model=OrderConfigResponse)
def create_config(order_id: int, config_data: OrderConfigCreate, db: Session = Depends(get_db)):
    config = OrderConfig(
        order_id=order_id,
        item_id=config_data.item_id,
        config_type=config_data.config_type,
        config_key=config_data.config_key,
        config_value=config_data.config_value,
        config_description=config_data.config_description,
        confirmed=False,
    )
    db.add(config)
    db.flush()
    _add_timeline(db, order_id, "config_added", f"添加配置：{config.config_type}-{config.config_key}={config.config_value}")
    db.commit()
    db.refresh(config)
    return OrderConfigResponse.model_validate(config)


@router.put("/{order_id}/configs/{config_id}", response_model=OrderConfigResponse)
def update_config(order_id: int, config_id: int, update_data: OrderConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(OrderConfig).filter(OrderConfig.id == config_id, OrderConfig.order_id == order_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    was_confirmed = config.confirmed
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(config, field, value)
    if update_data.confirmed and not was_confirmed:
        config.confirmed_at = datetime.now()
        _add_timeline(db, order_id, "config_confirmed", f"配置已确认：{config.config_type}-{config.config_key}={config.config_value}")
    db.commit()
    db.refresh(config)
    return OrderConfigResponse.model_validate(config)


@router.delete("/{order_id}/configs/{config_id}")
def delete_config(order_id: int, config_id: int, db: Session = Depends(get_db)):
    config = db.query(OrderConfig).filter(OrderConfig.id == config_id, OrderConfig.order_id == order_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    db.delete(config)
    db.commit()
    return {"message": "配置已删除"}