/**
 * Build geofence overlays (circles & polygons) for React Native Maps
 * Converts route points to circle/polygon coordinates
 */

export function buildTripRouteOverlays(routePoints) {
    if (!routePoints || routePoints.length === 0) return [];

    return routePoints
        .map((rp) => {
            const center = {
                latitude: parseFloat(rp.geofenceCenterLatitude),
                longitude: parseFloat(rp.geofenceCenterLongitude),
            };

            // Skip invalid coordinates
            if (!isFinite(center.latitude) || !isFinite(center.longitude)) {
                return null;
            }

            // Check if polygon geofence
            const geofenceType = String(rp.geofenceType || '').toUpperCase();
            if (geofenceType === 'POLYGON') {
                const paths = (rp.geofenceDetails || [])
                    .map((point) => ({
                        latitude: parseFloat(point.latitude),
                        longitude: parseFloat(point.longitude),
                    }))
                    .filter((point) => isFinite(point.latitude) && isFinite(point.longitude));

                if (paths.length > 0) {
                    return {
                        key: `${rp.sequence}-${rp.geofenceId}`,
                        geometry: 'polygon',
                        center,
                        paths,
                    };
                }
            }

            // Default to circle
            const radius = Math.max(1, parseFloat(rp.geofenceRadius) || 100);
            return {
                key: `${rp.sequence}-${rp.geofenceId}`,
                geometry: 'circle',
                center,
                radiusM: radius,
            };
        })
        .filter((overlay) => overlay !== null);
}

export function buildTripRouteCentersPath(routePoints) {
    return buildTripRouteOverlays(routePoints).map((overlay) => overlay.center);
}

/**
 * Generate points around a circle for approximate polygon rendering
 * Useful for displaying circle geofences on map
 */
function buildCirclePolygonPath(center, radiusMeters, segments = 36) {
    const earthRadius = 6378137;
    const latRad = (center.latitude * Math.PI) / 180;
    const lngRad = (center.longitude * Math.PI) / 180;
    const angularDistance = radiusMeters / earthRadius;
    const points = [];

    for (let i = 0; i < segments; i++) {
        const bearing = (2 * Math.PI * i) / segments;
        const sinLat = Math.sin(latRad);
        const cosLat = Math.cos(latRad);
        const sinAd = Math.sin(angularDistance);
        const cosAd = Math.cos(angularDistance);

        const pointLat = Math.asin(
            sinLat * cosAd + cosLat * sinAd * Math.cos(bearing)
        );
        const pointLng =
            lngRad +
            Math.atan2(
                Math.sin(bearing) * sinAd * cosLat,
                cosAd - sinLat * Math.sin(pointLat)
            );

        points.push({
            latitude: (pointLat * 180) / Math.PI,
            longitude: (pointLng * 180) / Math.PI,
        });
    }

    return points;
}