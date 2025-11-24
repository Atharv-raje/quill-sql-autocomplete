from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import AutocompleteRequest, AutocompleteResponse
from autocomplete import autocomplete as autocomplete_service

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete_endpoint(request: AutocompleteRequest):
    return await autocomplete_service(request)
