"""
PathFinder TN - Dataset Ingestion Script
Usage:
  python ingest.py --file data.csv --type bus_routes
  python ingest.py --file data.json --type train_connections
  python ingest.py --file data.csv --type local_transport
  python ingest.py --file data.csv --type locations
  python ingest.py --file data.csv --type road_segments
  python ingest.py --file data.csv --type local_intelligence
  python ingest.py --file data.csv --type alerts

Supported types: bus_routes, train_connections, local_transport,
                 transport_hubs, locations, road_segments,
                 local_intelligence, alerts
"""
import argparse
import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import json
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, init_db
from app.models.transport import BusRoute, TrainConnection, LocalTransport, TransportHub
from app.models.local_intel import Location, RoadSegment, LocalIntelligence
from app.models.alerts import Alert
from app.rag.retriever import add_document
from app.rag.chroma_client import COLLECTIONS


def load_file(filepath: str) -> pd.DataFrame:
    """Load CSV or JSON file into DataFrame."""
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return pd.read_csv(filepath)
    elif ext == ".json":
        with open(filepath) as f:
            data = json.load(f)
        if isinstance(data, list):
            return pd.DataFrame(data)
        elif isinstance(data, dict) and "data" in data:
            return pd.DataFrame(data["data"])
        else:
            return pd.DataFrame([data])
    else:
        raise ValueError(f"Unsupported file format: {ext}. Use CSV or JSON.")


def ingest_bus_routes(df: pd.DataFrame, db: Session):
    """Ingest bus route data."""
    required = ["route_number", "operator", "origin", "destination"]
    _check_required_columns(df, required, "bus_routes")

    count = 0
    for _, row in df.iterrows():
        record = BusRoute(
            route_number=str(row.get("route_number", "")),
            operator=str(row.get("operator", "")),
            origin=str(row.get("origin", "")),
            destination=str(row.get("destination", "")),
            via_stops=_parse_json_field(row.get("via_stops")),
            departure_times=_parse_json_field(row.get("departure_times")),
            frequency_minutes=_safe_int(row.get("frequency_minutes")),
            duration_minutes=_safe_int(row.get("duration_minutes")),
            fare_inr=_safe_float(row.get("fare_inr")),
            bus_type=str(row.get("bus_type", "ordinary")),
            operates_on=_parse_json_field(row.get("operates_on", '["daily"]')),
            notes=str(row.get("notes", "")) if pd.notna(row.get("notes")) else None,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} bus routes")


def ingest_train_connections(df: pd.DataFrame, db: Session):
    """Ingest train connection data."""
    required = ["train_number", "train_name", "origin_station", "destination_station"]
    _check_required_columns(df, required, "train_connections")

    count = 0
    for _, row in df.iterrows():
        record = TrainConnection(
            train_number=str(row.get("train_number", "")),
            train_name=str(row.get("train_name", "")),
            origin_station=str(row.get("origin_station", "")),
            destination_station=str(row.get("destination_station", "")),
            origin_code=str(row.get("origin_code", "")),
            destination_code=str(row.get("destination_code", "")),
            via_stations=_parse_json_field(row.get("via_stations")),
            departure_time=str(row.get("departure_time", "")),
            arrival_time=str(row.get("arrival_time", "")),
            duration_minutes=_safe_int(row.get("duration_minutes")),
            fare_sleeper=_safe_float(row.get("fare_sleeper")),
            fare_general=_safe_float(row.get("fare_general")),
            fare_ac=_safe_float(row.get("fare_ac")),
            train_type=str(row.get("train_type", "express")),
            operates_on=_parse_json_field(row.get("operates_on", '["daily"]')),
            notes=str(row.get("notes", "")) if pd.notna(row.get("notes")) else None,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} train connections")


