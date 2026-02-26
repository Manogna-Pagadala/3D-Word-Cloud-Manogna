from fastapi import FastAPI

app = FastAPI(title="3D Word Cloud API", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}