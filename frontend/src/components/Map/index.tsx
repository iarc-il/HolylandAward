import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { areas, qsoData } from "@/data/areas";
import { parseQSOCode } from "@/utils/mapUtils";
import { Area } from "@/types/map";

// TextOverlay class factory - creates the class after Google Maps is loaded
const createTextOverlayClass = () => {
  return class TextOverlay extends (window as any).google.maps.OverlayView {
    private position: any; // google.maps.LatLng when maps is loaded
    private text: string;
    private div: HTMLDivElement | null = null;

    constructor(position: any, text: string) {
      super();
      this.position = position;
      this.text = text;
    }

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.fontSize = "12px";
      this.div.style.fontWeight = "bold";
      this.div.style.color = "red";
      this.div.style.backgroundColor = "white";
      this.div.style.border = "1px solid black";
      this.div.style.padding = "2px";
      this.div.style.borderRadius = "3px";
      this.div.innerHTML = this.text;

      const panes = this.getPanes();
      if (panes) {
        panes.overlayLayer.appendChild(this.div);
      }
    }

    draw() {
      if (!this.div) return;

      const overlayProjection = this.getProjection();
      if (!overlayProjection) return;

      const position = overlayProjection.fromLatLngToDivPixel(this.position);
      if (position) {
        this.div.style.left = position.x + "px";
        this.div.style.top = position.y + "px";
      }
    }

    onRemove() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }
  };
};

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null); // google.maps.Map when loaded
  const [searchValue, setSearchValue] = useState("");
  const [polygons, setPolygons] = useState<any[]>([]); // google.maps.Polygon[] when loaded
  const [markers, setMarkers] = useState<any[]>([]); // google.maps.Marker[] when loaded
  const [overlays, setOverlays] = useState<any[]>([]); // TextOverlay[] when loaded
  const [gridOverlays, setGridOverlays] = useState<any[]>([]); // google.maps.Polygon[] when loaded
  const [gridLines, setGridLines] = useState<any[]>([]); // google.maps.Polyline[] when loaded
  const [TextOverlay, setTextOverlay] = useState<any>(null); // TextOverlay class when loaded
  const mapInitialized = useRef(false); // Add a ref to track initialization

  // Grid constants from original HTML
  const northLat = 33.383;
  const southLat = 29.426;
  const westLng = 34.245;
  const eastLng = 35.9682;
  const latSquareSize = (southLat - northLat) / 44;
  const lngSquareSize = (eastLng - westLng) / 16;

  // Grid utility functions from original HTML
  const getLatIndex = (lat: number) => {
    const latIndex = (lat - northLat) * (1 / latSquareSize);
    return parseInt(latIndex.toString());
  };

  const getLngIndex = (lng: number) => {
    const lngIndex = (lng - westLng) * (1 / lngSquareSize);
    return parseInt(lngIndex.toString());
  };

  const getSquareByLatLng = (lat: number, lng: number) => {
    let latProjection = getLatIndex(lat);
    let lngProjection = getLngIndex(lng);

    if (latProjection < 10) {
      latProjection = parseInt("0" + latProjection);
    }
    if (lngProjection > 7) lngProjection++;
    const lngChar = String.fromCharCode(65 + lngProjection);
    const square = lngChar + latProjection.toString().padStart(2, "0");
    return square;
  };

  // 1. Initial Map and API Loader
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      try {
        await loader.load();
        const TextOverlayClass = createTextOverlayClass();
        setTextOverlay(() => TextOverlayClass);

        if (mapRef.current) {
          const mapInstance = new (window as any).google.maps.Map(
            mapRef.current,
            {
              center: { lat: 31.5, lng: 35.0 }, // Center of Israel
              zoom: 8,
              mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
            }
          );
          setMap(mapInstance);
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    initMap();
  }, []);

  // 2. Separate useEffect to run showGrid only once
  useEffect(() => {
    // Check if the map and TextOverlay are ready AND if the grid hasn't been shown yet
    if (map && TextOverlay && !mapInitialized.current) {
      showGrid();
      mapInitialized.current = true; // Set the flag to true after the first call
    }
  }, [map, TextOverlay]);

  const clearMap = () => {
    // Clear polygons
    polygons.forEach((polygon) => polygon.setMap(null));
    setPolygons([]);

    // Clear markers
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);

    // Clear overlays
    overlays.forEach((overlay) => overlay.setMap(null));
    setOverlays([]);

    // Clear grid overlays
    gridOverlays.forEach((grid) => grid.setMap(null));
    setGridOverlays([]);

    // Clear grid lines
    gridLines.forEach((line) => line.setMap(null));
    setGridLines([]);
  };

  const showGrid = () => {
    if (!map || !TextOverlay) return;

    clearMap();
    const newGridLines: unknown[] = [];
    const newPolygons: unknown[] = [];
    const newOverlays: unknown[] = [];

    // First, add area polygons
    areas.forEach((area: Area) => {
      const polygon = new (window as any).google.maps.Polygon({
        paths: area.coords,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.0,
      });

      polygon.setMap(map);
      newPolygons.push(polygon);
    });

    // Draw horizontal grid lines (45 lines for 44 squares)
    for (let i = 0; i <= 44; i++) {
      const flightPlanCoordinates = [
        { lat: northLat + i * latSquareSize, lng: westLng },
        { lat: northLat + i * latSquareSize, lng: eastLng },
      ];

      const flightPath = new (window as any).google.maps.Polyline({
        path: flightPlanCoordinates,
        geodesic: false,
        strokeColor: "#666666",
        strokeOpacity: 0.6,
        strokeWeight: 1,
      });
      flightPath.setMap(map);
      newGridLines.push(flightPath);
    }

    // Draw vertical grid lines (17 lines for 16 squares)
    for (let i = 0; i <= 16; i++) {
      const flightPlanCoordinates = [
        { lat: northLat, lng: westLng + i * lngSquareSize },
        { lat: southLat, lng: westLng + i * lngSquareSize },
      ];

      const flightPath = new (window as any).google.maps.Polyline({
        path: flightPlanCoordinates,
        geodesic: false,
        strokeColor: "#666666",
        strokeOpacity: 0.6,
        strokeWeight: 1,
      });
      flightPath.setMap(map);
      newGridLines.push(flightPath);
    }

    // Add square labels (704 labels total)
    for (let i = 0; i < 44; i++) {
      for (let j = 0; j < 16; j++) {
        const position = {
          lat: northLat + i * latSquareSize + latSquareSize / 2,
          lng: westLng + j * lngSquareSize + lngSquareSize / 2,
        };

        const squareLabel = getSquareByLatLng(position.lat, position.lng);
        const overlay = new TextOverlay(
          new (window as any).google.maps.LatLng(position.lat, position.lng),
          squareLabel
        );

        // Apply styling similar to original
        overlay.onAdd = function () {
          this.div = document.createElement("div");
          this.div.style.position = "absolute";
          this.div.style.whiteSpace = "nowrap";
          this.div.style.transform = "translate(-50%, -50%)";
          this.div.style.pointerEvents = "none";
          this.div.style.color = "#666666";
          this.div.style.fontWeight = "bold";
          this.div.style.opacity = "0.4";
          this.div.style.fontSize = "12px";
          this.div.innerText = this.text;
          const panes = this.getPanes();
          if (panes) {
            panes.overlayLayer.appendChild(this.div);
          }
        };

        overlay.setMap(map);
        newOverlays.push(overlay);
      }
    }

    // Add area labels if areas are available
    if (areas && areas.length > 0) {
      areas.forEach((area: Area) => {
        const areaOverlay = new TextOverlay(
          new (window as any).google.maps.LatLng(
            area.center.lat,
            area.center.lng
          ),
          area.name
        );

        // Apply area label styling
        areaOverlay.onAdd = function () {
          this.div = document.createElement("div");
          this.div.style.position = "absolute";
          this.div.style.whiteSpace = "nowrap";
          this.div.style.transform = "translate(-50%, -50%)";
          this.div.style.pointerEvents = "none";
          this.div.style.color = "#FF0055";
          this.div.style.fontWeight = "bold";
          this.div.style.opacity = "0.4";
          this.div.style.fontSize = "16px";
          this.div.innerText = this.text;
          const panes = this.getPanes();
          if (panes) {
            panes.overlayLayer.appendChild(this.div);
          }
        };

        areaOverlay.setMap(map);
        newOverlays.push(areaOverlay);
      });
    }

    setGridLines(newGridLines);
    setPolygons(newPolygons);
    setOverlays(newOverlays);
  };

  const showAreas = () => {
    if (!map || !TextOverlay) return;

    clearMap();
    const newPolygons: unknown[] = []; // google.maps.Polygon[] when loaded

    areas.forEach((area: Area) => {
      const polygon = new (window as any).google.maps.Polygon({
        paths: area.coords,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
      });

      polygon.setMap(map);
      newPolygons.push(polygon);

      // Add area label
      const overlay = new TextOverlay(
        new (window as any).google.maps.LatLng(
          area.center.lat,
          area.center.lng
        ),
        area.name
      );
      overlay.setMap(map);
      setOverlays((prev) => [...prev, overlay]);
    });

    setPolygons(newPolygons);
  };

  const showMissingSquares = () => {
    if (!map || !TextOverlay) return;

    clearMap();
    const newGridOverlays: unknown[] = []; // google.maps.Polygon[] when loaded

    const workedSquares = new Set(
      qsoData.map((qso: { area: string }) => qso.area.substring(0, 3))
    ); // Extract square part

    // Generate all possible squares in Israel area
    for (let lat = 29.5; lat <= 33.5; lat += 1 / 24) {
      for (let lng = 34.0; lng <= 36.0; lng += 1 / 12) {
        const square = getSquareByLatLng(lat, lng);

        if (!workedSquares.has(square)) {
          const bounds = [
            { lat: lat, lng: lng },
            { lat: lat + 1 / 24, lng: lng },
            { lat: lat + 1 / 24, lng: lng + 1 / 12 },
            { lat: lat, lng: lng + 1 / 12 },
          ];

          const polygon = new (window as any).google.maps.Polygon({
            paths: bounds,
            strokeColor: "#0000FF",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#0000FF",
            fillOpacity: 0.2,
          });

          polygon.setMap(map);
          newGridOverlays.push(polygon);

          // Add square label
          const overlay = new TextOverlay(
            new (window as any).google.maps.LatLng(lat + 1 / 48, lng + 1 / 24),
            square
          );
          overlay.setMap(map);
          setOverlays((prev) => [...prev, overlay]);
        }
      }
    }

    setGridOverlays(newGridOverlays);
  };

  const showWorkedSquares = () => {
    if (!map) return;

    clearMap();
    const newMarkers: unknown[] = []; // google.maps.Marker[] when loaded
    const newGridOverlays: unknown[] = []; // google.maps.Polygon[] when loaded

    // For now, just show the worked areas as grid overlays since we don't have exact coordinates
    qsoData.forEach((qso: { area: string }) => {
      const square = qso.area.substring(0, 3); // Extract square part (e.g., "A10" from "A10TA")

      // We would need to convert square back to coordinates to show markers
      // For now, just show a message
      console.log(`Worked square: ${square} from area: ${qso.area}`);
    });

    setMarkers(newMarkers);
    setGridOverlays(newGridOverlays);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-3xl font-bold mb-4">Holyland Contest Map</h1>
      </div>

      <div className="flex-1">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Map;
