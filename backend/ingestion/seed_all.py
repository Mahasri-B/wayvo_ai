"""
Wayvo AI - Complete Data Seeder
Seeds: SETC bus routes, hill stations, local transport, road segments, local intelligence
Run from backend folder: python ingestion/seed_all.py
"""
import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, init_db
from app.models.transport import BusRoute, LocalTransport, TransportHub
from app.models.local_intel import Location, RoadSegment, LocalIntelligence
from app.models.alerts import Alert

SETC_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "TNDATA_SETC.json")

# ── Bus type mapping ──────────────────────────────────────────────────────────
BUS_TYPE_MAP = {
    "ULTRA": "AC", "AC": "AC", "SUPER": "express",
    "EXPRESS": "express", "ORDINARY": "ordinary",
    "MINI": "mini", "DELUXE": "express",
}

def _bus_type(raw: str) -> str:
    return BUS_TYPE_MAP.get(str(raw).strip().upper(), "ordinary")

def _parse_time(t: str) -> str:
    """Convert 17.45 or 17:45 -> 17:45"""
    t = str(t).strip().replace(".", ":")
    parts = t.split(":")
    if len(parts) == 2:
        h, m = parts
        return f"{int(h):02d}:{int(float('0.'+m)*60) if '.' in str(m) else int(m):02d}"
    return t

def _estimate_duration(distance_km) -> int:
    try:
        km = float(distance_km)
        return max(30, int(km / 50 * 60))  # ~50 km/h avg
    except:
        return 180

def _estimate_fare(distance_km) -> float:
    try:
        return round(float(distance_km) * 0.55, 0)  # ~₹0.55/km SETC rate
    except:
        return 100.0

# ── 1. SETC Bus Routes ────────────────────────────────────────────────────────
def seed_setc_buses(db: Session):
    print("\n[1/4] Seeding SETC bus routes from TNDATA_SETC.json...")
    with open(SETC_PATH) as f:
        raw = json.load(f)

    # fields: a=SlNo, b=Depot, c=RouteNo, d=From, e=To, f=Length, g=Type, h=Services, i=Departure
    count = 0
    for row in raw["data"]:
        try:
            _, depot, route_no, origin, destination, distance, bus_type_raw, services, dep_time = row
            dep = _parse_time(dep_time)
            duration = _estimate_duration(distance)
            fare = _estimate_fare(distance)
            record = BusRoute(
                route_number=str(route_no).strip(),
                operator="SETC",
                origin=str(origin).strip().title(),
                destination=str(destination).strip().title(),
                via_stops=[],
                departure_times=[dep],
                frequency_minutes=None,
                duration_minutes=duration,
                fare_inr=fare,
                bus_type=_bus_type(bus_type_raw),
                operates_on=["daily"],
                notes=f"Depot: {depot}",
            )
            db.add(record)
            count += 1
        except Exception as e:
            continue

    db.commit()
    print(f"  ✓ {count} SETC bus routes seeded")

