import React, { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

import { areas, qsoData } from "@/data/areas";
import { Area } from "@/types/map";
import { useUserAreasAndRegions } from "@/api/useUserAreasAndRegions";
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
  const polygonsRef = useRef<any[]>([]); // google.maps.Polygon[] when loaded
  const markersRef = useRef<any[]>([]); // google.maps.Marker[] when loaded
  const overlaysRef = useRef<any[]>([]); // TextOverlay[] when loaded
  const gridOverlaysRef = useRef<any[]>([]); // google.maps.Polygon[] when loaded
  const gridLinesRef = useRef<any[]>([]); // google.maps.Polyline[] when loaded
  const [TextOverlay, setTextOverlay] = useState<any>(null); // TextOverlay class when loaded
  const mapInitialized = useRef(false); // Add a ref to track initialization

  const {
    data: { areas: userAreas } = {},
    isLoading,
    isError,
  } = useUserAreasAndRegions();

  // Grid constants from original HTML
  const northLat = 33.383;
  const southLat = 29.426;
  const westLng = 34.245;
  const eastLng = 35.9682;
  const latSquareSize = (southLat - northLat) / 44;
  const lngSquareSize = (eastLng - westLng) / 16;

  // Grid utility functions from original HTML
  const getLatIndex = useCallback(
    (lat: number) => {
      const latIndex = (lat - northLat) * (1 / latSquareSize);
      return parseInt(latIndex.toString());
    },
    [latSquareSize]
  );

  const getLngIndex = useCallback(
    (lng: number) => {
      const lngIndex = (lng - westLng) * (1 / lngSquareSize);
      return parseInt(lngIndex.toString());
    },
    [lngSquareSize]
  );

  const getSquareByLatLng = useCallback(
    (lat: number, lng: number) => {
      let latProjection = getLatIndex(lat);
      let lngProjection = getLngIndex(lng);

      if (latProjection < 10) {
        latProjection = parseInt("0" + latProjection);
      }
      if (lngProjection > 7) lngProjection++;
      const lngChar = String.fromCharCode(65 + lngProjection);
      const square = lngChar + latProjection.toString().padStart(2, "0");
      return square;
    },
    [getLatIndex, getLngIndex]
  );

  const clearMap = useCallback(() => {
    // Clear polygons
    polygonsRef.current.forEach((polygon: any) => polygon.setMap(null));
    polygonsRef.current = [];

    // Clear markers
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    // Clear overlays
    overlaysRef.current.forEach((overlay: any) => overlay.setMap(null));
    overlaysRef.current = [];

    // Clear grid overlays
    gridOverlaysRef.current.forEach((grid: any) => grid.setMap(null));
    gridOverlaysRef.current = [];

    // Clear grid lines
    gridLinesRef.current.forEach((line: any) => line.setMap(null));
    gridLinesRef.current = [];
  }, []);

  // Helper function to check if a point is inside a polygon using Google Maps geometry
  const isPointInPolygon = useCallback((point: any, polygon: any) => {
    if (!(window as any).google?.maps?.geometry?.poly) {
      return false;
    }
    return (window as any).google.maps.geometry.poly.containsLocation(
      point,
      polygon
    );
  }, []);

  // Point-in-polygon test using ray casting algorithm
  const pointInPolygon = useCallback(
    (
      point: { lat: number; lng: number },
      polygon: { lat: number; lng: number }[]
    ) => {
      let inside = false;
      const x = point.lng;
      const y = point.lat;

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    },
    []
  );

  // Line intersection helper
  const getLineIntersection = useCallback(
    (
      p1: { lat: number; lng: number },
      p2: { lat: number; lng: number },
      p3: { lat: number; lng: number },
      p4: { lat: number; lng: number }
    ) => {
      const x1 = p1.lng,
        y1 = p1.lat;
      const x2 = p2.lng,
        y2 = p2.lat;
      const x3 = p3.lng,
        y3 = p3.lat;
      const x4 = p4.lng,
        y4 = p4.lat;

      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          lat: y1 + t * (y2 - y1),
          lng: x1 + t * (x2 - x1),
        };
      }
      return null;
    },
    []
  );

  // Simple polygon intersection using Sutherland-Hodgman clipping
  const getPolygonIntersection = useCallback(
    (
      subjectPoly: { lat: number; lng: number }[],
      clipPoly: { lat: number; lng: number }[]
    ) => {
      let outputList = [...subjectPoly];

      for (let i = 0; i < clipPoly.length; i++) {
        if (outputList.length === 0) break;

        const clipVertex1 = clipPoly[i];
        const clipVertex2 = clipPoly[(i + 1) % clipPoly.length];

        const inputList = [...outputList];
        outputList = [];

        if (inputList.length === 0) continue;

        let s = inputList[inputList.length - 1];

        for (const e of inputList) {
          // Check if point e is inside the clipping edge
          const cross1 =
            (clipVertex2.lng - clipVertex1.lng) * (e.lat - clipVertex1.lat) -
            (clipVertex2.lat - clipVertex1.lat) * (e.lng - clipVertex1.lng);
          const cross2 =
            (clipVertex2.lng - clipVertex1.lng) * (s.lat - clipVertex1.lat) -
            (clipVertex2.lat - clipVertex1.lat) * (s.lng - clipVertex1.lng);

          if (cross1 >= 0) {
            // e is inside
            if (cross2 < 0) {
              // s is outside, e is inside
              const intersection = getLineIntersection(
                s,
                e,
                clipVertex1,
                clipVertex2
              );
              if (intersection) outputList.push(intersection);
            }
            outputList.push(e);
          } else if (cross2 >= 0) {
            // s is inside, e is outside
            const intersection = getLineIntersection(
              s,
              e,
              clipVertex1,
              clipVertex2
            );
            if (intersection) outputList.push(intersection);
          }
          s = e;
        }
      }

      return outputList;
    },
    [getLineIntersection]
  );

  // Parse area code to extract square and area info - from original HTML
  const parseCode = useCallback((code: string): [number, number, Area] => {
    const match = code.match(/^([A-Z])(\d\d)([A-Z]{2})$/);
    if (!match) {
      throw new Error("Invalid format");
    }

    const [, letter, numberStr, suffix] = match;

    // Alphabet index (skipping 'I')
    const alphabet = "ABCDEFGHJKLMNOPQRSTUVWXYZ"; // Note: 'I' is skipped
    const letterIndex = alphabet.indexOf(letter.toUpperCase());
    if (letterIndex === -1) {
      throw new Error("Invalid letter (possibly 'I')");
    }

    // Parse number
    const numberIndex = parseInt(numberStr, 10);

    // Find suffix in the area list by name
    const matchedArea = areas.find(
      (area) => area.name.toUpperCase() === suffix.toUpperCase()
    );
    if (!matchedArea) {
      throw new Error("Suffix not found in area list");
    }

    return [numberIndex, letterIndex, matchedArea];
  }, []);

  // Paint square by code - with fallback approach
  const paintSquareByCode = useCallback(
    (code: string) => {
      if (!map) return false;

      try {
        const [latProjection, lngProjection, areaData] = parseCode(code);

        // Calculate square bounds
        const northLatSquare = northLat + (latProjection + 1) * latSquareSize;
        const southLatSquare = northLat + latProjection * latSquareSize;
        const westLngSquare = westLng + lngProjection * lngSquareSize;
        const eastLngSquare = westLng + (lngProjection + 1) * lngSquareSize;

        // Create area polygon for Google Maps
        const areaPath = areaData.coords.map((coord: any) => ({
          lat: coord.lat,
          lng: coord.lng,
        }));
        const areaPolygon = new (window as any).google.maps.Polygon({
          paths: areaPath,
        });

        // Check if square corners are inside the area
        const corners = [
          { lat: northLatSquare, lng: westLngSquare },
          { lat: northLatSquare, lng: eastLngSquare },
          { lat: southLatSquare, lng: eastLngSquare },
          { lat: southLatSquare, lng: westLngSquare },
        ];

        const cornersInside = corners.map((corner) =>
          (window as any).google.maps.geometry.poly.containsLocation(
            new (window as any).google.maps.LatLng(corner.lat, corner.lng),
            areaPolygon
          )
        );

        // If all corners are inside, draw the full square
        if (cornersInside.every((inside) => inside)) {
          const squarePolygon = new (window as any).google.maps.Polygon({
            paths: corners,
            strokeColor: "#00FF00",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            fillColor: "#00FF00",
            fillOpacity: 0.3,
            zIndex: 999,
          });
          squarePolygon.setMap(map);
          gridOverlaysRef.current.push(squarePolygon);
          return true;
        }

        // If no corners are inside, check if there's any intersection by sampling points
        if (!cornersInside.some((inside) => inside)) {
          // Sample points within the square to check for intersection
          let hasIntersection = false;
          const sampleCount = 5; // 5x5 grid
          for (let i = 0; i < sampleCount && !hasIntersection; i++) {
            for (let j = 0; j < sampleCount && !hasIntersection; j++) {
              const lat =
                southLatSquare +
                (i / (sampleCount - 1)) * (northLatSquare - southLatSquare);
              const lng =
                westLngSquare +
                (j / (sampleCount - 1)) * (eastLngSquare - westLngSquare);
              const point = new (window as any).google.maps.LatLng(lat, lng);
              if (
                (window as any).google.maps.geometry.poly.containsLocation(
                  point,
                  areaPolygon
                )
              ) {
                hasIntersection = true;
              }
            }
          }

          if (!hasIntersection) {
            console.log("No intersection found for", code);
            return false;
          }
        }

        // For partial intersection, create a fine grid within the square and only draw cells that are inside the area
        const gridSize = 10; // 10x10 grid for fine resolution
        const latStep = (northLatSquare - southLatSquare) / gridSize;
        const lngStep = (eastLngSquare - westLngSquare) / gridSize;

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const cellSouthLat = southLatSquare + i * latStep;
            const cellNorthLat = southLatSquare + (i + 1) * latStep;
            const cellWestLng = westLngSquare + j * lngStep;
            const cellEastLng = westLngSquare + (j + 1) * lngStep;

            // Check if the center of this cell is inside the area
            const centerLat = (cellNorthLat + cellSouthLat) / 2;
            const centerLng = (cellEastLng + cellWestLng) / 2;
            const centerPoint = new (window as any).google.maps.LatLng(
              centerLat,
              centerLng
            );

            if (
              (window as any).google.maps.geometry.poly.containsLocation(
                centerPoint,
                areaPolygon
              )
            ) {
              // This cell is inside the area, draw it
              const cellCorners = [
                { lat: cellNorthLat, lng: cellWestLng },
                { lat: cellNorthLat, lng: cellEastLng },
                { lat: cellSouthLat, lng: cellEastLng },
                { lat: cellSouthLat, lng: cellWestLng },
              ];

              const cellPolygon = new (window as any).google.maps.Polygon({
                paths: cellCorners,
                strokeColor: "#00FF00",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                fillColor: "#00FF00",
                fillOpacity: 0.3,
                zIndex: 999,
              });
              cellPolygon.setMap(map);
              gridOverlaysRef.current.push(cellPolygon);
            }
          }
        }
        return true;
      } catch (error) {
        console.error("Failed to paint square:", code, error);
        return false;
      }
    },
    [map, parseCode, northLat, latSquareSize, westLng, lngSquareSize]
  );

  const showGrid = useCallback(() => {
    if (!map || !TextOverlay) return;

    clearMap();
    const newGridLines: unknown[] = [];
    const newPolygons: unknown[] = [];
    const newOverlays: unknown[] = [];
    const newGridOverlays: unknown[] = []; // For highlighting user areas

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

    // Paint user's worked areas using intersection logic
    if (userAreas && userAreas.length > 0) {
      userAreas.forEach((areaCode: string) => {
        try {
          const success = paintSquareByCode(areaCode);
          if (!success) {
            console.log("Could not paint area:", areaCode);
          }
        } catch (error) {
          console.log("Failed to paint area:", areaCode, error);
        }
      });
    }

    gridLinesRef.current = newGridLines;
    polygonsRef.current = newPolygons;
    overlaysRef.current = newOverlays;
    gridOverlaysRef.current = newGridOverlays;
  }, [
    map,
    TextOverlay,
    userAreas,
    clearMap,
    getSquareByLatLng,
    paintSquareByCode,
    latSquareSize,
    lngSquareSize,
    northLat,
    westLng,
    eastLng,
    southLat,
  ]);

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
  }, [map, TextOverlay, showGrid]);

  // 3. Update map when user areas data changes
  useEffect(() => {
    if (map && TextOverlay && mapInitialized.current && !isLoading) {
      showGrid(); // Re-render grid with user areas
    }
  }, [userAreas, isLoading, map, TextOverlay, showGrid]);

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
      overlaysRef.current = [...overlaysRef.current, overlay];
    });

    polygonsRef.current = newPolygons;
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
          overlaysRef.current = [...overlaysRef.current, overlay];
        }
      }
    }

    gridOverlaysRef.current = newGridOverlays;
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

    markersRef.current = newMarkers;
    gridOverlaysRef.current = newGridOverlays;
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
