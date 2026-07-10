from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class IdeaSubmit(BaseModel):
    """
    Submit a new idea as text or audio transcript.
    """
    original_prompt: str = Field(
        min_length=10,
        max_length=5000,
        description="The raw idea text submitted by the user.",
    )

    voice_transcript: str | None = Field(
        default=None,
        max_length=5000,
        description="Transcript from an audio recording, if submitted via voice.",
    )


class IdeaUpdate(BaseModel):
    """
    Update an existing idea. Both fields are optional.
    """
    original_prompt: str | None = Field(
        default=None,
        min_length=10,
        max_length=5000,
        description="Updated raw idea text.",
    )

    voice_transcript: str | None = Field(
        default=None,
        max_length=5000,
        description="Updated voice transcript.",
    )


class IdeaRefineResponse(BaseModel):
    """
    The LLM-refined version of the idea, presented for user approval.
    """
    refined_prompt: str = Field(
        description="The refined/clarified version of the idea.",
    )


class IdeaRead(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    owner_id: int

    original_prompt: str

    voice_transcript: str | None

    refined_prompt: str | None

    status: str

    created_at: datetime