# ── 2. Hill Stations ──────────────────────────────────────────────────────────
HILL_STATIONS = [
    {"name":"Kodaikanal","district":"Dindigul","latitude":10.2381,"longitude":77.4892,
     "elevation_m":2133,"nearest_town":"Dindigul","nearest_railway":"Kodai Road",
     "nearest_bus_stand":"Kodaikanal Bus Stand","best_season":"Apr-Jun, Sep-Nov",
     "avoid_season":"Jun-Aug (heavy monsoon)",
     "connectivity_notes":"BSNL/Jio stronger in remote hills. Steep ghat roads, multiple hairpin bends.",
     "tourism":"Lake, Coaker's Walk, Pillar Rocks",
     "warnings":["Slippery roads during rain","Landslide risk in monsoon","Monkey disturbances near tourist spots","BSNL/Jio stronger in remote hills"],
     "roads":"Steep ghat roads, multiple hairpin bends","climate":"Cool, foggy, heavy monsoon rain"},
    {"name":"Ooty","district":"Nilgiris","latitude":11.4102,"longitude":76.6950,
     "elevation_m":2240,"nearest_town":"Mettupalayam","nearest_railway":"Udhagamandalam/Ooty",
     "nearest_bus_stand":"Ooty Bus Stand","best_season":"Mar-Jun",
     "avoid_season":"Nov-Jan (very cold), Jul-Aug (monsoon)",
     "connectivity_notes":"Narrow mountain roads, fog-prone. Tourist traffic congestion common.",
     "tourism":"Botanical Garden, Tea Estates, Ooty Lake",
     "warnings":["Tourist traffic congestion","Landslide-prone during monsoon","Heavy fog in mornings/winter"],
     "roads":"Narrow mountain roads, fog-prone","climate":"Cold throughout the year"},
    {"name":"Coonoor","district":"Nilgiris","latitude":11.3530,"longitude":76.7959,
     "elevation_m":1850,"nearest_town":"Ooty","nearest_railway":"Coonoor",
     "nearest_bus_stand":"Coonoor Bus Stand","best_season":"Mar-Jun",
     "avoid_season":"Jul-Sep (monsoon)",
     "connectivity_notes":"Curved hill roads. Reduced visibility during fog.",
     "tourism":"Dolphin's Nose, Sim's Park",
     "warnings":["Reduced visibility during fog","Narrow roads near tea estates"],
     "roads":"Curved hill roads","climate":"Misty and cool"},
    {"name":"Kotagiri","district":"Nilgiris","latitude":11.4333,"longitude":76.8667,
     "elevation_m":1793,"nearest_town":"Ooty","nearest_railway":"Coonoor",
     "nearest_bus_stand":"Kotagiri Bus Stand","best_season":"Mar-Jun",
     "avoid_season":"Jul-Sep",
     "connectivity_notes":"Sparse fuel stations. Fog during rain/winter.",
     "tourism":"Catherine Falls, Tea Estates",
     "warnings":["Sparse fuel stations","Fog during rain/winter"],
     "roads":"Sharp turns and slopes","climate":"Mild and cool"},
    {"name":"Yercaud","district":"Salem","latitude":11.7750,"longitude":78.2083,
     "elevation_m":1515,"nearest_town":"Salem","nearest_railway":"Salem Junction",
     "nearest_bus_stand":"Yercaud Bus Stand","best_season":"Mar-Jun",
     "avoid_season":"Jul-Sep (dense fog)",
     "connectivity_notes":"20+ hairpin bends from Salem. Weekend tourist traffic.",
     "tourism":"Yercaud Lake, Pagoda Point",
     "warnings":["Dense fog during monsoon","Weekend tourist traffic"],
     "roads":"20+ hairpin bends from Salem","climate":"Pleasant and cool"},
    {"name":"Kolli Hills","district":"Namakkal","latitude":11.2833,"longitude":78.3167,
     "elevation_m":1300,"nearest_town":"Namakkal","nearest_railway":"Namakkal/Karur",
     "nearest_bus_stand":"Semmedu","best_season":"Oct-Feb",
     "avoid_season":"Jun-Sep (dangerous roads)",
     "connectivity_notes":"70 hairpin bends. Weak mobile signal in stretches. Forest animal movement.",
     "tourism":"Agaya Gangai Falls, Siddhar caves",
     "warnings":["Dangerous night driving","Weak mobile signal in stretches","Forest animal movement"],
     "roads":"70 hairpin bends","climate":"Cool with frequent fog"},
    {"name":"Valparai","district":"Coimbatore","latitude":10.3269,"longitude":76.9553,
     "elevation_m":1193,"nearest_town":"Pollachi","nearest_railway":"Pollachi",
     "nearest_bus_stand":"Valparai Bus Stand","best_season":"Oct-Mar",
     "avoid_season":"Jun-Sep (elephant crossings increase)",
     "connectivity_notes":"Dense forest ghat roads. Elephant crossings common. Limited fuel stations.",
     "tourism":"Tea estates, Sholayar Dam",
     "warnings":["Elephant crossings common","Sharp curves","Limited fuel stations"],
     "roads":"Dense forest ghat roads","climate":"Rainy and misty"},
    {"name":"Meghamalai","district":"Theni","latitude":9.8833,"longitude":77.3167,
     "elevation_m":1500,"nearest_town":"Theni","nearest_railway":"Madurai",
     "nearest_bus_stand":"Chinnamanur","best_season":"Oct-Feb",
     "avoid_season":"Jun-Sep (no mobile signal, wildlife)",
     "connectivity_notes":"Weak/no mobile signal. Wildlife crossings. Less public transport frequency.",
     "tourism":"Tea estates, dams, waterfalls",
     "warnings":["Weak/no mobile signal","Wildlife crossings","Less public transport frequency"],
     "roads":"Forest and estate roads","climate":"Misty, rainy"},
    {"name":"Yelagiri","district":"Tirupattur","latitude":12.5833,"longitude":78.6333,
     "elevation_m":1110,"nearest_town":"Jolarpettai","nearest_railway":"Jolarpettai Junction",
     "nearest_bus_stand":"Yelagiri Bus Stand","best_season":"Oct-Mar",
     "avoid_season":"Jul-Sep",
     "connectivity_notes":"Hairpin bends. Weekend tourist crowd. Fog during rainy season.",
     "tourism":"Nature park, boating",
     "warnings":["Weekend tourist crowd","Fog during rainy season"],
     "roads":"Hairpin bends","climate":"Moderate and pleasant"},
    {"name":"Topslip","district":"Coimbatore","latitude":10.4167,"longitude":76.9833,
     "elevation_m":800,"nearest_town":"Pollachi","nearest_railway":"Pollachi",
     "nearest_bus_stand":"Pollachi","best_season":"Oct-Mar",
     "avoid_season":"Jun-Sep (forest restrictions)",
     "connectivity_notes":"Forest checkpost restrictions. Wildlife crossings. Limited mobile network.",
     "tourism":"Anamalai Tiger Reserve",
     "warnings":["Forest checkpost restrictions","Wildlife crossings","Limited mobile network"],
     "roads":"Forest reserve roads","climate":"Forest climate, humid"},
    {"name":"Sathyamangalam","district":"Erode","latitude":11.5000,"longitude":77.2333,
     "elevation_m":400,"nearest_town":"Sathyamangalam","nearest_railway":"Erode",
     "nearest_bus_stand":"Sathyamangalam Bus Stand","best_season":"Oct-Feb",
     "avoid_season":"Jun-Sep (elephant zone)",
     "connectivity_notes":"Elephant crossing zone. Dense fog during rain. Night driving caution.",
     "tourism":"Sathyamangalam Tiger Reserve",
     "warnings":["Elephant crossing zone","Dense fog during rain","Night driving caution"],
     "roads":"Sharp curves and forest roads","climate":"Forest and dry hill climate"},
]

