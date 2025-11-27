from typing import List

from models import AutocompleteRequest, QueryOption
from llm_client import generate_query_options


async def autocomplete(request: AutocompleteRequest) -> List[QueryOption]:
    options = await generate_query_options(request)
    return options
