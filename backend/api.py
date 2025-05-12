from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import main_router

app = FastAPI()

origins = [
    "*", # this is only for development, PLEASE CHANGE THIS LATER
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Shoo away peasants, use the UI"}

@app.get("/debug")
async def debug():
    return {"message": "FastAPI is running, let's goooooo"}

app.include_router(main_router)