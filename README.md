# 3D Word Cloud

Paste any news article URL and watch it turn into an interactive 3D word cloud. The backend fetches the article, extracts the most important keywords using NLP, and the frontend displays them as a spinning 3D sphere you can rotate and zoom.

---

## API Endpoint

**POST** `/analyze`
- Request: `{ "url": "<article_url>" }`
- Response: `{ "words": [{ "word", "weight", "topic" }], "topics": [[...]], "article_title" }`

---

## Libraries Used

**Backend:**
- `fastapi` — Python web framework for building the API
- `uvicorn` — server that runs the FastAPI app
- `httpx` — fetches the article HTML from the URL
- `beautifulsoup4` — parses the HTML and extracts article text
- `nltk` — tokenizes text, removes stopwords, lemmatizes words
- `scikit-learn` — TF-IDF keyword extraction and LDA topic modeling
- `numpy` — numerical operations used during text analysis

**Frontend:**
- `react` + `typescript` — UI framework
- `vite` — development server and build tool
- `three.js` — 3D graphics library
- `@react-three/fiber` — React wrapper for Three.js
- `@react-three/drei` — helper components for React Three Fiber

---

## Prerequisites

Before running this project, make sure you have these installed on your machine:

- **Python 3.10+** — download from https://python.org or run `brew install python`
- **Node.js 18+** — download from https://nodejs.org or run `brew install node`
- **npm** — comes automatically with Node.js, no separate install needed

To verify they are installed, run these commands in your terminal:
```bash
python3 --version
node --version
npm --version
```

All three should print version numbers before proceeding.

---

## Setup & Run (macOS)

**Step 1** — Download the project. Open Terminal and run:
```bash
git clone https://github.com/Manogna-Pagadala/3D-Word-Cloud-Manogna.git
```

**Step 2** — Navigate into the project folder:
```bash
cd 3D-Word-Cloud-Manogna
```

**Step 3** — Make the setup script runnable:
```bash
chmod +x start.sh
```

**Step 4** — Run the setup script:
```bash
./start.sh
```

This will automatically:
- Install all backend Python packages
- Install all frontend JavaScript packages
- Start both servers

Wait until you see both servers running. It may take a minute the first time.

**Step 5** — Open your browser and go to:
```
http://localhost:5173
```

You should see the 3D Word Cloud app.

**To stop the app** — go back to Terminal and press `Ctrl+C`

---

## How It Works

1. User pastes a news article URL into the input field
2. Frontend sends the URL to the backend via `POST /analyze`
3. Backend fetches the article HTML and extracts the body text using BeautifulSoup
4. Text is cleaned using NLTK — tokenized, stopwords removed, lemmatized
5. TF-IDF scores each word by how important it is to this specific article
6. LDA groups words into topics (2-5 topics depending on article length)
7. Backend returns words with weights and topic assignments
8. Frontend renders words on a 3D sphere — bigger words have higher TF-IDF scores, colors indicate different topic groups
9. User can drag to rotate and scroll to zoom

---

## Project Structure
```
3D-Word-Cloud-Manogna/
├── start.sh               # macOS setup and launch script
├── README.md
├── backend/
│   ├── main.py            # FastAPI app — crawling, NLP pipeline, API endpoints
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── index.html
    ├── package.json        # Node.js dependencies
    └── src/
        ├── App.tsx                      # main app layout and state
        ├── main.tsx                     # entry point
        ├── styles.css                   # global styles
        ├── types/index.ts               # TypeScript type definitions
        ├── hooks/useAnalyze.ts          # API call logic
        └── components/
            ├── URLInput.tsx             # URL input field and sample links
            ├── Scene.tsx                # 3D canvas setup
            └── WordCloud.tsx            # 3D word positioning and animation
```

---

## Notes

- Some news sites block scrapers — if a URL fails try a different article
- NLTK data files are downloaded automatically on first run
- The number of topics (2-5) is determined automatically based on article length