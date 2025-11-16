"use client";

import dynamic from "next/dynamic";

// Dynamically import VenueMap with SSR disabled
const VenueMap = dynamic(() => import("@/components/venueMap"), {
  ssr: false,
  loading: () => <p className="text-center">Loading map and venues...</p>,
});

const ManagerDashboard = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <VenueMap />
    </div>
  );
};

export default ManagerDashboard;
