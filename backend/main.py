from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import numpy as np
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
#Download NLTK data files needed for tokenizing and cleaning text
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("punkt_tab", quiet=True)

app=FastAPI(title="3D Word Cloud API", version="1.0.0")
#Allow the frontend running on localhost to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#defines what request body should look like when frontend sends a URL
class AnalyzeRequest(BaseModel):
    url:str

def fetch_article(url:str) -> tuple[str,str]:
    """Fetch and clean article text from URL."""
    #Pretend to be a real browser so websites don't block the request
    headers={
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    #Fetch the page HTML from the given URL
    try:
        with httpx.Client(timeout=15,follow_redirects=True) as client:
            response=client.get(url,headers=headers)
            response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400,detail=f"Failed to fetch URL: {str(e)}")
    # Parse the raw HTML so we can navigate and extract parts of it
    soup=BeautifulSoup(response.text,"html.parser")
    # Extracting the title
    title=""
    if soup.title:
        title=soup.title.get_text(strip=True)
    elif soup.find("h1"):
        title=soup.find("h1").get_text(strip=True)
    # Removing unwanted elements
    for tag in soup(["script","style","nav","footer","header","aside","iframe","noscript"]):
        tag.decompose()
    # Trying to find main content areas
    content_selectors=["article","main",'[role="main"]',".article-body",".post-content",".entry-content",".content"]
    text=""
    for selector in content_selectors:
        element=soup.select_one(selector)
        if element:
            text=element.get_text(separator=" ",strip=True)
            break
    # If none of the above worked, fall back to grabbing all paragraph tags
    if not text:
        paragraphs=soup.find_all("p")
        text=" ".join(p.get_text(strip=True) for p in paragraphs)
    # Last resort - just get all visible text on the page
    if not text:
        text=soup.get_text(separator=" ",strip=True)
    # Clean up extra whitespace
    text=re.sub(r"\s+", " ", text).strip()
    # If we still don't have enough text, the page probably blocked us or has no content
    if len(text)<100:
        raise HTTPException(status_code=422,detail="Could not extract meaningful text from this URL.")
    return text,title

def preprocess_text(text:str) -> list[str]:
    """Tokenize, remove stopwords, and lemmatize."""
    # Start with common English words to ignore like "the", "is", "and"
    stop_words=set(stopwords.words("english"))
    # Add more words that appear a lot in news articles but don't carry meaning
    stop_words.update(["said","also","would","could","one","two","three","like","get","make","may","year","time","new","us","use","used","using","says","say","told","according"])
    lemmatizer=WordNetLemmatizer()
    # Split the text into individual words and make everything lowercase
    tokens=word_tokenize(text.lower())
    # Keep only real words that are meaningful — no numbers, punctuation, or stop words. Also reduce each word to its base form like "crashes" becomes "crash"
    cleaned=[lemmatizer.lemmatize(t) for t in tokens if t.isalpha() and len(t) > 3 and t not in stop_words]
    return cleaned

def extract_tfidf_keywords(tokens:list[str]) -> list[tuple[str,float]]:
    """Score words using TF-IDF and return top keywords with weights."""
    #Join tokens back into a single string because TfidfVectorizer expects text not a list
    processed_text=" ".join(tokens)
    # TF-IDF gives higher scores to words that appear often in this article but are not common in general writing, these are the meaningful keywords
    vectorizer=TfidfVectorizer(
        # only consider top 200 words
        max_features=200,
        # consider single words and two word phrases
        ngram_range=(1, 2),
        min_df=1,
        # ignore words that appear in almost every sentence
        max_df=1,
    )
    # Fit and transform our text into a matrix of TF-IDF scores
    tfidf_matrix=vectorizer.fit_transform([processed_text])
    feature_names=vectorizer.get_feature_names_out()
    tfidf_scores=tfidf_matrix.toarray()[0]
    # Sort words by their score and take the top 80
    top_indices=np.argsort(tfidf_scores)[::-1][:80]
    top_words=[(feature_names[i], float(tfidf_scores[i])) for i in top_indices if tfidf_scores[i]>0]
    return top_words

def assign_topics(tokens:list[str], top_words:list[tuple[str,float]]) -> tuple[dict[str,int],list[list[str]]]:
    """Use LDA to group words into topics and return topic assignment per word."""
    # Split tokens into sentences so LDA has multiple documents to work with. LDA needs more than one document to find patterns across them
    chunk_size=20
    chunks=[" ".join(tokens[i: i + chunk_size]) for i in range(0, len(tokens), chunk_size)]
    # There should be at least a few chunks for LDA to work properly
    if len(chunks)<3:
        # Not enough text — assign all words to topic 0
        return {word: 0 for word, _ in top_words}, [[]]
    # Decide how many topics to look for based on how much text we have
    num_topics=min(5,max(2,len(chunks)//3))
    # Vectorize the chunks using the same vocabulary as our top words
    vocab=[word for word, _ in top_words]
    sent_vectorizer=TfidfVectorizer(vocabulary=vocab)
    chunk_matrix=sent_vectorizer.fit_transform(chunks)
    # Run LDA, it will try to find num_topics hidden themes in the text
    lda=LatentDirichletAllocation(
        n_components=num_topics,
        # fixed seed so results are consistent
        random_state=42,    
        max_iter=20,
    )
    lda.fit(chunk_matrix)
    # For each topic, find the top 6 words that represent it
    feature_names=sent_vectorizer.get_feature_names_out()
    topic_top_words=[]
    for component in lda.components_:
        top_indices=np.argsort(component)[::-1][:6]
        topic_top_words.append([feature_names[i] for i in top_indices])
    # Assign each keyword to the topic where it scored highest
    topic_assignments={}
    for word,_ in top_words:
        if word in feature_names:
            word_idx=list(feature_names).index(word)
            # Find which topic has the highest score for this word
            best_topic=int(np.argmax([comp[word_idx] for comp in lda.components_]))
            topic_assignments[word]=best_topic
        else:
            topic_assignments[word]=0
    return topic_assignments,topic_top_words

def normalize_weights(top_words:list[tuple[str,float]]) -> dict[str,float]:
    """Scale all weights to a range between 0.1 and 1.0."""
    if not top_words:
        return {}
    max_w=max(w for _, w in top_words)
    min_w=min(w for _, w in top_words)
    w_range=max_w - min_w if max_w != min_w else 1
    return {
        word: round(0.1 + 0.9*(score-min_w)/w_range,4)
        for word,score in top_words
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(request:AnalyzeRequest):
    # Basic check before doing any work
    if not request.url.startswith(("http://","https://")):
        raise HTTPException(status_code=400,detail="URL must start with http:// or https://")
    # Fetch the article and extract raw text
    text,title=fetch_article(request.url)
    # Clean and normalize the text
    tokens=preprocess_text(text)
    # Score each word using TF-IDF
    top_words=extract_tfidf_keywords(tokens)
    # Normalize weights to 0.1 - 1.0 range for the frontend
    normalized=normalize_weights(top_words)
    # Assign each word to a topic using LDA
    topic_assignments,topic_top_words=assign_topics(tokens,top_words)
    # Build the final word list combining weight and topic for each word
    words=[{"word":word,"weight":normalized[word],"topic":topic_assignments.get(word,0)} for word,_ in top_words]
    return {
        "article_title": title,
        "words": words,
        "topics": topic_top_words
    }