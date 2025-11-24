from typing import List, Optional, Union, Any
from datetime import datetime

from pydantic import BaseModel
from typing import Literal


class ContentPart(BaseModel):
    type: Literal["text", "image", "input_text", "input_file"]
    text: Optional[str] = None
    data: Optional[Any] = None
    mimeType: Optional[str] = None


class Message(BaseModel):
    id: Optional[str] = None
    role: Literal["system", "user", "assistant", "tool"]
    content: Union[str, List[ContentPart]]
    name: Optional[str] = None
    createdAt: Optional[datetime] = None


class AutocompleteRequest(BaseModel):
    userInput: str
    conversationHistory: List[Message] = []
    schemaDescription: str


class QueryOption(BaseModel):
    description: str
    sqlQuery: str


class AutocompleteResponse(BaseModel):
    options: List[QueryOption]
