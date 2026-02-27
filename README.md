# 3D Word Cloud

Paste any news article URL (or use sample URLs that are already displayed) and watch it turn into an interactive 3D word cloud. The backend fetches the article, extracts the most important keywords using NLP, and the frontend displays them as a spinning 3D sphere you can rotate and zoom.

---

## Tech Stack

| Layer | Technology |
|----------|----------|
| Frontend | React 18 + TypeScript + Vite |
| 3D Rendering | React Three Fiber + Drei |
| Backend | Python + FastAPI |
| NLP | scikit-learn (TF-IDF + LDA), NLTK |
| HTTP Client | httpx |
| HTML Parsing | BeautifulSoup4 |

---

## Prerequisites

- **macOS**
- **Python 3.10+** — [python.org](https://python.org) or `brew install python`
- **Node.js 18+** — [nodejs.org](https://nodejs.org) or `brew install node`

---

## Setup & Run (macOS)

Run this single command from the project root:
```bash
chmod +x start.sh
./start.sh
```

This will:
1. Create a Python virtual environment
2. Install all Python dependencies
3. Install all Node.js dependencies
4. Start the backend on http://localhost:8000
5. Start the frontend on http://localhost:5173

Open http://localhost:5173 in your browser.

Press Ctrl+C to stop both servers.

---

## How It Works

1. User pastes an article URL into the input field
2. Frontend sends the URL to the backend via POST /analyze
3. Backend fetches the article HTML and extracts the body text
4. Text is cleaned using NLTK — tokenized, stopwords removed, lemmatized
5. TF-IDF scores each word by how important it is to this specific article
6. LDA groups words into topics (2-5 topics depending on article length)
7. Backend returns words with weights and topic assignments
8. Frontend renders words on a 3D sphere, bigger words have higher TF-IDF scores, colors indicate topic groups

---

## Project Structure
```
3d-word-cloud/
├── start.sh
├── README.md
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── styles.css
        ├── types/index.ts
        ├── hooks/useAnalyze.ts
        └── components/
            ├── URLInput.tsx
            ├── Scene.tsx
            └── WordCloud.tsx
```