def ingest_local_transport(df: pd.DataFrame, db: Session):
    """Ingest local transport data (auto, share auto, van, ferry, etc.)."""
    required = ["transport_type", "area"]
    _check_required_columns(df, required, "local_transport")

    count = 0
    for _, row in df.iterrows():
        record = LocalTransport(
            transport_type=str(row.get("transport_type", "")),
            area=str(row.get("area", "")),
            origin=str(row.get("origin", "")) if pd.notna(row.get("origin")) else None,
            destination=str(row.get("destination", "")) if pd.notna(row.get("destination")) else None,
            approximate_fare_inr=_safe_float(row.get("approximate_fare_inr")),
            fare_type=str(row.get("fare_type", "negotiable")),
            availability=str(row.get("availability", "")) if pd.notna(row.get("availability")) else None,
            frequency=str(row.get("frequency", "")) if pd.notna(row.get("frequency")) else None,
            capacity=_safe_int(row.get("capacity")),
            notes=str(row.get("notes", "")) if pd.notna(row.get("notes")) else None,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} local transport records")


def ingest_locations(df: pd.DataFrame, db: Session):
    """Ingest location/village data."""
    required = ["name", "district"]
    _check_required_columns(df, required, "locations")

    count = 0
    for _, row in df.iterrows():
        record = Location(
            name=str(row.get("name", "")),
            local_name=str(row.get("local_name", "")) if pd.notna(row.get("local_name")) else None,
            location_type=str(row.get("location_type", "village")),
            district=str(row.get("district", "")),
            taluk=str(row.get("taluk", "")) if pd.notna(row.get("taluk")) else None,
            latitude=_safe_float(row.get("latitude")),
            longitude=_safe_float(row.get("longitude")),
            population=_safe_int(row.get("population")),
            elevation_m=_safe_float(row.get("elevation_m")),
            nearest_town=str(row.get("nearest_town", "")) if pd.notna(row.get("nearest_town")) else None,
            nearest_railway=str(row.get("nearest_railway", "")) if pd.notna(row.get("nearest_railway")) else None,
            nearest_bus_stand=str(row.get("nearest_bus_stand", "")) if pd.notna(row.get("nearest_bus_stand")) else None,
            connectivity_notes=str(row.get("connectivity_notes", "")) if pd.notna(row.get("connectivity_notes")) else None,
            best_season=str(row.get("best_season", "")) if pd.notna(row.get("best_season")) else None,
            avoid_season=str(row.get("avoid_season", "")) if pd.notna(row.get("avoid_season")) else None,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} locations")


def ingest_road_segments(df: pd.DataFrame, db: Session):
    """Ingest road segment data."""
    required = ["from_location", "to_location"]
    _check_required_columns(df, required, "road_segments")

    count = 0
    for _, row in df.iterrows():
        record = RoadSegment(
            from_location=str(row.get("from_location", "")),
            to_location=str(row.get("to_location", "")),
            road_name=str(row.get("road_name", "")) if pd.notna(row.get("road_name")) else None,
            road_type=str(row.get("road_type", "MDR")),
            distance_km=_safe_float(row.get("distance_km")),
            condition=str(row.get("condition", "fair")),
            is_ghat_road=bool(row.get("is_ghat_road", False)),
            ghat_sections=_safe_int(row.get("ghat_sections")),
            is_seasonal=bool(row.get("is_seasonal", False)),
            closed_months=_parse_json_field(row.get("closed_months")),
            scenic_rating=_safe_int(row.get("scenic_rating")) or 3,
            difficulty_rating=_safe_int(row.get("difficulty_rating")) or 2,
            safety_notes=str(row.get("safety_notes", "")) if pd.notna(row.get("safety_notes")) else None,
            local_tips=str(row.get("local_tips", "")) if pd.notna(row.get("local_tips")) else None,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} road segments")


