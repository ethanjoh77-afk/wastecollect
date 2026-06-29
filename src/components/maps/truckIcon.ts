import L from "leaflet";

import truck from "./icons/truck.png";

export const truckIcon = new L.Icon({
  iconUrl: truck,

  iconSize: [42, 42],

  iconAnchor: [21, 42],

  popupAnchor: [0, -40],
});