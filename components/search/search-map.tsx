"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Property {
    id: string;
    title: string;
    price_per_night: number;
    location_lat: number;
    location_lng: number;
}

interface SearchMapProps {
    properties: Property[];
    hoveredPropertyId: string | null;
    onPropertyClick: (id: string) => void;
}

export default function SearchMap({ properties, hoveredPropertyId, onPropertyClick }: SearchMapProps) {
    const mapRef = useRef<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Enable RTL text plugin for proper Arabic rendering
    useEffect(() => {
        if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
            maplibregl.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
                false
            );
        }
    }, []);

    // Default center: Tripoli
    const defaultCenter = { lat: 32.8872, lng: 13.1913 };

    // Fit map bounds to show all properties when they change
    const fitToProperties = useCallback(() => {
        const map = mapRef.current;
        if (!map || !mapLoaded) return;

        if (properties.length === 0) {
            map.flyTo({
                center: [defaultCenter.lng, defaultCenter.lat],
                zoom: 11,
                duration: 1000,
            });
            return;
        }

        if (properties.length === 1) {
            map.flyTo({
                center: [properties[0].location_lng, properties[0].location_lat],
                zoom: 13,
                duration: 1000,
            });
            return;
        }

        // Calculate bounds for multiple properties
        const bounds = new maplibregl.LngLatBounds();
        properties.forEach((p) => {
            bounds.extend([p.location_lng, p.location_lat]);
        });
        map.fitBounds(bounds, {
            padding: 60,
            duration: 1000,
            maxZoom: 14,
        });
    }, [properties, mapLoaded]);

    useEffect(() => {
        fitToProperties();
    }, [fitToProperties]);

    const onMapLoad = (e: any) => {
        const map = e.target;
        const style = map.getStyle();

        if (style && style.layers) {
            style.layers.forEach((layer: any) => {
                if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
                    try {
                        map.setLayoutProperty(layer.id, "text-field", [
                            "coalesce",
                            ["get", "name:ar"],
                            ["get", "name_ar"],
                            ["get", "name"],
                            ["get", "name_en"],
                        ]);
                    } catch (error) {
                        console.debug(`Could not set Arabic text for layer ${layer.id}`);
                    }
                }
            });
        }
        setMapLoaded(true);
    };

    return (
        <div className="h-full w-full relative">
            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: defaultCenter.lat,
                    longitude: defaultCenter.lng,
                    zoom: 11,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                onLoad={onMapLoad}
            >
                {mapLoaded && properties.map((property) => {
                    const isHovered = hoveredPropertyId === property.id;
                    return (
                        <Marker
                            key={property.id}
                            latitude={property.location_lat}
                            longitude={property.location_lng}
                            anchor="bottom"
                        >
                            <button
                                onClick={() => onPropertyClick(property.id)}
                                className={`
                                    px-3 py-1.5 rounded-full font-bold text-sm shadow-lg transition-all
                                    ${isHovered
                                        ? 'bg-primary text-white scale-110 z-10'
                                        : 'bg-white text-gray-900 hover:scale-105'
                                    }
                                `}
                                style={{
                                    position: 'relative',
                                    zIndex: isHovered ? 10 : 1,
                                }}
                            >
                                {property.price_per_night} د.ل
                            </button>
                        </Marker>
                    );
                })}
            </Map>
        </div>
    );
}
