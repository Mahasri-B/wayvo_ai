import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TN_CENTER = [10.7905, 78.7047];

function FlyTo({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      map.fitBounds(L.latLngBounds([origin, destination]), { padding: [60, 60] });
    }
  }, [origin, destination, map]);
  return null;
}

export default function MapView({ routeData, alerts }) {
  const origin      = routeData?.origin;
  const destination = routeData?.destination;
  const elevation   = routeData?.elevation;

  const polylines = (routeData?.geometries || []).flatMap(g => {
    if (!g.geometry?.coordinates) return [];
    return [{ coords: g.geometry.coordinates.map(([lon, lat]) => [lat, lon]) }];
  });

  const simpleLine = origin && destination && polylines.length === 0
    ? [[origin.lat, origin.lon], [destination.lat, destination.lon]] : null;

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
      {elevation?.is_hill_route && (
        <div className="absolute top-3 left-3 z-[1000] bg-white rounded-xl px-3 py-1.5 text-xs text-gray-700 flex items-center gap-1.5 shadow-md"
          style={{ border: '1px solid #E5E7EB' }}>
          Hill Route · {Math.round(elevation.destination_elevation_m || 0)}m
          {elevation.elevation_gain_m != null && (
            <span style={{ color: '#22C55E' }}>+{Math.round(elevation.elevation_gain_m)}m</span>
          )}
        </div>
      )}
      <MapContainer center={TN_CENTER} zoom={7} style={{ height: '100%', width: '100%' }} zoomControl>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        {origin && destination && (
          <FlyTo origin={[origin.lat, origin.lon]} destination={[destination.lat, destination.lon]} />
        )}
        {origin && (
          <Marker position={[origin.lat, origin.lon]}>
            <Popup><b>{origin.name}</b><br /><small>Start</small></Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lon]}>
            <Popup><b>{destination.name}</b><br /><small>Destination</small></Popup>
          </Marker>
        )}
        {polylines.map((pl, i) => (
          <Polyline key={i} positions={pl.coords} color="#7C3AED" weight={4} opacity={0.8} />
        ))}
        {simpleLine && (
          <Polyline positions={simpleLine} color="#7C3AED" weight={3} opacity={0.5} dashArray="8 6" />
        )}
        {(alerts || []).map((a, i) => {
          if (!a.latitude || !a.longitude) return null;
          return (
            <CircleMarker key={i} center={[a.latitude, a.longitude]} radius={10}
              color="#EF4444" fillColor="#EF4444" fillOpacity={0.3}>
              <Popup><b>{a.title}</b><br /><small>{a.description}</small></Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
