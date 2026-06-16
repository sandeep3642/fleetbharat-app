export function decodePolylineToPath(encodedPolyline) {
    const encoded = String(encodedPolyline || '').trim();
    if (!encoded) return [];

    let index = 0;
    let lat = 0;
    let lng = 0;
    const path = [];

    while (index < encoded.length) {
        let result = 0;
        let shift = 0;
        let byte = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20 && index < encoded.length + 1);

        lat += result & 1 ? ~(result >> 1) : result >> 1;

        result = 0;
        shift = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20 && index < encoded.length + 1);

        lng += result & 1 ? ~(result >> 1) : result >> 1;

        path.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return path;
}