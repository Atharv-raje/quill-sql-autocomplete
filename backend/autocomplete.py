from models import AutocompleteRequest, AutocompleteResponse
from llm_client import generate_query_options


async def autocomplete(request: AutocompleteRequest) -> AutocompleteResponse:
    options = await generate_query_options(request)
    return AutocompleteResponse(options=options)
