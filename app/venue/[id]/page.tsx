"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useUploadThing } from "@/lib/uploadthing-client";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthGuard from "@/components/AuthGuard";

interface Venue {
  id: string;
  name: string;
  address: string;
  facilities: string;
  qrCode?: string;
}

interface Booking {
  id: string;
  timeSlot: string;
  status: string;
  userId: string;
  screenshotUrl?: string;
}

export default function VenueDetail() {
  const { id } = useParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader");

  const timeSlots = [
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      // Fetch venue
      const docRef = doc(db, "venues", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVenue({ id: docSnap.id, ...docSnap.data() } as Venue);
      }

      // Fetch bookings
      const q = query(collection(db, "bookings"), where("venueId", "==", id));
      const querySnapshot = await getDocs(q);
      const bookingList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      setBookings(bookingList);

      setLoading(false);
    };
    fetchData();
  }, [id]);

  const isBooked = (slot: string) => {
    return bookings.some(
      (booking) => booking.timeSlot === slot && booking.status === "approved",
    );
  };

  const handleBook = (slot: string) => {
    if (!user) {
      alert("Please log in to book");
      return;
    }
    setSelectedSlot(slot);
  };

  const handleUploadAndSubmit = async (file: File) => {
    if (!selectedSlot || !user || !venue) return;
    setUploading(true);
    const res = await startUpload([file]);
    if (res && res[0]) {
      await addDoc(collection(db, "bookings"), {
        venueId: venue.id,
        userId: user.uid,
        timeSlot: selectedSlot,
        status: "pending",
        screenshotUrl: res[0].url,
      });
      alert("Booking submitted for approval");
      setSelectedSlot(null);
    }
    setUploading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!venue) return <div>Venue not found</div>;

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <p>{venue.address}</p>
        <p>{venue.facilities}</p>
        {venue.qrCode && (
          <img src={venue.qrCode} alt="QR Code" className="w-32 h-32" />
        )}
        <h2 className="text-xl font-semibold mt-4">Availability</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {timeSlots.map((slot) => (
            <div
              key={slot}
              className={`p-2 border rounded ${isBooked(slot) ? "bg-red-200" : "bg-green-200"}`}
            >
              {slot} - {isBooked(slot) ? "Booked" : "Free"}
              {!isBooked(slot) && (
                <button
                  onClick={() => handleBook(slot)}
                  className="mt-1 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                >
                  Book
                </button>
              )}
            </div>
          ))}
        </div>
        {selectedSlot && venue.qrCode && (
          <div className="mt-4 p-4 border rounded">
            <h3>Book {selectedSlot}</h3>
            <p>Scan the QR code to pay:</p>
            <img src={venue.qrCode} alt="QR Code" className="w-32 h-32" />
            <p>Upload screenshot of payment:</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAndSubmit(file);
              }}
              disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
