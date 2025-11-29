import { NextResponse } from 'next/server';
import { db, auth, isAdminInitialized } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdminInitialized()) {
    return NextResponse.json({ error: 'Server configuration error: Admin SDK not initialized' }, { status: 500 });
  }

  try {
    const venueId = params.id;
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });

    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    // Fetch venue to check manager
    const venueRef = db.collection('venues').doc(venueId);
    const venueSnap = await venueRef.get();
    if (!venueSnap.exists) return NextResponse.json({ error: 'Venue not found' }, { status: 404 });

    const venueData = venueSnap.data() as any;

    // Allow if admin or manager of this venue
    const userDoc = await db.collection('users').doc(uid).get();
    const userRole = userDoc.exists ? (userDoc.data() as any).role : 'user';
    const isAdminUser = userRole === 'admin';
    const isManager = venueData.managedBy === uid;
    if (!(isAdminUser || isManager)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Whitelist allowed fields
    const allowedFields = [
      'name', 'description', 'pricePerHour', 'imageUrls', 'attributes',
      'address', 'latitude', 'longitude'
    ];
    const updatePayload: any = {};
    for (const k of allowedFields) {
      if (body[k] !== undefined) updatePayload[k] = body[k];
    }

    updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await venueRef.update(updatePayload);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('Venue update (server) error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
