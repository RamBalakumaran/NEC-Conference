import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import collegeLogo from '../assets/logo.png';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatLabel = (value, fallback = 'Not provided') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const formatCurrency = (amount, currency = 'INR') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-IN')}`;

const sanitizeFilenamePart = (value) =>
  String(value || 'bill')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });

const loadAssetAsDataUrl = async (src) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Unable to load asset: ${src}`);
  }
  const blob = await response.blob();
  return fileToDataUrl(blob);
};

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) return [];
  return events
    .map((eventItem) => (typeof eventItem === 'string' ? eventItem : eventItem?.name || eventItem?.title || eventItem?.id || ''))
    .map((eventName) => String(eventName || '').trim())
    .filter(Boolean);
};

const buildQrPayload = ({ profile, payment, events }) =>
  JSON.stringify({
    pid: profile?.participantId || 'Pending Assignment',
    nm: profile?.name || 'Participant',
    em: profile?.email || '',
    ath: '',
    ev: events.join('|'),
    amt: Number.isFinite(Number(payment?.amount)) ? `${Number(payment.amount)}` : `${payment?.amount || 0}`,
    cur: payment?.currency || 'INR',
    oid: payment?.orderId || '',
    pyid: payment?.paymentId || payment?.transactionId || '',
    upi: payment?.upiId || '',
    tid: payment?.transactionId || payment?.paymentId || payment?.orderId || '',
  });

const triggerPdfDownload = (doc, filename) => {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadPaymentBill = async ({ profile, payment }) => {
  if (!payment || payment.status !== 'Paid') {
    throw new Error('Only successful payments can be downloaded as bills.');
  }

  const conferenceName = 'NEC Pre Conference 2026';
  const events = normalizeEvents(payment?.events);
  const qrPayload = buildQrPayload({
    profile,
    payment,
    events,
  });

  const [logoDataUrl, qrCodeDataUrl] = await Promise.all([
    loadAssetAsDataUrl(collegeLogo).catch(() => null),
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 220,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).catch(() => null),
  ]);

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  let cursorY = 62;

  const ensureSpace = (heightNeeded = 28) => {
    if (cursorY + heightNeeded <= pageHeight - 48) return;
    doc.addPage();
    cursorY = 56;
  };

  const addSectionTitle = (title) => {
    ensureSpace(44);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text(title, marginX, cursorY);
    cursorY += 16;
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 18;
  };

  const addLineItem = (label, value) => {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, marginX, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const wrappedValue = doc.splitTextToSize(formatLabel(value), pageWidth - marginX * 2 - 110);
    doc.text(wrappedValue, marginX + 110, cursorY);
    cursorY += Math.max(18, wrappedValue.length * 14);
  };

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 140, 'F');

  const logoHeight = logoDataUrl ? 74 : 0;
  const logoWidth = logoHeight * 0.75;
  const logoX = pageWidth - marginX - logoWidth;
  const logoY = 28;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Bill logo could not be embedded:', error);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const titleWidth = pageWidth - marginX * 2 - (logoDataUrl ? logoWidth + 18 : 0);
  const titleLines = doc.splitTextToSize(conferenceName, titleWidth);
  doc.text(titleLines, marginX, 52);

  const subtitleY = 52 + titleLines.length * 24;
  doc.setFontSize(16);
  doc.text('Payment Bill', marginX, subtitleY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text(`Generated on ${formatDateTime(new Date())}`, marginX, subtitleY + 24);

  cursorY = 166;

  addSectionTitle('Participant Details');
  addLineItem('Participant Name', profile?.name || 'Participant');
  addLineItem('Participant ID', profile?.participantId || 'Pending Assignment');
  addLineItem('Role', profile?.role || 'Participant');
  addLineItem('Email', profile?.email || 'Not available');
  addLineItem('Phone', profile?.phone || 'Not available');
  addLineItem('Institution / Company', profile?.organization || profile?.college || 'Not available');
  addLineItem('Department', profile?.department || 'Not available');
  addLineItem('Year', profile?.year || 'Not available');

  addSectionTitle('Payment Details');
  addLineItem('Payment Status', payment.status);
  addLineItem('Amount', formatCurrency(payment.amount, payment.currency));
  addLineItem('Order ID', payment.orderId || 'Not available');
  addLineItem('Payment ID', payment.paymentId || 'Not available');
  addLineItem('Transaction ID', payment.transactionId || 'Not available');
  addLineItem('Created On', formatDateTime(payment.createdAt));
  addLineItem('Updated On', formatDateTime(payment.updatedAt || payment.createdAt));

  addSectionTitle('Registered Events');
  const eventLines = events.length > 0 ? events : ['No event details captured'];
  eventLines.forEach((eventName, index) => {
    addLineItem(`Event ${index + 1}`, eventName);
  });

  if (qrCodeDataUrl) {
    ensureSpace(230);
    addSectionTitle('Verification QR');
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 170, 16, 16, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 170, 16, 16, 'S');

    try {
      doc.addImage(qrCodeDataUrl, 'PNG', marginX + 18, cursorY + 18, 120, 120);
    } catch (error) {
      console.warn('Bill QR code could not be embedded:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Scan for registration verification', marginX + 156, cursorY + 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      doc.splitTextToSize(
        'This QR carries the same participant and payment details used in the confirmation email, so venue verification can match either copy.',
        pageWidth - marginX * 2 - 176
      ),
      marginX + 156,
      cursorY + 62
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Participant ID: ${formatLabel(profile?.participantId, 'Pending Assignment')}`, marginX + 156, cursorY + 122);
    doc.text(`Order ID: ${formatLabel(payment?.orderId, 'Not available')}`, marginX + 156, cursorY + 142);
    cursorY += 190;
  }

  ensureSpace(76);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 70, 12, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(
    doc.splitTextToSize(
      `This bill is generated from your ${conferenceName} participant profile history. Please retain it for your payment and venue verification records.`,
      pageWidth - marginX * 2 - 24
    ),
    marginX + 12,
    cursorY + 22
  );

  const identifier = sanitizeFilenamePart(
    payment.paymentId || payment.transactionId || payment.orderId || profile?.participantId || profile?.email || 'payment-bill'
  );
  triggerPdfDownload(doc, `NEC-Pre-Conference-Payment-Bill-${identifier}.pdf`);
};
