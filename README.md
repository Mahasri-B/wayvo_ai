# PathFinder TN

AI-powered multimodal rural travel assistant for Tamil Nadu, India.

## Quick Start

### 1. Prerequisites
- Docker Desktop
- Ollama installed locally → https://ollama.ai

### 2. Pull the LLM
```bash
ollama pull llama3
```

### 3. Setup environment
```bash
cp .env.example .env
# Edit .env and add your API keys (ORS, OpenWeatherMap, Groq)
```

### 4. Start all services
```bash
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- ChromaDB: localhost:8001

---

## Dataset Ingestion

Once you have your datasets ready, ingest them:

```bash
cd backend

# Bus routes
python ingestion/ingest.py --file your_bus_data.csv --type bus_routes

# Train connections
python ingestion/ingest.py --file your_train_data.csv --type train_connections

# Local transport (auto, share auto, van, ferry)
python ingestion/ingest.py --file your_local_transport.csv --type local_transport

# Village/location data
python ingestion/ingest.py --file your_locations.csv --type locations

# Road segments (ghat roads, conditions)
python ingestion/ingest.py --file your_roads.csv --type road_segments

# Local intelligence (tips, safety notes) - also vectorized into ChromaDB
python ingestion/ingest.py --file your_intel.csv --type local_intelligence

# Manual alerts
python ingestion/ingest.py --file your_alerts.csv --type alerts
```

See `backend/data/sample_schemas/` for exact column formats.

---

## Dataset Column Schemas

| Dataset | Required Columns |
|---------|-----------------|
| bus_routes | route_number, operator, origin, destination |
| train_connections | train_number, train_name, origin_station, destination_station |
| local_transport | transport_type, area |
| locations | name, district |
| road_segments | from_location, to_location |
| local_intelligence | location, category, content |
| alerts | alert_type, title, affected_area |

---

## Architecture

```
Frontend (React + Tailwind + Leaflet)
    ↓ HTTP
Backend (FastAPI)
    ├── Route Service (rule-based multimodal chaining)
    ├── Weather Service (OpenWeatherMap)
    ├── ORS Service (map geometry)
    ├── RAG Retriever (ChromaDB)
    └── LLM Service (Ollama llama3 → Groq fallback)
         ↓
    PostgreSQL (transport data)
    ChromaDB (local intelligence vectors)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/routes/search | Search multimodal routes |
| GET | /api/v1/routes/geometry | Get map geometry |
| GET | /api/v1/routes/locations/search | Geocode location |
| POST | /api/v1/chat/ | AI chatbot |
| GET | /api/v1/alerts/ | Get active alerts |
| GET | /api/v1/admin/stats | Dataset statistics |
| GET | /api/v1/admin/health | Health check |

## Deployment

**Frontend → Vercel**
```bash
cd frontend && npm run build
# Deploy build/ folder to Vercel
```

**Backend → Render/Railway**
- Point to `backend/` directory
- Set environment variables from `.env`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
