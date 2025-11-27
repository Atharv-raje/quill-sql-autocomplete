from typing import List, Optional, Union

from pydantic import BaseModel


class Message(BaseModel):
    id: Optional[str] = None
    role: str
    content: Union[str, List[dict]]
    name: Optional[str] = None


class QueryOption(BaseModel):
    completion: str
    sqlQuery: str


class AutocompleteRequest(BaseModel):
    userInput: str
    conversationHistory: List[Message]
    schemaDescription: str


class AutocompleteResponse(BaseModel):
    options: List[QueryOption]
