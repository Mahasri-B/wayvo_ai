"""
Rule-based multimodal route chaining service for Tamil Nadu.
Queries DB for transport options and chains them into complete routes.
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.transport import BusRoute, TrainConnection, LocalTransport, TransportHub
from app.models.local_intel import RoadSegment
from app.schemas.route import RouteOption, TransportLeg, RoutePreference
import uuid


def find_routes(
    db: Session,
    from_location: str,
    to_location: str,
    mode: str = "any",
    preference: str = "fastest",
    elevation_info: dict = None,
) -> List[RouteOption]:
    """
    Rule-based multimodal route finder.
    Chains bus + train + local transport options from DB.
    Returns ranked list of RouteOption objects.
    """
    elevation_info = elevation_info or {}
    is_hill = elevation_info.get("is_hill_route", False)
    elev_gain = elevation_info.get("elevation_gain_m")
    hill_warning = []
    if is_hill:
        dest_elev = elevation_info.get("destination_elevation_m", 0)
        hill_warning = [f"Hill route — destination at ~{int(dest_elev)}m elevation. Ghat road conditions apply."]

    routes = []

    # 1. Direct bus routes
    direct_buses = _find_direct_buses(db, from_location, to_location)
    for bus in direct_buses:
        leg = TransportLeg(
            mode="bus",
            from_stop=bus.origin,
            to_stop=bus.destination,
            operator=bus.operator,
            route_number=bus.route_number,
            departure_time=bus.departure_times[0] if bus.departure_times else None,
            duration_minutes=bus.duration_minutes or 0,
            fare_inr=bus.fare_inr or 0.0,
            notes=bus.notes,
        )
        route = RouteOption(
            route_id=str(uuid.uuid4()),
            label=f"Direct Bus ({bus.operator}) - {bus.route_number}",
            legs=[leg],
            total_duration_minutes=bus.duration_minutes or 0,
            total_fare_inr=bus.fare_inr or 0.0,
            difficulty_rating=3 if is_hill else 2,
            scenic_rating=4 if is_hill else 3,
            safety_rating=3 if is_hill else 4,
            warnings=hill_warning,
            highlights=[f"Direct {bus.bus_type} bus"],
            route_type="direct",
        )
        routes.append(route)

    # 2. Direct train routes
    direct_trains = _find_direct_trains(db, from_location, to_location)
    for train in direct_trains:
        leg = TransportLeg(
            mode="train",
            from_stop=train.origin_station,
            to_stop=train.destination_station,
            operator="Indian Railways",
            route_number=train.train_number,
            departure_time=train.departure_time,
            arrival_time=train.arrival_time,
            duration_minutes=train.duration_minutes or 0,
            fare_inr=train.fare_general or 0.0,
            notes=train.notes,
        )
        route = RouteOption(
            route_id=str(uuid.uuid4()),
            label=f"Train: {train.train_name} ({train.train_number})",
            legs=[leg],
            total_duration_minutes=train.duration_minutes or 0,
            total_fare_inr=train.fare_general or 0.0,
            difficulty_rating=1,
            scenic_rating=3,
            safety_rating=5,
            warnings=[],
            highlights=[f"{train.train_type} train"],
            route_type="direct",
        )
        routes.append(route)

    # 3. Bus + Local transport chain (last-mile)
    chained = _find_chained_routes(db, from_location, to_location)
    routes.extend(chained)

    # 4. Car/self-drive fallback — always show if mode allows
    if mode in ("any", "car") or len(routes) == 0:
        car_route = _build_car_route(from_location, to_location, elevation_info, hill_warning)
        if car_route:
            routes.append(car_route)

    # Sort by preference
    routes = _sort_by_preference(routes, preference)

    return routes[:5]  # return top 5


def _find_direct_buses(db: Session, origin: str, destination: str) -> List[BusRoute]:
    return db.query(BusRoute).filter(
        BusRoute.origin.ilike(f"%{origin}%"),
        BusRoute.destination.ilike(f"%{destination}%"),
        BusRoute.is_active == True,
    ).limit(3).all()


def _find_direct_trains(db: Session, origin: str, destination: str) -> List[TrainConnection]:
    return db.query(TrainConnection).filter(
        TrainConnection.origin_station.ilike(f"%{origin}%"),
        TrainConnection.destination_station.ilike(f"%{destination}%"),
        TrainConnection.is_active == True,
    ).limit(3).all()


def _find_chained_routes(db: Session, origin: str, destination: str) -> List[RouteOption]:
    """
    Attempt to chain: origin -> nearest hub (bus) -> destination hub -> local transport
    """
    chained = []

    # Find buses from origin to any hub near destination
    buses_to_hub = db.query(BusRoute).filter(
        BusRoute.origin.ilike(f"%{origin}%"),
        BusRoute.is_active == True,
    ).limit(5).all()

    for bus in buses_to_hub:
        # Find local transport from bus destination to final destination
        local = db.query(LocalTransport).filter(
            LocalTransport.area.ilike(f"%{bus.destination}%"),
            LocalTransport.is_active == True,
        ).first()

        if local:
            leg1 = TransportLeg(
                mode="bus",
                from_stop=bus.origin,
                to_stop=bus.destination,
                operator=bus.operator,
                route_number=bus.route_number,
                duration_minutes=bus.duration_minutes or 0,
                fare_inr=bus.fare_inr or 0.0,
            )
            leg2 = TransportLeg(
                mode=local.transport_type,
                from_stop=bus.destination,
                to_stop=destination,
                operator="Local",
                duration_minutes=30,  # estimated last-mile
                fare_inr=local.approximate_fare_inr or 0.0,
                notes=local.notes,
            )
            total_duration = (bus.duration_minutes or 0) + 30
            total_fare = (bus.fare_inr or 0.0) + (local.approximate_fare_inr or 0.0)

            route = RouteOption(
                route_id=str(uuid.uuid4()),
                label=f"Bus + {local.transport_type.replace('_', ' ').title()}",
                legs=[leg1, leg2],
                total_duration_minutes=total_duration,
                total_fare_inr=total_fare,
                difficulty_rating=3,
                scenic_rating=3,
                safety_rating=3,
                warnings=["Last-mile timing may vary"],
                highlights=["Covers last-mile connectivity"],
                route_type="1-change",
            )
            chained.append(route)

    return chained[:2]


def _sort_by_preference(routes: List[RouteOption], preference: str) -> List[RouteOption]:
    if preference == "cheapest":
        return sorted(routes, key=lambda r: r.total_fare_inr)
    elif preference == "fastest":
        return sorted(routes, key=lambda r: r.total_duration_minutes)
    elif preference == "scenic":
        return sorted(routes, key=lambda r: -r.scenic_rating)
    elif preference == "safest":
        return sorted(routes, key=lambda r: -r.safety_rating)
    return routes


# Approximate distances between major TN city pairs (km)
_TN_DISTANCES = {
    frozenset(["Chennai", "Coimbatore"]): 500,
    frozenset(["Chennai", "Madurai"]): 460,
    frozenset(["Chennai", "Trichy"]): 330,
    frozenset(["Chennai", "Salem"]): 340,
    frozenset(["Chennai", "Vellore"]): 140,
    frozenset(["Chennai", "Pondicherry"]): 160,
    frozenset(["Chennai", "Kanyakumari"]): 700,
    frozenset(["Chennai", "Tirunelveli"]): 620,
    frozenset(["Chennai", "Ooty"]): 560,
    frozenset(["Chennai", "Kodaikanal"]): 530,
    frozenset(["Coimbatore", "Ooty"]): 86,
    frozenset(["Coimbatore", "Madurai"]): 220,
    frozenset(["Coimbatore", "Salem"]): 160,
    frozenset(["Coimbatore", "Kodaikanal"]): 175,
    frozenset(["Coimbatore", "Valparai"]): 100,
    frozenset(["Madurai", "Rameswaram"]): 170,
    frozenset(["Madurai", "Kanyakumari"]): 250,
    frozenset(["Madurai", "Kodaikanal"]): 120,
    frozenset(["Madurai", "Trichy"]): 130,
    frozenset(["Salem", "Yercaud"]): 30,
    frozenset(["Salem", "Coimbatore"]): 160,
    frozenset(["Trichy", "Thanjavur"]): 55,
    frozenset(["Trichy", "Madurai"]): 130,
    frozenset(["Ooty", "Kodaikanal"]): 200,
    frozenset(["Ooty", "Coonoor"]): 19,
    frozenset(["Ooty", "Kotagiri"]): 28,
    frozenset(["Pollachi", "Valparai"]): 65,
    frozenset(["Pollachi", "Topslip"]): 40,
}


def _lookup_distance(origin: str, destination: str) -> Optional[int]:
    o = origin.strip().title()
    d = destination.strip().title()
    key = frozenset([o, d])
    if key in _TN_DISTANCES:
        return _TN_DISTANCES[key]
    for pair, dist in _TN_DISTANCES.items():
        cities = list(pair)
        if any(o in c or c in o for c in cities) and any(d in c or c in d for c in cities):
            return dist
    return None


def _build_car_route(
    from_location: str,
    to_location: str,
    elevation_info: dict,
    hill_warning: list,
) -> Optional[RouteOption]:
    dist_km = _lookup_distance(from_location, to_location)
    is_hill = elevation_info.get("is_hill_route", False)
    if not dist_km:
        return None

    avg_speed = 40 if is_hill else 60
    duration = int(dist_km / avg_speed * 60)
    fuel_cost = round(dist_km * 8, 0)  # ~₹8/km

    warnings = list(hill_warning)
    if is_hill:
        warnings.append("Ghat road — check weather before departure")

    leg = TransportLeg(
        mode="car",
        from_stop=from_location,
        to_stop=to_location,
        operator="Self Drive",
        duration_minutes=duration,
        fare_inr=fuel_cost,
        notes=f"~{dist_km} km. Estimated fuel cost ₹{int(fuel_cost)}.",
    )
    return RouteOption(
        route_id=str(uuid.uuid4()),
        label=f"Self Drive — {dist_km} km (~{duration//60}h {duration%60}m)",
        legs=[leg],
        total_duration_minutes=duration,
        total_fare_inr=fuel_cost,
        difficulty_rating=4 if is_hill else 2,
        scenic_rating=5 if is_hill else 3,
        safety_rating=3 if is_hill else 4,
        warnings=warnings,
        highlights=[f"~{dist_km} km drive", "Flexible schedule", "Door to door"],
        route_type="direct",
    )
