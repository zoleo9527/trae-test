from __future__ import annotations
import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def check_and_migrate_idempotency_keys(engine: Engine) -> None:
    """
    迁移 idempotency_keys 表的唯一约束：
    从单字段 (idempotency_key) 改为组合字段 (idempotency_key, entity_type, operator_id)

    SQLite 不支持直接 ALTER TABLE 修改唯一约束，因此需要：
    1. 检查表是否存在
    2. 检查是否有基于单字段 idempotency_key 的唯一索引（旧约束）
    3. 如果存在，创建新表 -> 复制数据 -> 删除旧表 -> 重命名新表
    """
    with engine.connect() as conn:
        table_exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='idempotency_keys'"
        )).scalar()

        if not table_exists:
            logger.info("idempotency_keys 表不存在，跳过迁移（将由 create_all 创建）")
            return

        indexes = conn.execute(text(
            "SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='idempotency_keys'"
        )).fetchall()

        has_old_single_constraint = False
        for idx_name, idx_sql in indexes:
            if idx_sql and "idempotency_key" in idx_sql and "entity_type" not in idx_sql and "operator_id" not in idx_sql:
                has_old_single_constraint = True
                logger.info(f"检测到旧版唯一约束索引: {idx_name}")
                break

        if not has_old_single_constraint:
            logger.info("idempotency_keys 表已有正确约束，跳过迁移")
            return

        logger.info("检测到旧版 idempotency_keys 表，开始迁移...")

        old_count = conn.execute(text("SELECT COUNT(*) FROM idempotency_keys")).scalar()
        logger.info(f"旧表包含 {old_count} 条幂等记录")

        conn.execute(text("ALTER TABLE idempotency_keys RENAME TO idempotency_keys_old"))

        conn.execute(text("""
            CREATE TABLE idempotency_keys (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                idempotency_key VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                result_data TEXT,
                operator_id VARCHAR(50) NOT NULL,
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                CONSTRAINT uq_idempotency_domain UNIQUE (idempotency_key, entity_type, operator_id)
            )
        """))

        conn.execute(text("""
            INSERT INTO idempotency_keys (
                id, idempotency_key, entity_type, entity_id,
                result_data, operator_id, created_at, expires_at
            )
            SELECT
                id, idempotency_key, entity_type, entity_id,
                result_data, operator_id, created_at, expires_at
            FROM idempotency_keys_old
        """))

        conn.execute(text("DROP TABLE idempotency_keys_old"))

        conn.commit()

        new_count = conn.execute(text("SELECT COUNT(*) FROM idempotency_keys")).scalar()
        logger.info(f"迁移完成: {old_count} 条记录已迁移到新表，新表共 {new_count} 条记录")


def run_all_migrations(engine: Engine) -> None:
    """运行所有数据库迁移"""
    check_and_migrate_idempotency_keys(engine)
    logger.info("所有数据库迁移完成")
