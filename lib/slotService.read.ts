/**
 * Read-only slot service helpers
 * Exposes types and read helpers (e.g., `reconstructSlots`) safe for client
 */
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Types
export interface SlotConfig {
  startTime: string;
  endTime: string;
  slotDuration: number;
  daysOfWeek: number[];
  timezone?: string;
}

export interface BlockedSlot {
  date: string;
  startTime: string;
  reason?: string;
  blockedBy?: string;
  blockedAt: any;
}

export interface BookedSlot {
  date: string;
  startTime: string;
  bookingId: string;
  bookingType: "physical" | "website";
  status: "confirmed" | "pending_payment";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  userId?: string;
  createdAt: any;
}

export interface HeldSlot {
  date: string;
  startTime: string;
  userId: string;
  bookingId: string;
  holdExpiresAt: any;
  createdAt: any;
}

export interface ReservedSlot {
  date: string;
  startTime: string;
  note?: string;
  reservedBy: string;
  reservedAt: any;
}

export interface VenueSlots {
  venueId: string;
  config: SlotConfig;
  blocked: BlockedSlot[];
  bookings: BookedSlot[];
  held: HeldSlot[];
  reserved: ReservedSlot[];
  updatedAt: any;
}

export interface ReconstructedSlot {
  date: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BLOCKED" | "BOOKED" | "HELD" | "RESERVED";
  bookingType?: "physical" | "website";
  bookingId?: string;
  customerName?: string;
  customerPhone?: string;
  userId?: string;
  reason?: string;
  note?: string;
  holdExpiresAt?: any;
}

export interface BookingData {
  bookingId: string;
  bookingType: "physical" | "website";
  status: "confirmed" | "pending_payment";
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  userId?: string;
}

// Helper functions (pure/time helpers)
function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes < endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const min = currentMinutes % 60;
    slots.push(`${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
    currentMinutes += duration;
  }

  return slots;
}

function getEndTime(startTime: string, duration: number): string {
  const [hour, min] = startTime.split(":").map(Number);
  const totalMinutes = hour * 60 + min + duration;
  const endHour = Math.floor(totalMinutes / 60);
  const endMin = totalMinutes % 60;
  return `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
}

function isPast(date: string, startTime: string): boolean {
  const slotDateTime = new Date(`${date}T${startTime}`);
  return slotDateTime < new Date();
}

function matchSlot(date: string, startTime: string) {
  return (item: any) => item.date === date && item.startTime === startTime;
}

// Read-only operations
export async function getVenueSlots(venueId: string): Promise<VenueSlots | null> {
  try {
    const docRef = doc(db, "venueSlots", venueId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return docSnap.data() as VenueSlots;
  } catch (error) {
    console.error("Error getting venue slots:", error);
    throw error;
  }
}

export async function reconstructSlots(
  venueId: string,
  startDate: Date,
  endDate: Date
): Promise<ReconstructedSlot[]> {
  try {
    const venueSlots = await getVenueSlots(venueId);
    if (!venueSlots) return [];

    const { config, blocked, bookings, held, reserved } = venueSlots;
    const slots: ReconstructedSlot[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      if (config.daysOfWeek.includes(dayOfWeek)) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const timeSlots = generateTimeSlots(config.startTime, config.endTime, config.slotDuration);

        for (const startTime of timeSlots) {
          if (isPast(dateString, startTime)) continue;

          const endTime = getEndTime(startTime, config.slotDuration);

          const blockedSlot = blocked.find(matchSlot(dateString, startTime));
          if (blockedSlot) {
            slots.push({ date: dateString, startTime, endTime, status: "BLOCKED", reason: blockedSlot.reason });
            continue;
          }

          const bookedSlot = bookings.find(matchSlot(dateString, startTime));
          if (bookedSlot) {
            slots.push({
              date: dateString,
              startTime,
              endTime,
              status: "BOOKED",
              bookingType: bookedSlot.bookingType,
              bookingId: bookedSlot.bookingId,
              customerName: bookedSlot.customerName,
              customerPhone: bookedSlot.customerPhone,
              userId: bookedSlot.userId,
            });
            continue;
          }

          const heldSlot = held.find(matchSlot(dateString, startTime));
          if (heldSlot) {
            const now = Timestamp.now();
            const expiresAt = heldSlot.holdExpiresAt;
            if (expiresAt && expiresAt.toMillis() > now.toMillis()) {
              slots.push({ date: dateString, startTime, endTime, status: "HELD", userId: heldSlot.userId, bookingId: heldSlot.bookingId, holdExpiresAt: heldSlot.holdExpiresAt });
              continue;
            }
          }

          const reservedSlot = reserved.find(matchSlot(dateString, startTime));
          if (reservedSlot) {
            slots.push({ date: dateString, startTime, endTime, status: "RESERVED", note: reservedSlot.note });
            continue;
          }

          slots.push({ date: dateString, startTime, endTime, status: "AVAILABLE" });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  } catch (error) {
    console.error("Error reconstructing slots:", error);
    throw error;
  }
}

export async function getSlotStatus(
  venueId: string,
  date: string,
  startTime: string
): Promise<ReconstructedSlot | null> {
  try {
    const start = new Date(date);
    const end = new Date(date);
    const slots = await reconstructSlots(venueId, start, end);
    return slots.find((s) => s.date === date && s.startTime === startTime) || null;
  } catch (error) {
    console.error("Error getting slot status:", error);
    throw error;
  }
}
