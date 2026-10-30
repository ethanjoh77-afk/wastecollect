/**
 * Street View ya Google kupitia kiungo rasmi cha Maps URLs:
 * haihitaji API key wala malipo — inafungua picha za barabarani kwenye eneo hilo (kama zipo).
 */
export function streetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

/** Kufungua eneo kwenye Google Maps (kuelekezwa/navigation). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
