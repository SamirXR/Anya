# Deploymend

Minimal deployment guide for Anya (FastAPI backend + Vite frontend).

## 1) Prerequisites
- Python 3.10+
- Node.js 18+
- Git

## 2) Environment Variables (Backend)
Create `backend/.env` with:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_BING_SEARCH_KEY` (optional)

## 3) Local Production-Like Run
### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Frontend URL: `http://localhost:4173`
Backend URL: `http://localhost:8000`

## 4) Deploy (Simple Split Setup)
- Deploy backend (FastAPI) to a Python host (Render, Railway, Azure App Service, VM).
- Deploy frontend (Vite static build from `frontend/dist`) to static hosting (Vercel, Netlify, Azure Static Web Apps).
- Set frontend API base URL to your deployed backend URL.

## 5) Backend Start Command (Cloud)
Use this command on your backend host:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## 6) Final Checklist
- Backend is reachable from the internet.
- CORS allows your frontend domain.
- All Azure keys are set in backend environment.
- Frontend points to the correct backend API URL.
