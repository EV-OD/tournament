import { db as clientDb } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db as adminDb, isAdminInitialized } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export interface PaymentLogData {
  transactionUuid: string;
  bookingId: string;
  userId: string;
  venueId: string;
  amount: number;
  status: 'success' | 'failure' | 'pending' | 'refunded';
  method: 'esewa' | 'khalti' | 'cash' | 'other';
  productCode?: string;
  refId?: string;
  metadata?: any;
}

export async function logPayment(data: PaymentLogData) {
  try {
    // 1. Fetch venue to get managerId
    let managerId = null;
    let venueName = null;
    
    if (data.venueId) {
      try {
        if (isAdminInitialized()) {
          const venueSnap = await adminDb.collection("venues").doc(data.venueId).get();
          if (venueSnap.exists) {
            const venueData = venueSnap.data();
            managerId = venueData?.managedBy || null;
            venueName = venueData?.name || null;
          }
        } else {
          const venueRef = doc(clientDb, "venues", data.venueId);
          const venueSnap = await getDoc(venueRef);
          if (venueSnap.exists()) {
            const venueData = venueSnap.data();
            managerId = venueData.managedBy || null;
            venueName = venueData.name || null;
          }
        }
      } catch (err) {
        console.error("Error fetching venue details for payment log:", err);
      }
    }

    // 2. Fetch user details (optional, but good for history)
    let userEmail = null;
    if (data.userId) {
      try {
        if (isAdminInitialized()) {
          const userSnap = await adminDb.collection("users").doc(data.userId).get();
          if (userSnap.exists) {
            userEmail = userSnap.data()?.email || null;
          }
        } else {
          const userRef = doc(clientDb, "users", data.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            userEmail = userSnap.data().email || null;
          }
        }
      } catch (err) {
        console.error("Error fetching user details for payment log:", err);
      }
    }

    // 3. Create payment record
    const dateString = new Date().toISOString().split('T')[0];

    if (isAdminInitialized()) {
      const paymentRecordAdmin = {
        ...data,
        managerId,
        venueName,
        userEmail,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        dateString,
      } as any;
      await adminDb.collection("payments").add(paymentRecordAdmin);
    } else {
      const paymentRecord = {
        ...data,
        managerId,
        venueName,
        userEmail,
        createdAt: serverTimestamp(),
        dateString,
      };
      await addDoc(collection(clientDb, "payments"), paymentRecord);
    }
    console.log("✅ Payment logged successfully:", data.transactionUuid);
    return true;
  } catch (error) {
    console.error("❌ Failed to log payment:", error);
    return false;
  }
}
