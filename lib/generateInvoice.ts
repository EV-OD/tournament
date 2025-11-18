/**
 * Invoice PDF Generator
 * 
 * Generates professional PDF invoices for bookings
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  bookingId: string;
  venueName: string;
  venueAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: string;
  userName: string;
  userEmail: string;
  paymentTimestamp?: any;
  esewaTransactionCode?: string;
}

export function generateInvoice(data: InvoiceData) {
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: `Invoice-${data.bookingId}`,
    subject: 'Booking Invoice',
    author: 'Futsal Booking System',
    keywords: 'invoice, booking, receipt',
    creator: 'Futsal Booking System'
  });

  // Add header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Add company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Futsal Booking System', 105, 30, { align: 'center' });
  doc.text('Your trusted venue booking platform', 105, 36, { align: 'center' });
  
  // Add invoice details box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 45, 180, 25, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 20, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(data.bookingId, 60, 53);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), 60, 60);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, 67);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 128, 0);
  doc.text(data.status.toUpperCase(), 60, 67);
  doc.setTextColor(0, 0, 0);

  // Customer Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, 85);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.userName, 15, 92);
  doc.text(data.userEmail, 15, 98);

  // Venue Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Venue Details:', 110, 85);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.venueName, 110, 92);
  const addressLines = doc.splitTextToSize(data.venueAddress, 85);
  doc.text(addressLines, 110, 98);

  // Booking Details Table
  autoTable(doc, {
    startY: 115,
    head: [['Description', 'Details']],
    body: [
      ['Booking Date', data.date],
      ['Time Slot', `${data.startTime} - ${data.endTime}`],
      ['Duration', '1 Hour'],
      ['Booking Type', 'Website Booking'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 110 },
    },
  });

  // Payment Details Table
  const finalY = (doc as any).lastAutoTable.finalY || 155;
  
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Item', 'Amount (NPR)']],
    body: [
      ['Venue Booking Fee', `Rs. ${data.amount}`],
      ['Tax', 'Rs. 0'],
      ['Service Charge', 'Rs. 0'],
    ],
    foot: [['Total Amount', `Rs. ${data.amount}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    footStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  // Payment Information
  if (data.esewaTransactionCode) {
    const paymentY = (doc as any).lastAutoTable.finalY || 200;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information:', 15, paymentY + 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: eSewa`, 15, paymentY + 22);
    doc.text(`Transaction ID: ${data.esewaTransactionCode}`, 15, paymentY + 28);
    
    if (data.paymentTimestamp) {
      const paymentDate = data.paymentTimestamp.toDate ? 
        data.paymentTimestamp.toDate() : 
        new Date(data.paymentTimestamp);
      doc.text(
        `Payment Date: ${paymentDate.toLocaleDateString('en-US')} ${paymentDate.toLocaleTimeString('en-US')}`,
        15,
        paymentY + 34
      );
    }
  }

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 270, 195, 270);
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for booking with us!', 105, 278, { align: 'center' });
  doc.text('For support, please contact: support@futsalbooking.com', 105, 283, { align: 'center' });
  doc.text(`Invoice generated on ${new Date().toLocaleString('en-US')}`, 105, 288, { align: 'center' });

  // Generate filename
  const fileName = `Invoice-${data.venueName.replace(/\s+/g, '-')}-${data.date}-${data.bookingId.slice(0, 8)}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
}
