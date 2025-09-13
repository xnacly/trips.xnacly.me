// the token only works for trips.xnacly.me, don't bother
const MAPBOXTOKEN = "pk.eyJ1IjoieG5hY2x5IiwiYSI6ImNtZmlwc3JnNTBuN2Yya3NhYTZyNnNsMnMifQ.ioj5_trA4_KOF1Mat5OeeA";

function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function toGeoJson(rawJson) {
    let geo = {
        "type": "FeatureCollection",
        "features": [],
    };

    for (const trip of rawJson) {
        let color = randomColor();
        geo.features.push({
            type: "Feature",
            properties: {
                id: trip.name,
                name: trip.name,
                color,
            },
            geometry: {
                type: "LineString",
                coordinates: trip.stops.map((stop) => [stop.long, stop.lat])
            }
        });

        geo.features = [
            ...geo.features,
            ...trip.stops.map((stop, idx) => {
                return {
                    type: "Feature",
                    properties: { stop: idx, color },
                    geometry: { type: "Point", coordinates: [stop.long, stop.lat] }
                };
            }),
        ]
    }

    console.log(geo);

    return geo;
}

function prepareMap() {
    mapboxgl.accessToken = MAPBOXTOKEN;

    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [13.39525, 52.51674],
        zoom: 4
    });


    return map
}

function createMapEvents(map) {
    map.addLayer({
        id: "trip-route",
        type: "line",
        source: "trip",
        filter: ["==", "$type", "LineString"],
        paint: {
            "line-color": ["get", "color"],
            "line-width": 3
        }
    });

    map.addLayer({
        id: "trip-stops",
        type: "circle",
        source: "trip",
        filter: ["==", "$type", "Point"],
        paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 6,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff"
        }
    });


    map.on("click", "trip-stops", (e) => {
        const coords = e.features[0].geometry.coordinates.slice();
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(`<strong>Stop ${props.stop}</strong><br>${props.name || ""}`)
            .addTo(map);
    });

    map.on("mouseenter", "trip-stops", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "trip-stops", () => {
        map.getCanvas().style.cursor = "";
    });

}

const map = prepareMap();
map.on("load", async () => {
    const response = await fetch("trips.json");
    const rawJson = await response.json();
    const jsonAsGeoJSON = toGeoJson(rawJson);

    map.addSource("trip", {
        type: "geojson",
        data: jsonAsGeoJSON
    });

    createMapEvents(map);
});
