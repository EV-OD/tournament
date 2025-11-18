"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import "leaflet/dist/leaflet.css";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false }
) as any;

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  distance?: number;
}

// Component to handle map clicks and marker dragging
const DraggableMarker = ({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) => {
  const markerRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [mapEvents, setMapEvents] = useState<any>(null);

  useEffect(() => {
    // Load Leaflet only on client side
    import("leaflet").then((module) => {
      const leaflet = module.default;
      // Fix for default Leaflet icon path issues with webpack
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
      setL(leaflet);
    });

    import("react-leaflet").then((module) => {
      setMapEvents(module.useMapEvents);
    });
  }, []);

  if (mapEvents) {
    mapEvents({
      click(e: any) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
      },
    });
  }

  if (!L) return null;

  return (
    <Marker
      draggable={true}
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const newPos = marker.getLatLng();
            setPosition([newPos.lat, newPos.lng]);
          }
        },
      }}
    />
  );
};

const LocationPicker = ({
  latitude,
  longitude,
  onLocationChange,
}: LocationPickerProps) => {
  const [currentLat, setCurrentLat] = useState(latitude || 27.7172);
  const [currentLng, setCurrentLng] = useState(longitude || 85.3240);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering map
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Try to get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Silently fail if user denies location
        }
      );
    }
  }, []);

  const setPosition = (pos: [number, number]) => {
    setCurrentLat(pos[0]);
    setCurrentLng(pos[1]);
    onLocationChange(pos[0], pos[1]);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onLocationChange(newLat, newLng);

        // Fly to new location on map
        if (mapRef.current) {
          mapRef.current.flyTo([newLat, newLng], 15);
        }

        toast.success("Location updated to your current position");
      },
      (error) => {
        toast.error("Unable to retrieve your location");
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=10`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        let results: SearchResult[] = data;

        // If user location is available, calculate distances and sort
        if (userLocation) {
          results = data.map((item: SearchResult) => ({
            ...item,
            distance: calculateDistance(
              userLocation[0],
              userLocation[1],
              parseFloat(item.lat),
              parseFloat(item.lon)
            ),
          }));
          // Sort by distance (nearest first)
          results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        setSearchResults(results);
        toast.success(`Found ${results.length} location${results.length > 1 ? 's' : ''}`);
      } else {
        toast.error("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Failed to search location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    setCurrentLat(lat);
    setCurrentLng(lon);
    onLocationChange(lat, lon);

    // Fly to selected location on map
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 15);
    }

    toast.success("Location selected");
    setSearchResults([]); // Clear results after selection
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Set Venue Location
        </CardTitle>
        <CardDescription>
          Click on the map or drag the marker to set the exact location of your venue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} variant="outline" disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
          <Button onClick={handleGetCurrentLocation} variant="outline" size="icon">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Results List */}
        {searchResults.length > 0 && (
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Search Results ({searchResults.length})
              </CardTitle>
              <CardDescription className="text-xs">
                {userLocation 
                  ? "Sorted by distance from your location" 
                  : "Click on a result to select it"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.place_id}
                      onClick={() => handleSelectResult(result)}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">
                            {result.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.type}
                          </p>
                        </div>
                        {result.distance && (
                          <div className="flex-shrink-0 bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                            {result.distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <div className="w-full h-[400px] rounded-lg overflow-hidden border-2 border-gray-200">
          <MapContainer
            center={[currentLat, currentLng]}
            zoom={15}
            style={{ width: "100%", height: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <DraggableMarker
              position={[currentLat, currentLng]}
              setPosition={setPosition}
            />
          </MapContainer>
        </div>

        {/* Coordinates Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Selected Coordinates:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-blue-700">Latitude</label>
              <p className="font-mono text-sm text-gray-900">
                {currentLat.toFixed(6)}
              </p>
            </div>
            <div>
              <label className="text-xs text-blue-700">Longitude</label>
              <p className="font-mono text-sm text-gray-900">
                {currentLng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          💡 Tip: You can drag the marker or click anywhere on the map to set the location
        </p>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;
