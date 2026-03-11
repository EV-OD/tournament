"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Loader2, MapPin, DollarSign, ChevronRight, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import ManagerPanel from "@/components/ManagerPanel";
import AddGround from "@/components/addGround";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const MyVenuesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const venueIdFromUrl = searchParams.get("id");
  
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // removed hasVenueAccess - show venue list even if empty
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  const fetchVenues = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const venuesQuery = query(
        collection(db, "venues"),
        where("managedBy", "==", user.uid)
      );
      const venueSnapshot = await getDocs(venuesQuery);

      // If no venues found, we'll show the empty state below.
      const venuesData = venueSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVenues(venuesData);

      // If there's a venue ID in URL, select that venue
      if (venueIdFromUrl) {
        const venueToSelect = venuesData.find((v) => v.id === venueIdFromUrl);
        if (venueToSelect) {
          setSelectedVenue(venueToSelect);
        }
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      // setHasVenueAccess(false);
    } finally {
      setLoading(false);
    }
  }, [user, venueIdFromUrl]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleVenueSelect = (venue: any) => {
    setSelectedVenue(venue);
    router.push(`/manager/venue-settings?id=${venue.id}`);
  };

  const handleBackToList = () => {
    setSelectedVenue(null);
    router.push("/manager/venue-settings");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-lg shadow-md">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // No access-restriction view; empty list shown when user has no venues.

  // Show venue list if no venue is selected
  if (!selectedVenue) {
    return (
      <div className="space-y-8 pt-14 lg:pt-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">My Venues</h1>
            <p className="text-gray-600 text-lg">Select a venue to manage its details, images, location, and availability.</p>
          </div>
          <Button 
            onClick={() => setIsAddVenueOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Create New Venue</span>
          </Button>
        </div>

        {venues.length === 0 ? (
          <Card className="p-16 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <div className="flex flex-col items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center shadow-md">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">No venues yet</h3>
                <p className="text-gray-600 text-lg mt-2">Get started by creating your first venue</p>
              </div>
              <Button 
                onClick={() => setIsAddVenueOpen(true)}
                className="flex items-center gap-2 px-6 py-3 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create New Venue</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Card
              key={venue.id}
              className="hover:shadow-xl transition-shadow cursor-pointer rounded-xl border border-gray-200 bg-white"
              onClick={() => handleVenueSelect(venue)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 truncate max-w-[180px]">{venue.name}</span>
                  {/* Status tag with icon */}
                  {venue.status === "approved" && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 font-medium">
                      <CheckCircle className="h-4 w-4" /> Approved
                    </span>
                  )}
                  {venue.status === "pending" && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1 font-medium">
                      <Clock className="h-4 w-4" /> Pending
                    </span>
                  )}
                  {venue.status === "rejected" && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 font-medium">
                      <XCircle className="h-4 w-4" /> Rejected
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardTitle>
                <CardDescription className="space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{venue.address || "No address set"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Rs. {venue.pricePerHour || 0} / hour</span>
                  </div>
                </CardDescription>
              </CardHeader>
              {venue.imageUrls && venue.imageUrls.length > 0 && (
                <CardContent>
                  <img
                    src={venue.imageUrls[0]}
                    alt={venue.name}
                    className="w-full h-44 object-cover rounded-lg shadow-sm"
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        )}

        <AddGround
          isFormOpen={isAddVenueOpen}
          setIsFormOpen={setIsAddVenueOpen}
          fetchGrounds={fetchVenues}
        />
      </div>
    );
  }

  // Show selected venue management panel
  return (
    <div className="space-y-8 pt-14 lg:pt-0">
      <div className="flex items-center gap-2 text-lg text-gray-600 mb-4">
        <button
          onClick={handleBackToList}
          className="hover:text-orange-600 transition-colors font-semibold text-gray-900"
        >
          My Venues
        </button>
        <ChevronRight className="h-5 w-5" />
        <span className="text-gray-900 font-bold text-xl">{selectedVenue.name}</span>
        {/* Status tag for selected venue with icon */}
        {selectedVenue.status === "approved" && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 font-medium">
            <CheckCircle className="h-4 w-4" /> Approved
          </span>
        )}
        {selectedVenue.status === "pending" && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1 font-medium">
            <Clock className="h-4 w-4" /> Pending
          </span>
        )}
        {selectedVenue.status === "rejected" && (
          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 font-medium">
            <XCircle className="h-4 w-4" /> Rejected
          </span>
        )}
      </div>
      <ManagerPanel venue={selectedVenue} />
    </div>
  );
};

export default MyVenuesPage;
