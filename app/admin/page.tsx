"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthGuard from "@/components/AuthGuard";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

/**
 * Admin Panel
 * - Shows pending bookings in a clean card + table layout
 * - Uses shadcn-style Card, Table and Button components for a professional UI
 */

interface Booking {
  id: string;
  venueId: string;
  userId: string;
  timeSlot: string;
  status: string;
  screenshotUrl?: string;
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const q = query(
        collection(db, "bookings"),
        where("status", "==", "pending"),
      );
      const querySnapshot = await getDocs(q);
      const bookingList = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Booking[];
      setBookings(bookingList);
      setLoading(false);
    };
    fetchBookings();
  }, [user]);

  const handleApprove = async (bookingId: string) => {
    await updateDoc(doc(db, "bookings", bookingId), { status: "approved" });
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleReject = async (bookingId: string) => {
    await updateDoc(doc(db, "bookings", bookingId), { status: "rejected" });
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4">
          <Card>
            <CardContent>
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading pending bookings...
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pending Bookings</CardTitle>
            <div className="text-sm text-muted-foreground">
              {bookings.length} pending
            </div>
          </CardHeader>

          <CardContent>
            {bookings.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No pending bookings at the moment.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.venueId}</TableCell>
                      <TableCell>{b.timeSlot}</TableCell>
                      <TableCell>{b.userId}</TableCell>
                      <TableCell>
                        {b.screenshotUrl ? (
                          <a
                            href={b.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block rounded border overflow-hidden"
                          >
                            <img
                              src={b.screenshotUrl}
                              alt="screenshot"
                              className="w-24 h-16 object-cover"
                            />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(b.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(b.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
