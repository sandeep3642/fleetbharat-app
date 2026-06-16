export function buildTripRouteCentersPath(routePoints) {
    return (routePoints ?? [])
        .map((rp) => {
            const lat = Number.parseFloat(rp.geofenceCenterLatitude);
            const lng = Number.parseFloat(rp.geofenceCenterLongitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { latitude: lat, longitude: lng };
        })
        .filter(Boolean);
}