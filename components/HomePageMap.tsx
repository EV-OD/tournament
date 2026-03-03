"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const HomePageMap = () => {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const mapRef = useRef<L.Map | null>(null);

  const handleLocationGranted = (location: [number, number]) => {
    // Validate location coordinates
    if (!location || location.length !== 2 || isNaN(location[0]) || isNaN(location[1])) {
      console.error("Invalid location coordinates:", location);
      return;
    }
    
    setUserLocation(location);
    mapRef.current?.flyTo(location, 13);
  };

  const handleLocationDenied = () => {
    console.log("User denied location access for homepage map");
  };

  useEffect(() => {
    const fetchGrounds = async () => {
      const q = query(
        collection(db, "venues"),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setVenues(list);
    };

    fetchGrounds();

    // Request user's real location
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleLocationGranted([pos.coords.latitude, pos.coords.longitude]),
        handleLocationDenied,
        { timeout: 8000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkerClick = (groundId: string) => {
    router.push(`/venue/${groundId}`);
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <div className="rounded-none overflow-hidden h-full">
        <MapContainer
          center={[27.7172, 85.324]}
          zoom={13}
          style={{ height: "100%", width: "100%", minHeight: "400px" }}
          whenReady={(e) => {
            mapRef.current = e.target;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {userLocation && (
            <Marker position={userLocation}>
              <Tooltip>You are here</Tooltip>
            </Marker>
          )}
          {venues.map((ground) => (
            <Marker
              key={ground.id}
              position={[ground.latitude, ground.longitude]}
              eventHandlers={{
                click: () => handleMarkerClick(ground.id),
              }}
            >
              <Tooltip>
                <h3>{ground.name}</h3>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default HomePageMap;
