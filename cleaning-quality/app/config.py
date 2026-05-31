import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cleaning_quality.db")

API_PREFIX = "/api/v1"

PROJECT_ROLES = ["project_manager", "schedule_staff", "inspector", "admin"]

INSPECTION_STATUSES = ["pending", "in_progress", "completed", "skipped"]

RECTIFICATION_STATUSES = [
    "pending",
    "assigned",
    "in_progress",
    "submitted",
    "rejected",
    "approved",
    "overdue",
]

CONSUMABLE_STATUSES = ["normal", "low", "reorder", "critical"]

CONTRACT_STATUSES = ["active", "renewal_pending", "renewing", "expired", "terminated"]
