from __future__ import annotations
import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def _get_unique_index_columns(engine: Engine, table_name: str) -> dict:
    """
    获取表的所有唯一索引及其列名。
    返回格式: {index_name: [column_names]}
    """
    indexes = {}
    with engine.connect() as conn:
        result = conn.execute(text(f"PRAGMA index_list('{table_name}')"))
        for row in result.fetchall():
            idx_name = row[1]
            is_unique = row[2] == 1
            if not is_unique:
                continue
            cols_result = conn.execute(text(f"PRAGMA index_info('{idx_name}')"))
            columns = [col_row[2] for col_row in cols_result.fetchall()]
            indexes[idx_name] = columns
    return indexes


def check_and_migrate_idempotency_keys(engine: Engine) -> None:
    """
    迁移 idempotency_keys 表的唯一约束：
    从单字段 (idempotency_key) 改为组合字段 (idempotency_key, entity_type, operator_id)

    SQLite 会为 UNIQUE 约束自动创建索引（命名如 sqlite_autoindex_idempotency_keys_1），
    且在 sqlite_master 中的 sql 字段为 NULL，因此使用 PRAGMA index_list/index_info
    来可靠检测索引列。
    """
    with engine.connect() as conn:
        table_exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='idempotency_keys'"
        )).scalar()

        if not table_exists:
            logger.info("idempotency_keys 表不存在，跳过迁移（将由 create_all 创建）")
            return

        unique_indexes = _get_unique_index_columns(engine, 'idempotency_keys')

        has_old_single_constraint = False
        has_new_composite_constraint = False

        for idx_name, columns in unique_indexes.items():
            cols_set = set(columns)
            if cols_set == {'idempotency_key'}:
                has_old_single_constraint = True
                logger.info(f"检测到旧版单字段唯一约束: {idx_name} (columns: {columns})")
            elif cols_set == {'idempotency_key', 'entity_type', 'operator_id'}:
                has_new_composite_constraint = True
                logger.info(f"检测到新版组合唯一约束: {idx_name} (columns: {columns})")

        if has_new_composite_constraint:
            logger.info("idempotency_keys 表已有正确的组合唯一约束，跳过迁移")
            return

        if not has_old_single_constraint:
            logger.info("未检测到旧版单字段约束，跳过迁移")
            return

        logger.info("检测到旧版单字段唯一约束，开始迁移到组合唯一约束...")

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

        new_indexes = _get_unique_index_columns(engine, 'idempotency_keys')
        logger.info(f"迁移后唯一索引: {new_indexes}")

        logger.info(f"迁移完成: {old_count} 条记录已迁移到新表，新表共 {new_count} 条记录")


def run_all_migrations(engine: Engine) -> None:
    """运行所有数据库迁移"""
    check_and_migrate_idempotency_keys(engine)
    logger.info("所有数据库迁移完成")
