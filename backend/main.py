from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("punkt_tab", quiet=True)

app = FastAPI(title="3D Word Cloud API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str


def fetch_article(url: str) -> tuple[str, str]:
    """Fetch and clean article text from URL."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")

    soup = BeautifulSoup(response.text, "html.parser")

    # Extracting title
    title = ""
    if soup.title:
        title = soup.title.get_text(strip=True)
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    # Removing unwanted elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
        tag.decompose()

    # Trying to find main content areas
    content_selectors = ["article", "main", '[role="main"]', ".article-body", ".post-content", ".entry-content", ".content"]
    text = ""
    for selector in content_selectors:
        element = soup.select_one(selector)
        if element:
            text = element.get_text(separator=" ", strip=True)
            break

    if not text:
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text(strip=True) for p in paragraphs)

    if not text:
        text = soup.get_text(separator=" ", strip=True)

    text = re.sub(r"\s+", " ", text).strip()

    if len(text) < 100:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from this URL.")

    return text, title


def preprocess_text(text: str) -> list[str]:
    """Tokenize, remove stopwords, and lemmatize."""
    stop_words = set(stopwords.words("english"))
    stop_words.update(["said", "also", "would", "could", "one", "two", "three",
                        "like", "get", "make", "may", "year", "time", "new", "us",
                        "use", "used", "using", "says", "say", "told", "according"])
    lemmatizer = WordNetLemmatizer()

    tokens = word_tokenize(text.lower())
    cleaned = [
        lemmatizer.lemmatize(t)
        for t in tokens
        if t.isalpha() and len(t) > 3 and t not in stop_words
    ]
    return cleaned


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    if not request.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    text, title = fetch_article(request.url)

    tokens = preprocess_text(text)

    return {
        "article_title": title,
        "word_count": len(tokens),
        "sample_words": tokens[:20]
    }