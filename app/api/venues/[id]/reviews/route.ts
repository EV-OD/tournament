import { NextResponse } from 'next/server';
import { db, auth, isAdminInitialized } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminInitialized()) {
    return NextResponse.json({ error: 'Server configuration error: Admin SDK not initialized' }, { status: 500 });
  }

  try {
    const venueId = params.id;
    const body = await req.json();
    const { rating, comment, bookingId } = body;

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;
    const displayName = decoded.name || decoded.email || 'Anonymous';

    // Transaction: set review doc (merge), add comment subdoc, update venue aggregates, optionally mark booking.rated
    const reviewDocRef = db.collection('reviews').doc(`${venueId}_${uid}`);
    const commentRef = db.collection(`venues/${venueId}/comments`).doc();
    const venueRef = db.collection('venues').doc(venueId);
    const bookingRef = bookingId ? db.collection('bookings').doc(bookingId) : null;

    await db.runTransaction(async (tx) => {
      const venueSnap = await tx.get(venueRef);
      if (!venueSnap.exists) {
        throw new Error('Venue does not exist');
      }

      const venueData = venueSnap.data() as any;
      const currentRating = venueData.averageRating || 0;
      const currentCount = venueData.reviewCount || 0;

      const existingReviewSnap = await tx.get(reviewDocRef);
      const existingRating = existingReviewSnap.exists ? (existingReviewSnap.data() as any).rating || 0 : null;

      let newCount = currentCount;
      let newAverage = currentRating;

      if (existingRating === null) {
        // New review
        newCount = currentCount + 1;
        newAverage = ((currentRating * currentCount) + rating) / newCount;
      } else {
        // Update existing review
        if (currentCount > 0) {
          newAverage = ((currentRating * currentCount) - existingRating + rating) / currentCount;
        } else {
          newAverage = rating;
        }
      }

      const roundedAverage = Math.round(newAverage * 10) / 10;

      const reviewData = {
        venueId,
        userId: uid,
        rating,
        comment: comment || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const commentData = {
        text: comment || '',
        author: displayName,
        role: 'user',
        rating,
        createdAt: new Date().toISOString(),
      };

      tx.set(reviewDocRef, reviewData, { merge: true });
      tx.set(commentRef, commentData);
      tx.update(venueRef, { averageRating: roundedAverage, reviewCount: newCount });

      if (bookingRef) {
        tx.update(bookingRef, { rated: true });
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating review (server):', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
