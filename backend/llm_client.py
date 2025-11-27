import os
import json
from typing import List

from dotenv import load_dotenv
from groq import Groq

from models import AutocompleteRequest, QueryOption, Message

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is not set")

client = Groq(api_key=api_key)


def _flatten_message_content(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            t = part.get("type")
            if t == "text" and "text" in part:
                parts.append(part["text"])
        return "\n".join(parts)
    return ""


def _build_messages(req: AutocompleteRequest) -> list[dict]:
    system_content = (
        "You are an autocomplete engine for natural-language analytics questions over SQL data.\n"
        "The user is typing a question in English about data in a SQL database.\n"
        "Your job is to AUTOCOMPLETE the unfinished question and also provide a SQL query for each completed question.\n\n"
        "Requirements:\n"
        "- You receive a partially typed user question (not a full sentence).\n"
        "- You must return 2–3 completions that extend this text, as if you were an autocomplete system.\n"
        "- Each completion must be a full, natural-language question that starts with the original user input and continues it.\n"
        "- For each completion, also produce a matching SQL query that uses the provided schema.\n\n"
        "Output JSON format:\n"
        "{\n"
        '  \"options\": [\n'
        '    { \"completion\": \"full natural language question\", \"sqlQuery\": \"SELECT ...\" },\n'
        "    ...\n"
        "  ]\n"
        "}\n\n"
        "Do not include any other top-level fields. Do not add explanations. Only return JSON."
    )

    messages: list[dict] = [
        {"role": "system", "content": system_content}
    ]

    for m in req.conversationHistory:
        content_text = _flatten_message_content(m.content)
        if not content_text:
            continue
        role = m.role
        if role not in ("system", "user", "assistant"):
            role = "user"
        messages.append({"role": role, "content": content_text})

    user_content = (
        "Here is the database schema:\n"
        f"{req.schemaDescription}\n\n"
        "Here is the partially typed user question (autocomplete this):\n"
        f"{req.userInput}\n\n"
        "Now return the JSON object as specified."
    )

    messages.append({"role": "user", "content": user_content})
    return messages


async def generate_query_options(req: AutocompleteRequest) -> List[QueryOption]:
    messages = _build_messages(req)
    try:
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
        )
    except Exception as e:
        print("Error calling LLM:", repr(e))
        return []

    content = chat_completion.choices[0].message.content

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        print("Could not parse JSON from LLM:", content)
        return []

    raw_options = data.get("options", [])
    options: List[QueryOption] = []

    for item in raw_options:
        if not isinstance(item, dict):
            continue
        completion = item.get("completion") or item.get("completed") or item.get("text")
        sql = item.get("sqlQuery") or item.get("sql_query") or item.get("sql")
        if completion and sql:
            options.append(QueryOption(completion=completion, sqlQuery=sql))

    return options
