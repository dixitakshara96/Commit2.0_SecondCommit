from typing import Any

import httpx

from app.core.config import settings
from app.llm.base import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):

    def __init__(self) -> None:

        self.base_url = settings.OLLAMA_BASE_URL

        self.model = settings.OLLAMA_MODEL

        self.client = httpx.AsyncClient(
            timeout=180,
        )

    async def generate(
        self,
        *,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        response_format: dict[str, Any] | None = None,
    ) -> str:

        messages = []

        if system_prompt:

            messages.append(
                {
                    "role": "system",
                    "content": system_prompt,
                }
            )

        messages.append(
            {
                "role": "user",
                "content": prompt,
            }
        )

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }

        if response_format is not None:

            payload["format"] = response_format

        response = await self.client.post(
            f"{self.base_url}/api/chat",
            json=payload,
        )

        response.raise_for_status()

        data = response.json()

        return data["message"]["content"].strip()

    async def close(self):

        await self.client.aclose()