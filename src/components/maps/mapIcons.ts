import L from "leaflet";

import redMarker from "./icons/marker-red.png";
import yellowMarker from "./icons/marker-yellow.png";
import greenMarker from "./icons/marker-green.png";
import shadow from "./icons/marker-shadow.png";

const iconSize: [number, number] = [25, 41];
const iconAnchor: [number, number] = [12, 41];
const popupAnchor: [number, number] = [1, -34];
const shadowSize: [number, number] = [41, 41];

export const redIcon = new L.Icon({
  iconUrl: redMarker,
  shadowUrl: shadow,
  iconSize,
  iconAnchor,
  popupAnchor,
  shadowSize,
});

export const yellowIcon = new L.Icon({
  iconUrl: yellowMarker,
  shadowUrl: shadow,
  iconSize,
  iconAnchor,
  popupAnchor,
  shadowSize,
});

export const greenIcon = new L.Icon({
  iconUrl: greenMarker,
  shadowUrl: shadow,
  iconSize,
  iconAnchor,
  popupAnchor,
  shadowSize,
});

export function getStatusIcon(status: string) {
  switch (status) {
    case "resolved":
      return greenIcon;

    case "in_progress":
      return yellowIcon;

    case "pending":
    default:
      return redIcon;
  }
}