def ingest_local_intelligence(df: pd.DataFrame, db: Session):
    """Ingest local intelligence and also vectorize into ChromaDB."""
    required = ["location", "category", "content"]
    _check_required_columns(df, required, "local_intelligence")

    count = 0
    for i, row in df.iterrows():
        # Save to PostgreSQL
        record = LocalIntelligence(
            location=str(row.get("location", "")),
            district=str(row.get("district", "")) if pd.notna(row.get("district")) else None,
            category=str(row.get("category", "")),
            title=str(row.get("title", "")) if pd.notna(row.get("title")) else None,
            content=str(row.get("content", "")),
            tags=_parse_json_field(row.get("tags")),
            source=str(row.get("source", "manual")),
        )
        db.add(record)

        # Vectorize into ChromaDB
        doc_text = f"{row.get('title', '')} {row.get('content', '')} Location: {row.get('location', '')}"
        add_document(
            collection_name=COLLECTIONS["local_intelligence"],
            doc_id=f"intel_{i}_{row.get('location', 'unknown')}",
            text=doc_text,
            metadata={
                "location": str(row.get("location", "")),
                "district": str(row.get("district", "")),
                "category": str(row.get("category", "")),
            },
        )
        count += 1

    db.commit()
    print(f"✓ Ingested {count} local intelligence records (DB + ChromaDB)")


def ingest_alerts(df: pd.DataFrame, db: Session):
    """Ingest manual alert data."""
    required = ["alert_type", "title", "affected_area"]
    _check_required_columns(df, required, "alerts")

    count = 0
    for _, row in df.iterrows():
        record = Alert(
            alert_type=str(row.get("alert_type", "general")),
            severity=str(row.get("severity", "medium")),
            title=str(row.get("title", "")),
            description=str(row.get("description", "")) if pd.notna(row.get("description")) else None,
            affected_area=str(row.get("affected_area", "")),
            district=str(row.get("district", "")) if pd.notna(row.get("district")) else None,
            latitude=_safe_float(row.get("latitude")),
            longitude=_safe_float(row.get("longitude")),
            source="manual",
            is_active=True,
        )
        db.add(record)
        count += 1

    db.commit()
    print(f"✓ Ingested {count} alerts")


# ── Helpers ──────────────────────────────────────────────────────────────────

INGEST_MAP = {
    "bus_routes": ingest_bus_routes,
    "train_connections": ingest_train_connections,
    "local_transport": ingest_local_transport,
    "transport_hubs": None,  # placeholder
    "locations": ingest_locations,
    "road_segments": ingest_road_segments,
    "local_intelligence": ingest_local_intelligence,
    "alerts": ingest_alerts,
}


def _check_required_columns(df: pd.DataFrame, required: list, dataset_type: str):
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"\n✗ Missing required columns for {dataset_type}: {missing}")
        print(f"  Your columns: {list(df.columns)}")
        print(f"\nSee backend/data/sample_schemas/ for expected column formats.")
        sys.exit(1)


def _safe_int(val) -> int | None:
    try:
        return int(val) if pd.notna(val) else None
    except (ValueError, TypeError):
        return None


def _safe_float(val) -> float | None:
    try:
        return float(val) if pd.notna(val) else None
    except (ValueError, TypeError):
        return None


def _parse_json_field(val) -> list | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(str(val))
    except Exception:
        # Try comma-separated string
        if isinstance(val, str) and "," in val:
            return [v.strip() for v in val.split(",")]
        return [str(val)] if val else None


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="PathFinder TN Dataset Ingestion")
    parser.add_argument("--file", required=True, help="Path to CSV or JSON file")
    parser.add_argument(
        "--type",
        required=True,
        choices=list(INGEST_MAP.keys()),
        help="Dataset type to ingest",
    )
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"✗ File not found: {args.file}")
        sys.exit(1)

    print(f"\nPathFinder TN Ingestion")
    print(f"  File: {args.file}")
    print(f"  Type: {args.type}")
    print(f"  Loading...")

    df = load_file(args.file)
    print(f"  Rows loaded: {len(df)}")
    print(f"  Columns: {list(df.columns)}\n")

    init_db()
    db = SessionLocal()

    try:
        fn = INGEST_MAP.get(args.type)
        if fn is None:
            print(f"✗ Ingestion for '{args.type}' not yet implemented")
            sys.exit(1)
        fn(df, db)
        print(f"\n✓ Done.")
    except Exception as e:
        print(f"\n✗ Error during ingestion: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
