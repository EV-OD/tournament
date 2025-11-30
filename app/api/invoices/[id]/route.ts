import { NextRequest, NextResponse } from 'next/server';
import { db, auth, isAdminInitialized } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Server-side invoice generator
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminInitialized()) {
    return NextResponse.json({ error: 'Server misconfigured: Admin SDK not initialized' }, { status: 500 });
  }

  const bookingId = params.id;

  // Authenticate caller
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });

  let decoded: any;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Fetch booking, venue and owner data from Admin DB
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    const booking = bookingSnap.data() as any;

    const venueRef = db.collection('venues').doc(booking.venueId);
    const venueSnap = await venueRef.get();
    const venue = venueSnap.exists ? venueSnap.data() : {};

    const ownerRef = db.collection('users').doc(booking.userId);
    const ownerSnap = await ownerRef.get();
    const owner = ownerSnap.exists ? ownerSnap.data() : {};

    // Check permissions: booking owner, venue manager, or admin
    const callerUid = decoded.uid;
    const callerUserSnap = await db.collection('users').doc(callerUid).get();
    const callerUser = callerUserSnap.exists ? callerUserSnap.data() : {};
    const isAdminUser = callerUser?.role === 'admin';

    const managedBy = venue?.managedBy;
    const isVenueManager = managedBy === callerUid || (Array.isArray(managedBy) && managedBy.includes(callerUid));

    if (callerUid !== booking.userId && !isVenueManager && !isAdminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build invoice data
    const invoiceData = {
      bookingId: bookingId,
      venueName: venue?.name || 'Unknown Venue',
      venueAddress: venue?.address || 'Address not available',
      date: booking?.date || '',
      startTime: booking?.startTime || '',
      endTime: booking?.endTime || '',
      amount: booking?.amount || booking?.price || 0,
      status: booking?.status || '',
      userName: owner?.name || owner?.displayName || '',
      userEmail: owner?.email || '',
      paymentTimestamp: booking?.paymentTimestamp || null,
      esewaTransactionCode: booking?.esewaTransactionCode || booking?.esewaTransactionUuid || null,
    };

    // Generate PDF using jsPDF (server-side). Use similar layout as client generator.
    const doc = new jsPDF();
    doc.setProperties({ title: `Invoice-${invoiceData.bookingId}`, subject: 'Booking Invoice' });
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold' as any);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal' as any);
    doc.text('Futsal Booking System', 105, 30, { align: 'center' });

    // Details box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    (doc as any).roundedRect(15, 45, 180, 25, 3, 3, 'FD');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold' as any);
    doc.text('Invoice Number:', 20, 53);
    doc.setFont('helvetica', 'normal' as any);
    doc.text(invoiceData.bookingId, 60, 53);
    doc.setFont('helvetica', 'bold' as any);
    doc.text('Date:', 20, 60);
    doc.setFont('helvetica', 'normal' as any);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 60, 60);

    // Bill to / Venue
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold' as any);
    doc.text('Bill To:', 15, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal' as any);
    doc.text(invoiceData.userName || 'Customer', 15, 92);
    doc.text(invoiceData.userEmail || '', 15, 98);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold' as any);
    doc.text('Venue Details:', 110, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal' as any);
    doc.text(invoiceData.venueName, 110, 92);
    const addressLines = (doc as any).splitTextToSize(invoiceData.venueAddress, 85);
    doc.text(addressLines, 110, 98);

    autoTable(doc as any, {
      startY: 115,
      head: [['Description', 'Details']],
      body: [
        ['Booking Date', invoiceData.date],
        ['Time Slot', `${invoiceData.startTime} - ${invoiceData.endTime}`],
        ['Duration', '1 Hour'],
        ['Booking Type', 'Website Booking'],
      ],
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 155;
    autoTable(doc as any, {
      startY: finalY + 10,
      head: [['Item', 'Amount (NPR)']],
      body: [['Venue Booking Fee', `Rs. ${invoiceData.amount}`], ['Tax', 'Rs. 0'], ['Service Charge', 'Rs. 0']],
      foot: [['Total Amount', `Rs. ${invoiceData.amount}`]],
      theme: 'grid',
    });

    if (invoiceData.esewaTransactionCode) {
      const paymentY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold' as any);
      doc.text('Payment Information:', 15, paymentY + 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal' as any);
      doc.text(`Payment Method: eSewa`, 15, paymentY + 22);
      doc.text(`Transaction ID: ${invoiceData.esewaTransactionCode}`, 15, paymentY + 28);
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 270, 195, 270);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for booking with us!', 105, 278, { align: 'center' });

    const fileName = `Invoice-${invoiceData.venueName.replace(/\s+/g, '-')}-${invoiceData.date}-${invoiceData.bookingId.slice(0, 8)}.pdf`;

    const arrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error('Invoice generation error:', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
