import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import type { LatLngBoundsExpression } from 'leaflet';
import { greenIcon, redIcon, yellowIcon } from '../maps/mapIcons';
import { BaseLayers } from '../maps/BaseLayers';
import { directionsUrl, streetViewUrl } from '../../lib/maps';
import { PayStatusBadge, money } from './PayStatusBadge';
import { PROPERTY_TYPE_LABEL, type PropertyMapRow } from '../../types/collection.types';

interface Props {
  properties: PropertyMapRow[];
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [-6.7924, 39.2083]; // Dar es Salaam

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 17);
      return;
    }
    map.fitBounds(points as LatLngBoundsExpression, { padding: [30, 30], maxZoom: 18 });
  }, [points, map]);
  return null;
}

export function PropertiesMap({ properties, height = '70vh' }: Props) {
  const navigate = useNavigate();
  const [me, setMe] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setMe([pos.coords.latitude, pos.coords.longitude]),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const points = useMemo(
    () => properties.map((p) => [p.location_lat as number, p.location_lng as number] as [number, number]),
    [properties]
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-secondary-100 dark:border-slate-700" style={{ height }}>
      <MapContainer center={points[0] ?? DEFAULT_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
        <BaseLayers />
        <FitBounds points={points} />

        {me && <CircleMarker center={me} radius={8} pathOptions={{ color: '#2563eb', fillOpacity: 0.9 }} />}

        {properties.map((p) => {
          const pos: [number, number] = [p.location_lat as number, p.location_lng as number];
          const popup = (
            <Popup>
              <div className="space-y-1 min-w-[190px]">
                <p className="font-semibold">{p.owner_name || 'Nyumba'}</p>
                <p className="text-xs text-secondary-500">
                  {PROPERTY_TYPE_LABEL[p.property_type]}
                  {p.address ? ` • ${p.address}` : ''}
                </p>
                <PayStatusBadge status={p.map_status} />
                <p className="text-xs">
                  Vichwa: {p.units_occupied} • Wamelipa {p.units_paid} • Sehemu {p.units_partial} • Hawajalipa{' '}
                  {p.units_unpaid}
                </p>
                {p.total_debt > 0 && <p className="text-sm font-semibold text-error-600">Deni: {money(p.total_debt)}</p>}
                <button
                  onClick={() => navigate(`/collect/property/${p.property_id}`)}
                  className="mt-1 w-full rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white"
                >
                  Fungua nyumba
                </button>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <a
                    href={streetViewUrl(pos[0], pos[1])}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-primary-300 px-2 py-1.5 text-center text-xs font-medium text-primary-700"
                  >
                    Street View
                  </a>
                  <a
                    href={directionsUrl(pos[0], pos[1])}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-primary-300 px-2 py-1.5 text-center text-xs font-medium text-primary-700"
                  >
                    Elekea hapa
                  </a>
                </div>
              </div>
            </Popup>
          );

          if (p.map_status === 'vacant') {
            return (
              <CircleMarker key={p.property_id} center={pos} radius={9} pathOptions={{ color: '#6b7280', fillOpacity: 0.7 }}>
                {popup}
              </CircleMarker>
            );
          }
          const icon = p.map_status === 'paid' ? greenIcon : p.map_status === 'partial' ? yellowIcon : redIcon;
          return (
            <Marker key={p.property_id} position={pos} icon={icon}>
              {popup}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