def seed_hill_stations(db: Session):
    print("\n[2/4] Seeding hill stations...")
    count = 0
    for h in HILL_STATIONS:
        loc = Location(
            name=h["name"], location_type="hill_station",
            district=h["district"], latitude=h["latitude"], longitude=h["longitude"],
            elevation_m=h["elevation_m"], nearest_town=h["nearest_town"],
            nearest_railway=h["nearest_railway"], nearest_bus_stand=h["nearest_bus_stand"],
            best_season=h["best_season"], avoid_season=h["avoid_season"],
            connectivity_notes=h["connectivity_notes"],
        )
        db.add(loc)

        # Local intelligence entry with full detail
        intel_content = (
            f"Altitude: {h['elevation_m']}m. Climate: {h['climate']}. "
            f"Roads: {h['roads']}. "
            f"Warnings: {'; '.join(h['warnings'])}. "
            f"Tourism: {h['tourism']}. "
            f"Best season: {h['best_season']}. Avoid: {h['avoid_season']}. "
            f"Nearest railway: {h['nearest_railway']}. Nearest bus: {h['nearest_bus_stand']}."
        )
        intel = LocalIntelligence(
            location=h["name"], district=h["district"],
            category="hill_station",
            title=f"{h['name']} Hill Station Guide",
            content=intel_content,
            tags=["hill_station", "safety", "travel_tips", h["district"].lower()],
            source="curated",
        )
        db.add(intel)

        # Road segment warnings
        road = RoadSegment(
            from_location=h["nearest_town"], to_location=h["name"],
            road_type="ghat", is_ghat_road=True,
            condition="fair", is_seasonal=True,
            scenic_rating=5, difficulty_rating=4,
            safety_notes="; ".join(h["warnings"]),
            local_tips=f"Best season: {h['best_season']}. Avoid: {h['avoid_season']}.",
        )
        db.add(road)
        count += 1

    db.commit()
    print(f"  ✓ {count} hill stations seeded (locations + intel + road segments)")

