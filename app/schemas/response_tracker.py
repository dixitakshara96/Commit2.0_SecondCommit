from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResponseTrackerCreate(BaseModel):
    """Payload to create a new response tracking entry when outreach is sent."""
    analysis_id: int = Field(
        description="ID of the analysis the outreach belongs to.",
    )
    contributor_match_id: int | None = Field(
        default=None,
        description="ID of the contributor match record (if applicable).",
    )
    outreach_message_id: int | None = Field(
        default=None,
        description="ID of the outreach message that was sent.",
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional notes about the outreach.",
    )


class ResponseTrackerUpdate(BaseModel):
    """Payload to update the status of a tracking entry."""
    status: str = Field(
        description="New status: 'accepted' or 'declined'.",
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional notes about the response.",
    )


class ResponseTrackerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    contributor_match_id: int | None
    outreach_message_id: int | None
    status: str
    responded_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ResponseTrackerSummary(BaseModel):
    """Aggregated response stats for a given analysis."""
    total_sent: int = Field(description="Total number of outreach entries tracked.")
    pending_count: int = Field(description="Number of entries still in pending status.")
    accepted_count: int = Field(description="Number of entries marked as accepted.")
    declined_count: int = Field(description="Number of entries marked as declined.")
    response_rate: float = Field(
        description="Percentage of entries that received a response (accepted + declined).",
    )
    acceptance_rate: float = Field(
        description="Percentage of responded entries that were accepted.",
    )
