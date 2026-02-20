"use client";

import { useEffect, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Maximize2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Libyan cities coordinates [lng, lat] - MapLibre uses [lng, lat] order!
const CITY_COORDINATES: Record<string, [number, number]> = {
    "طرابلس (Tripoli)": [13.1913, 32.8872],
    "بنغازي (Benghazi)": [20.0869, 32.1191],
    "مصراتة (Misrata)": [15.0919, 32.3754],
    "الزاوية (Zawiya)": [12.7278, 32.7571],
    "الخمس (Khoms)": [14.2614, 32.6489],
    "زليتن (Zliten)": [14.5687, 32.4674],
    "غريان (Gharyan)": [13.0167, 32.1667],
    "البيضاء (Bayda)": [21.7556, 32.7667],
    "طبرق (Tobruk)": [23.9590, 32.0840],
    "سبها (Sabha)": [14.4283, 27.0377],
};

interface LocationPickerProps {
    selectedCity: string;
    onLocationChange: (lat: number, lng: number) => void;
    initialLat?: number;
    initialLng?: number;
}

export default function LocationPicker({
    selectedCity,
    onLocationChange,
    initialLat = 32.8872,
    initialLng = 13.1913,
}: LocationPickerProps) {
    const previewMapRef = useRef<any>(null);
    const fullscreenMapRef = useRef<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    // Current saved coordinates (shown in preview)
    const [viewState, setViewState] = useState({
        longitude: initialLng,
        latitude: initialLat,
        zoom: 12,
    });

    // Temporary coordinates during fullscreen editing
    const [tempViewState, setTempViewState] = useState({
        longitude: initialLng,
        latitude: initialLat,
        zoom: 12,
    });

    // Enable RTL text plugin for proper Arabic rendering
    useEffect(() => {
        if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
            maplibregl.setRTLTextPlugin(
                "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
                false
            );
        }
    }, []);

    // Sync map to selected city
    useEffect(() => {
        if (selectedCity && CITY_COORDINATES[selectedCity]) {
            const [lng, lat] = CITY_COORDINATES[selectedCity];

            // Update both view states
            const newState = { longitude: lng, latitude: lat, zoom: 12 };
            setViewState(newState);
            setTempViewState(newState);

            // Fly preview map to city
            if (previewMapRef.current) {
                previewMapRef.current.flyTo({
                    center: [lng, lat],
                    zoom: 12,
                    duration: 1500,
                });
            }

            // Notify parent
            onLocationChange(lat, lng);
        }
    }, [selectedCity]);

    // Handle opening fullscreen mode
    const handleOpenFullscreen = () => {
        // Sync temp state with current state
        setTempViewState(viewState);
        setIsFullscreen(true);
    };

    // Handle confirming location in fullscreen
    const handleConfirm = () => {
        // Save temp coordinates to actual state
        setViewState(tempViewState);

        // Notify parent
        onLocationChange(tempViewState.latitude, tempViewState.longitude);

        // Close fullscreen
        setIsFullscreen(false);
    };

    // Handle closing without saving
    const handleCancel = () => {
        // Revert temp state
        setTempViewState(viewState);
        setIsFullscreen(false);
    };

    // Force Arabic labels on map load
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
    };

    return (
        <>
            {/* PREVIEW MODE - Inline in Form */}
            <div className="relative">
                {/* Preview Map Container - Rounded & Polished */}
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-md">
                    <Map
                        ref={previewMapRef}
                        {...viewState}
                        onMove={(evt) => setViewState(evt.viewState)}
                        onLoad={onMapLoad}
                        style={{ width: "100%", height: "240px" }}
                        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                        attributionControl={false}
                        dragPan={false} // Read-only in preview
                        scrollZoom={false}
                        touchZoomRotate={false}
                        doubleClickZoom={false}
                        interactive={false}
                    />

                    {/* Fixed Center Pin */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 48 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-2xl"
                            style={{ marginBottom: "20px" }}
                        >
                            <path
                                d="M24 0C16.268 0 10 6.268 10 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z"
                                fill="#134e4a"
                            />
                            <circle cx="24" cy="14" r="6" fill="white" />
                            <circle cx="24" cy="14" r="3.5" fill="#f97316" />
                        </svg>
                    </div>

                    {/* Expand Button - Overlays the map */}
                    <button
                        type="button"
                        onClick={handleOpenFullscreen}
                        className="absolute inset-0 w-full h-full bg-black/0 hover:bg-black/5 transition-colors cursor-pointer z-20"
                    >
                        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-200 hover:border-primary hover:shadow-xl transition-all">
                            <Maximize2 className="h-4 w-4 text-gray-700" />
                            <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                                تعديل الموقع
                            </span>
                            <span className="text-sm font-medium text-gray-900 sm:hidden">
                                انقر لضبط الموقع
                            </span>
                        </div>
                    </button>
                </div>

                {/* Coordinates Display - Desktop Only */}
                <div className="hidden md:block text-xs text-neutral-400 font-mono text-right mt-2">
                    Lat: {viewState.latitude.toFixed(6)} | Lng: {viewState.longitude.toFixed(6)}
                </div>
            </div>

            {/* FULLSCREEN MODE - Modal Overlay */}
            {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
                        {/* Close Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="gap-2"
                        >
                            <X className="h-4 w-4" />
                            <span>إلغاء</span>
                        </Button>

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-gray-900">حدد الموقع</h2>

                        {/* Confirm Button */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleConfirm}
                            className="gap-2 bg-primary hover:bg-primary/90"
                        >
                            <Check className="h-4 w-4" />
                            <span>تأكيد</span>
                        </Button>
                    </div>

                    {/* Fullscreen Map */}
                    <div className="flex-1 relative">
                        <Map
                            ref={fullscreenMapRef}
                            {...tempViewState}
                            onMove={(evt) => setTempViewState(evt.viewState)}
                            onMoveStart={() => setIsMoving(true)}
                            onMoveEnd={() => setIsMoving(false)}
                            onLoad={onMapLoad}
                            style={{ width: "100%", height: "100%" }}
                            mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
                            attributionControl={false}
                            dragPan={true}
                            touchZoomRotate={true}
                            scrollZoom={true}
                            doubleClickZoom={true}
                        />

                        {/* Fixed Center Pin */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div
                                className={`transition-transform duration-200 ${
                                    isMoving ? "scale-110 -translate-y-2" : "scale-100 translate-y-0"
                                }`}
                            >
                                <svg
                                    width="56"
                                    height="56"
                                    viewBox="0 0 48 48"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="drop-shadow-2xl"
                                    style={{ marginBottom: "28px" }}
                                >
                                    <path
                                        d="M24 0C16.268 0 10 6.268 10 14c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z"
                                        fill="#134e4a"
                                    />
                                    <circle cx="24" cy="14" r="6" fill="white" />
                                    <circle cx="24" cy="14" r="3.5" fill="#f97316" />
                                </svg>
                            </div>
                        </div>

                        {/* Instruction Pill - Bottom Center */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                            <div className="bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-700" />
                                <span className="text-sm font-medium text-gray-900">اسحب الخريطة لضبط الموقع</span>
                            </div>
                        </div>

                        {/* Coordinates Display - Bottom Left */}
                        <div className="absolute bottom-6 left-4 z-20 pointer-events-none">
                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-mono text-gray-700">
                                {tempViewState.latitude.toFixed(5)}, {tempViewState.longitude.toFixed(5)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
