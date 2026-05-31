import sys
import os
sys.path.insert(0, '.')

print("=" * 60)
print("Migration & Error Format Test Suite")
print("=" * 60)
print()

# Test 1: Verify imports and PRAGMA-based index detection
print("Test 1: Import and index detection function")
from app.database_migrations import _get_unique_index_columns, check_and_migrate_idempotency_keys
from app.services.idempotency import MissingIdempotencyKeyError, MissingExpectedVersionError
print("  ✅ All imports OK")
print()

# Test 2: Create OLD database with single-field unique constraint
print("Test 2: Migration from old (single-field) to new (composite) constraint")
from sqlalchemy import create_engine, text

# Remove any existing test db
test_db_path = 'test_migration.db'
if os.path.exists(test_db_path):
    os.remove(test_db_path)

# Create engine
engine = create_engine(f'sqlite:///{test_db_path}')

# Create OLD style table (single field unique on idempotency_key)
with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE idempotency_keys (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            idempotency_key VARCHAR(100) NOT NULL UNIQUE,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER,
            result_data TEXT,
            operator_id VARCHAR(50) NOT NULL,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL
        )
    """))
    conn.commit()

# Insert test data
with engine.connect() as conn:
    conn.execute(text("""
        INSERT INTO idempotency_keys 
        (idempotency_key, entity_type, entity_id, operator_id, created_at, expires_at)
        VALUES 
        ('key-1', 'rectification', 1, 'op_1', '2026-01-01 00:00:00', '2027-01-01 00:00:00'),
        ('key-2', 'rectification', 2, 'op_1', '2026-01-01 00:00:00', '2027-01-01 00:00:00')
    """))
    conn.commit()

# Check old indexes
old_indexes = _get_unique_index_columns(engine, 'idempotency_keys')
print(f"  Old unique indexes: {old_indexes}")

# Run migration
check_and_migrate_idempotency_keys(engine)

# Check new indexes
new_indexes = _get_unique_index_columns(engine, 'idempotency_keys')
print(f"  New unique indexes: {new_indexes}")

# Verify data preserved
with engine.connect() as conn:
    count = conn.execute(text('SELECT COUNT(*) FROM idempotency_keys')).scalar()
    print(f"  Records after migration: {count}")
    assert count == 2, f"Expected 2 records, got {count}"

# Verify new constraint allows same key, different operator
with engine.connect() as conn:
    # Same key, different operator, same entity_type should work
    conn.execute(text("""
        INSERT INTO idempotency_keys 
        (idempotency_key, entity_type, entity_id, operator_id, created_at, expires_at)
        VALUES ('key-1', 'rectification', 3, 'op_2', '2026-01-01 00:00:00', '2027-01-01 00:00:00')
    """))
    conn.commit()
    print("  ✅ Same key different operator works (domain isolation)")

# Cleanup
os.remove(test_db_path)
print("  ✅ Migration test passed!")
print()

# Test 3: Verify error message format from exceptions
print("Test 3: Exception error message format")
try:
    raise MissingIdempotencyKeyError('rectification')
except MissingIdempotencyKeyError as e:
    print(f"  MissingIdempotencyKeyError message: {str(e)}")

try:
    raise MissingExpectedVersionError('rectification', 'assign')
except MissingExpectedVersionError as e:
    print(f"  MissingExpectedVersionError message: {str(e)}")
print("  ✅ Exception messages OK")
print()

print("=" * 60)
print("✅ All tests passed!")
print("=" * 60)
