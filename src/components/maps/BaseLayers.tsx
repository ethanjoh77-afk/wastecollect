import { LayerGroup, LayersControl, TileLayer } from 'react-leaflet';

/**
 * Picha za chini za ramani, zenye kitufe cha kubadili:
 *  - Satelaiti + majina (chaguo-msingi): nyumba na barabara zinaonekana wazi
 *  - Satelaiti peke yake
 *  - Ramani ya kawaida (OpenStreetMap)
 *
 * Kama VITE_MAPBOX_TOKEN imewekwa, Mapbox "satellite-streets" inaongezwa kama chaguo bora zaidi.
 * Bila token, Esri World Imagery inatumika (haihitaji key).
 */
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const ESRI_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTR = 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics, GIS User Community';

export function BaseLayers() {
  return (
    <LayersControl position="topright">
      {MAPBOX_TOKEN && (
        <LayersControl.BaseLayer checked name="Satelaiti + barabara (Mapbox)">
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; OpenStreetMap'
            url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
      )}

      <LayersControl.BaseLayer checked={!MAPBOX_TOKEN} name="Satelaiti + majina">
        <LayerGroup>
          <TileLayer attribution={ESRI_ATTR} url={ESRI_IMAGERY} maxNativeZoom={18} maxZoom={20} />
          <TileLayer url={ESRI_LABELS} maxNativeZoom={18} maxZoom={20} />
        </LayerGroup>
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Satelaiti">
        <TileLayer attribution={ESRI_ATTR} url={ESRI_IMAGERY} maxNativeZoom={18} maxZoom={20} />
      </LayersControl.BaseLayer>

      <LayersControl.BaseLayer name="Ramani ya kawaida">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={20}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}
