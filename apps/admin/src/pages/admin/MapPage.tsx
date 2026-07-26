import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { api } from '../../api';
import { ui } from '../../ui';

type MapOverview = {
  activeCities: Array<{
    id: string;
    name: string;
    slug: string;
    latitude: number | null;
    longitude: number | null;
    status: string;
    zone: {
      center: [number, number];
      zoom: number;
      polygon: { type: 'Polygon'; coordinates: [number, number][][] };
    } | null;
  }>;
  guides: Array<{
    userId: string;
    displayName: string;
    email: string;
    status: string;
    latitude: number;
    longitude: number;
    districtName: string;
    citySlug: string | null;
  }>;
  guidePlaces: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    verificationStatus: string;
    guide: { userId: string; displayName: string; email: string } | null;
  }>;
  businessPlaces: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    verificationStatus: string;
    business: { id: string; displayName: string } | null;
  }>;
};

const RAW_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined)?.trim();
const TOKEN =
  RAW_TOKEN && RAW_TOKEN.length > 0 ? RAW_TOKEN.replace(/^["']|["']$/g, '') : undefined;
const TOKEN_OK = Boolean(TOKEN && /^pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(TOKEN));

export function MapPage() {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [data, setData] = useState<MapOverview | null>(null);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showGuideBases, setShowGuideBases] = useState(true);
  const [showGuides, setShowGuides] = useState(false);
  const [showBusiness, setShowBusiness] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    void api<MapOverview>('/v1/admin/map-overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const primaryZone = useMemo(() => {
    if (!data) return null;
    return data.activeCities.find((c) => c.zone)?.zone ?? null;
  }, [data]);

  useEffect(() => {
    if (!TOKEN_OK || !TOKEN || !mapNode.current || !data || mapRef.current) return;

    mapboxgl.accessToken = TOKEN;
    const center = primaryZone?.center ?? ([10.86, 33.81] as [number, number]);
    const zoom = primaryZone?.zoom ?? 10;

    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');
    mapRef.current = map;
    setMapReady(false);

    map.on('error', (e) => {
      const msg = e.error?.message ?? 'Mapbox failed to load';
      const blocked =
        /failed to fetch/i.test(msg) || /networkerror/i.test(msg) || /load failed/i.test(msg);
      setMapError(
        blocked
          ? `${msg}. Often a browser extension blocks Mapbox (see injectScriptAdjust / adblock). Try Incognito with extensions off, or allow api.mapbox.com + events.mapbox.com.`
          : msg,
      );
    });

    map.on('load', () => {
      setMapError('');
      setMapReady(true);
      const features = data.activeCities
        .filter((c) => c.zone)
        .map((c) => ({
          type: 'Feature' as const,
          properties: { name: c.name, slug: c.slug },
          geometry: c.zone!.polygon,
        }));

      map.addSource('service-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: 'service-zones-fill',
        type: 'fill',
        source: 'service-zones',
        paint: {
          'fill-color': '#16a34a',
          'fill-opacity': 0.22,
        },
      });

      map.addLayer({
        id: 'service-zones-line',
        type: 'line',
        source: 'service-zones',
        paint: {
          'line-color': '#15803d',
          'line-width': 2,
          'line-opacity': 0.7,
        },
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [data, primaryZone]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const addMarker = (
      lng: number,
      lat: number,
      color: string,
      title: string,
      subtitle: string,
      key: string,
      size = 14,
    ) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'll-map-marker';
      el.style.background = color;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.title = title;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelected(`${title}\n${subtitle}`);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong>${escapeHtml(title)}</strong><div style="margin-top:4px;color:#64748b;font-size:12px">${escapeHtml(subtitle)}</div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
      void key;
    };

    if (showGuideBases) {
      for (const g of data.guides ?? []) {
        addMarker(
          g.longitude,
          g.latitude,
          '#ea580c',
          g.displayName,
          `Guide · ${g.districtName}${g.citySlug ? ` · ${g.citySlug}` : ''} · ${g.email}`,
          `base-${g.userId}`,
          20,
        );
      }
    }
    if (showGuides) {
      for (const p of data.guidePlaces) {
        addMarker(
          p.longitude,
          p.latitude,
          '#0d9488',
          p.name,
          `Guide place · ${p.guide?.displayName ?? 'unknown'} · ${p.verificationStatus}`,
          `g-${p.id}`,
        );
      }
    }
    if (showBusiness) {
      for (const p of data.businessPlaces) {
        addMarker(
          p.longitude,
          p.latitude,
          '#7c3aed',
          p.name,
          `Business · ${p.business?.displayName ?? 'unknown'} · ${p.verificationStatus}`,
          `b-${p.id}`,
        );
      }
    }
  }, [data, mapReady, showGuideBases, showGuides, showBusiness]);

  if (!TOKEN) {
    return (
      <div style={ui.pageWide}>
        <div className="ll-page-head">
          <div>
            <h1>Map</h1>
            <p className="ll-page-sub">
              Service zone + Guide / Business places. Mapbox token missing.
            </p>
          </div>
        </div>
        <div style={ui.alertWarn}>
          Set <code>VITE_MAPBOX_TOKEN</code> on the Admin service (build-time),
          then redeploy. Locally: put it in <code>apps/admin/.env</code>.
        </div>
      </div>
    );
  }

  if (!TOKEN_OK) {
    return (
      <div style={ui.pageWide}>
        <div className="ll-page-head">
          <div>
            <h1>Map</h1>
            <p className="ll-page-sub">Mapbox token format looks wrong.</p>
          </div>
        </div>
        <div style={ui.alertWarn}>
          Token must be a <strong>public</strong> token starting with{' '}
          <code>pk.</code> (not <code>sk.</code>, not a JWT fragment). Copy the
          full token from Mapbox → Account → Access tokens, redeploy Admin, then
          hard-refresh.
        </div>
      </div>
    );
  }

  return (
    <div style={ui.pageWide}>
      <div className="ll-page-head">
        <div>
          <h1>Map</h1>
          <p className="ll-page-sub">
            Green overlay = ACTIVE service city. Orange pins = Guide home
            districts. Teal = Guide places (off by default). Purple = Business
            places.
          </p>
        </div>
      </div>

      {error ? <div style={ui.alertWarn}>{error}</div> : null}
      {mapError ? <div style={ui.alertWarn}>{mapError}</div> : null}
      {data && (data.guides?.length ?? 0) === 0 ? (
        <div style={ui.alertWarn}>
          No Guide bases yet. Open Users → Guides → set a district (or reseed
          API), then refresh this map.
        </div>
      ) : null}

      <div style={styles.toolbar}>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={showGuideBases}
            onChange={(e) => setShowGuideBases(e.target.checked)}
          />
          <span className="ll-badge" style={{ background: '#ffedd5', color: '#c2410c' }}>
            Guides ({data?.guides?.length ?? '…'})
          </span>
        </label>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={showGuides}
            onChange={(e) => setShowGuides(e.target.checked)}
          />
          <span className="ll-badge" style={{ background: '#ccfbf1', color: '#0f766e' }}>
            Guide places ({data?.guidePlaces.length ?? '…'})
          </span>
        </label>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={showBusiness}
            onChange={(e) => setShowBusiness(e.target.checked)}
          />
          <span className="ll-badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>
            Business places ({data?.businessPlaces.length ?? '…'})
          </span>
        </label>
        <span className="ll-badge ll-badge--ok">
          Active zones ({data?.activeCities.filter((c) => c.zone).length ?? '…'})
        </span>
      </div>

      <div style={styles.mapShell}>
        <div ref={mapNode} style={styles.map} />
        {!data ? (
          <div style={styles.loading}>Loading map data…</div>
        ) : null}
      </div>

      {selected ? (
        <div style={{ ...ui.alert, whiteSpace: 'pre-wrap' }}>{selected}</div>
      ) : null}

      <p style={{ ...ui.muted, fontSize: '0.85rem', marginTop: '0.75rem' }}>
        Guide bases use the Admin-assigned district centroid. Guides without a
        district do not appear until you set their zone in Users.
      </p>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const styles: Record<string, CSSProperties> = {
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'center',
    margin: '1rem 0',
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    color: 'var(--ll-ink)',
  },
  mapShell: {
    position: 'relative',
    borderRadius: 'var(--ll-radius)',
    overflow: 'hidden',
    border: '1px solid var(--ll-line)',
    boxShadow: 'var(--ll-shadow)',
    background: '#e2e8f0',
    minHeight: 520,
  },
  map: {
    width: '100%',
    height: 'min(70vh, 640px)',
    minHeight: 520,
  },
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(243,246,251,0.7)',
    color: 'var(--ll-muted)',
    fontWeight: 600,
    pointerEvents: 'none',
  },
};
