from enum import Enum


class UserRole(str, Enum):
    STARTUP = "STARTUP"
    FREELANCER = "FREELANCER"
    ADMIN = "ADMIN"


class IdeaStatus(str, Enum):
    DRAFT = "DRAFT"
    REFINED = "REFINED"
    APPROVED = "APPROVED"
    ANALYZED = "ANALYZED"
    COMPLETED = "COMPLETED"


class OutreachType(str, Enum):
    OWNER = "OWNER"
    CONTRIBUTOR = "CONTRIBUTOR"

class FindingType(str, Enum):
    ISSUE = "ISSUE"
    FEATURE = "FEATURE"
    AI_TASK = "AI_TASK"
    HUMAN_TASK = "HUMAN_TASK"
    RISK = "RISK"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ResponseStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"