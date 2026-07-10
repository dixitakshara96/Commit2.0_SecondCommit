from enum import Enum


class UserRole(str, Enum):
    STARTUP = "startup"
    FREELANCER = "freelancer"
    ADMIN = "admin"


class IdeaStatus(str, Enum):
    DRAFT = "draft"
    REFINED = "refined"
    APPROVED = "approved"
    ANALYZED = "analyzed"
    COMPLETED = "completed"


class OutreachType(str, Enum):
    OWNER = "owner"
    CONTRIBUTOR = "contributor"

class FindingType(str, Enum):
    ISSUE = "issue"
    FEATURE = "feature"
    AI_TASK = "ai_task"
    HUMAN_TASK = "human_task"
    RISK = "risk"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ResponseStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"