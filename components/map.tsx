"use client";

import { useMemo } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
    lat: number;
    lng: number;
}

// Generate a GeoJSON circle polygon (~500m radius) without external dependencies
function createCircleGeoJSON(lat: number, lng: number, radiusKm = 0.5, points = 64) {
    const coords: [number, number][] = [];
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dx = radiusKm * Math.cos(angle);
        const dy = radiusKm * Math.sin(angle);
        const newLat = lat + dy / 111.32;
        const newLng = lng + dx / (111.32 * Math.cos((lat * Math.PI) / 180));
        coords.push([newLng, newLat]);
    }
    coords.push(coords[0]); // Close the polygon

    return {
        type: "FeatureCollection" as const,
        features: [
            {
                type: "Feature" as const,
                geometry: {
                    type: "Polygon" as const,
                    coordinates: [coords],
                },
                properties: {},
            },
        ],
    };
}

export default function PropertyMap({ lat, lng }: MapProps) {
    // Default to Tripoli if no coords
    const latitude = lat || 32.8872;
    const longitude = lng || 13.1913;

    const circleData = useMemo(
        () => createCircleGeoJSON(latitude, longitude, 0.5),
        [latitude, longitude]
    );

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden z-0 relative">
            <Map
                initialViewState={{
                    latitude,
                    longitude,
                    zoom: 13,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                mapLib={maplibregl}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {lat && lng && (
                    <Source id="privacy-circle" type="geojson" data={circleData}>
                        {/* Fill */}
                        <Layer
                            id="privacy-circle-fill"
                            type="fill"
                            paint={{
                                "fill-color": "#134e4a",
                                "fill-opacity": 0.12,
                            }}
                        />
                        {/* Border */}
                        <Layer
                            id="privacy-circle-border"
                            type="line"
                            paint={{
                                "line-color": "#134e4a",
                                "line-width": 2,
                                "line-opacity": 0.4,
                            }}
                        />
                    </Source>
                )}
            </Map>

            {/* Privacy caption overlay */}
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                <div className="inline-block bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 font-medium">
                        يتم توفير الموقع الدقيق بعد تأكيد الحجز
                    </p>
                </div>
            </div>
        </div>
    );
}
