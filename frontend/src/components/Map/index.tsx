import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { areas, qsoData } from "@/data/areas";
import { getSquareByLatLng, parseQSOCode } from "@/utils/mapUtils";
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
  const [TextOverlay, setTextOverlay] = useState<any>(null); // TextOverlay class when loaded

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      try {
        await loader.load();

        // Create TextOverlay class after Google Maps is loaded
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

  const searchLocation = () => {
    if (!map || !searchValue.trim()) return;

    const geocoder = new (window as any).google.maps.Geocoder();

    // Try to parse as coordinates first (lat, lng format)
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const coordMatch = searchValue.trim().match(coordPattern);

    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      const position = new (window as any).google.maps.LatLng(lat, lng);
      map.setCenter(position);
      map.setZoom(15);

      // Add marker
      const marker = new (window as any).google.maps.Marker({
        position: position,
        map: map,
        title: `${lat}, ${lng}`,
      });

      setMarkers((prev) => [...prev, marker]);
      return;
    }

    // Try to parse as QSO code
    const qsoCoords = parseQSOCode(searchValue.trim());
    if (qsoCoords) {
      // For now, just show a message since we need to implement the conversion
      alert(`QSO Code parsed: ${JSON.stringify(qsoCoords)}`);
      return;
    }

    // Fallback to geocoding
    geocoder.geocode(
      { address: searchValue },
      (results: unknown, status: string) => {
        if (status === "OK" && Array.isArray(results) && results[0]) {
          const result = results[0] as any;
          map.setCenter(result.geometry.location);
          map.setZoom(15);

          // Add marker
          const marker = new (window as any).google.maps.Marker({
            position: result.geometry.location,
            map: map,
            title: searchValue,
          });

          setMarkers((prev) => [...prev, marker]);
        } else {
          alert("Location not found: " + status);
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchLocation();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-3xl font-bold mb-4">Holyland Contest Map</h1>

        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search location, coordinates, or QSO locator..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={searchLocation}>Search</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={showAreas} variant="outline">
            Show Areas
          </Button>
          <Button onClick={showWorkedSquares} variant="outline">
            Show Worked Squares
          </Button>
          <Button onClick={showMissingSquares} variant="outline">
            Show Missing Squares
          </Button>
          <Button onClick={clearMap} variant="outline">
            Clear Map
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Map;
