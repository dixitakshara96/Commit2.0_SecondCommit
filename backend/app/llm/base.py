from abc import ABC, abstractmethod
from typing import Any


class BaseLLMProvider(ABC):
    """
    Base interface for every LLM provider.
    """

    @abstractmethod
    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        response_format: dict[str, Any] | None = None,
    ) -> str:
        """
        Generate a response from the model.
        """
        raise NotImplementedError