# ── 3. Local Transport ────────────────────────────────────────────────────────
LOCAL_TRANSPORT = [
    ("auto","Chennai","fixed","6am-11pm","Every 5 min",8),
    ("share_auto","Chennai","fixed","6am-10pm","Every 10 min",10),
    ("auto","Coimbatore","metered","6am-11pm","Every 10 min",6),
    ("auto","Madurai","negotiable","6am-11pm","Every 10 min",6),
    ("share_auto","Madurai","fixed","6am-9pm","Every 15 min",8),
    ("auto","Trichy","negotiable","6am-10pm","Every 15 min",5),
    ("auto","Salem","negotiable","6am-10pm","Every 15 min",5),
    ("van","Ooty","fixed","7am-7pm","Every 30 min",15),
    ("share_auto","Ooty","fixed","7am-7pm","Every 20 min",12),
    ("auto","Kodaikanal","negotiable","7am-8pm","Every 30 min",15),
    ("van","Kodaikanal","fixed","7am-6pm","Every 45 min",20),
    ("auto","Rameswaram","negotiable","6am-9pm","Every 20 min",5),
    ("ferry","Rameswaram","fixed","6am-6pm","Every 2 hrs",30),
    ("auto","Kanyakumari","negotiable","6am-9pm","Every 20 min",5),
    ("van","Yercaud","fixed","7am-7pm","Every 30 min",10),
    ("auto","Vellore","negotiable","6am-10pm","Every 10 min",5),
    ("auto","Tirunelveli","negotiable","6am-10pm","Every 15 min",5),
    ("share_auto","Coimbatore","fixed","6am-9pm","Every 10 min",8),
    ("cab","Chennai","metered","24hrs","On demand",0),
    ("cab","Coimbatore","metered","24hrs","On demand",0),
    ("cab","Madurai","metered","24hrs","On demand",0),
    ("van","Valparai","fixed","7am-6pm","Every 1 hr",25),
    ("auto","Pollachi","negotiable","6am-9pm","Every 20 min",5),
    ("auto","Erode","negotiable","6am-10pm","Every 15 min",5),
    ("auto","Thanjavur","negotiable","6am-10pm","Every 15 min",5),
]

def seed_local_transport(db: Session):
    print("\n[3/4] Seeding local transport...")
    count = 0
    for t_type, area, fare_type, avail, freq, fare in LOCAL_TRANSPORT:
        record = LocalTransport(
            transport_type=t_type, area=area,
            approximate_fare_inr=fare, fare_type=fare_type,
            availability=avail, frequency=freq, is_active=True,
        )
        db.add(record)
        count += 1
    db.commit()
    print(f"  ✓ {count} local transport records seeded")

# ── 4. General TN Hill Travel Intelligence ────────────────────────────────────
GENERAL_INTEL = [
    ("Tamil Nadu","general","Hill Travel Safety","Avoid hill driving during heavy rain/fog. Check weather before travel. Carry fuel before remote hill routes."),
    ("Tamil Nadu","connectivity","Mobile Network in Hills","BSNL often works better in deep hill areas. Jio/Airtel may have weak signal in remote stretches."),
    ("Tamil Nadu","safety","Wet Road Safety","Wet roads increase braking distance significantly. Reduce speed on ghat roads during and after rain."),
    ("Tamil Nadu","transport","Hill Transport Frequency","Public transport frequency may reduce during bad weather. Plan for delays or carry extra cash for private transport."),
    ("Tamil Nadu","safety","Remote Hill Preparedness","Some remote hills may lose electricity/internet during storms. Carry emergency medicines in remote hill regions."),
    ("Tamil Nadu","weather","Night Temperature Drop","Hill temperatures can drop significantly at night. Carry warm clothing even in summer months."),
    ("Tamil Nadu","safety","Wildlife Zones","Valparai, Topslip, Sathyamangalam, and Meghamalai have active wildlife corridors. Do not stop vehicle in forest stretches at night."),
    ("Tamil Nadu","transport","Ghat Road Rules","Heavy vehicles banned on some ghat roads during peak hours. One-way traffic enforced on certain ghats during weekends."),
]

def seed_general_intel(db: Session):
    print("\n[4/4] Seeding general TN travel intelligence...")
    count = 0
    for loc, cat, title, content in GENERAL_INTEL:
        intel = LocalIntelligence(
            location=loc, district="Tamil Nadu",
            category=cat, title=title, content=content,
            tags=["general", cat, "safety"],
            source="curated",
        )
        db.add(intel)
        count += 1
    db.commit()
    print(f"  ✓ {count} general intelligence records seeded")

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Wayvo AI — Full Data Seeder")
    print("=" * 40)
    init_db()
    db = SessionLocal()
    try:
        seed_setc_buses(db)
        seed_hill_stations(db)
        seed_local_transport(db)
        seed_general_intel(db)
        print("\n✓ All data seeded successfully!")
        print("  Restart the backend to reflect updated stats.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
