"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";

// Dynamically import the single, unified map component with SSR disabled
const VenueMap = dynamic(() => import("@/components/venueMap"), {
  ssr: false,
  loading: () => <p className="text-center">Loading map...</p>,
});

const Home = () => {
  const { role } = useAuth();

  return (
    <main className="container">
      <VenueMap />
    </main>
  );
};

export default Home;
