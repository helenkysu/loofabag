'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';
import QRDesigner, { renderQRToCanvas } from '@/app/components/QRDesigner';
import type { QRDesignOptions } from '@/app/components/QRDesigner';
import BagTextSelector from '@/app/components/BagTextSelector';

type ProductVariant = { id: string; label: string; image: string };
type Product = { id: string; name: string; description: string; image: string | null; variants: ProductVariant[] | null };

const PRODUCTS: Product[] = [
  { id: 'eco-tote', name: 'Eco Tote Bag', description: 'Classic canvas tote', image: '/bagimages/ecototebag.webp', variants: null },
  { id: 'large-eco-tote', name: 'Large Eco Tote Bag', description: 'Extra room for everything', image: '/bagimages/largeecotote.webp', variants: null },
  { id: 'premium-large-tote', name: 'Premium Large Tote Bag', description: 'Oversized luxury canvas tote', image: '/bagimages/premiumtote-black.webp', variants: null },
];

interface ShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
}

const COUNTRIES = [
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
];

function getBagImageUrl(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.image ?? '';
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'url' | 'file';
  label: string;
  optional: boolean;
}

interface FieldDef {
  type: FormField['type'];
  label: string;
  optional: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function toFormFields(defs: FieldDef[]): FormField[] {
  return defs.map((f) => ({ ...f, id: makeId() }));
}

const templateDefs: Array<{ id: string; name: string; emoji: string; fields: FieldDef[] }> = [
  {
    id: 'dating',
    name: 'Dating',
    emoji: '💕',
    fields: [
      { type: 'text', label: 'Name / Nickname', optional: false },
      { type: 'number', label: 'Age', optional: true },
      { type: 'text', label: 'Gender', optional: true },
      { type: 'text', label: 'Ethnicity', optional: true },
      { type: 'text', label: 'MBTI', optional: true },
      { type: 'paragraph', label: 'Looking for', optional: true },
      { type: 'paragraph', label: 'Preferred contact method', optional: false },
      { type: 'photo', label: 'Photos (up to 5)', optional: true },
    ],
  },
  {
    id: 'friends',
    name: 'Friendship',
    emoji: '👯',
    fields: [
      { type: 'text', label: 'Name / Nickname', optional: false },
      { type: 'photo', label: 'Photos (up to 5)', optional: true },
      { type: 'text', label: 'Location', optional: true },
      { type: 'paragraph', label: 'Hobbies & interests', optional: true },
      { type: 'paragraph', label: 'Looking for', optional: true },
    ],
  },
  {
    id: 'networking',
    name: 'Networking',
    emoji: '🤝',
    fields: [
      { type: 'text', label: 'Name', optional: false },
      { type: 'text', label: 'Role / What you do', optional: false },
      { type: 'text', label: "Position you're looking for", optional: true },
      { type: 'text', label: 'School', optional: true },
      { type: 'paragraph', label: 'About your experience', optional: true },
      { type: 'text', label: 'Key skills', optional: true },
      { type: 'url', label: 'LinkedIn', optional: true },
      { type: 'file', label: 'Resume', optional: true },
      { type: 'photo', label: 'Photo / Headshot', optional: true },
      { type: 'text', label: 'How should they contact you', optional: false },
      { type: 'paragraph', label: 'Looking for', optional: true },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    emoji: '📝',
    fields: [],
  },
];

const submissionTemplateDefs: Array<{ id: string; name: string; emoji: string; fields: FieldDef[] }> = [
  {
    id: 'dating',
    name: 'Dating',
    emoji: '💕',
    fields: [
      { type: 'text', label: 'Name', optional: false },
      { type: 'number', label: 'Age', optional: false },
      { type: 'paragraph', label: 'Message', optional: false },
      { type: 'text', label: 'Preferred contact', optional: false },
    ],
  },
  {
    id: 'friends',
    name: 'Friendship',
    emoji: '👯',
    fields: [
      { type: 'text', label: 'Name', optional: false },
      { type: 'paragraph', label: 'Message', optional: false },
      { type: 'text', label: 'Preferred contact', optional: false },
    ],
  },
  {
    id: 'networking',
    name: 'Networking',
    emoji: '🤝',
    fields: [
      { type: 'text', label: 'Name', optional: false },
      { type: 'paragraph', label: 'Message', optional: false },
      { type: 'text', label: 'Preferred contact', optional: false },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    emoji: '📝',
    fields: [],
  },
];

export default function CreateLoofaPage() {
  const router = useRouter();
  // Steps: 1=URL, 2=Design, 3=Checkout, 4=QR Profile, 5=Submission form
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slugTaken, setSlugTaken] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('eco-tote');
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(templateDefs[0]);
  const [customFields, setCustomFields] = useState<FormField[]>(() => toFormFields(templateDefs[0].fields));
  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [pendingProfileFiles, setPendingProfileFiles] = useState<Record<string, File[]>>({});
  const [selectedSubmissionTemplate, setSelectedSubmissionTemplate] = useState(submissionTemplateDefs[0]);
  const [submissionFields, setSubmissionFields] = useState<FormField[]>(() => toFormFields(submissionTemplateDefs[0].fields));
  const [qrRenderedDataUrl, setQrRenderedDataUrl] = useState('');
  const [bagText, setBagText] = useState('');
  const [address, setAddress] = useState({ customerName: '', country: 'CA', state: '', address1: '', address2: '', city: '', zip: '' });
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [fetchingRates, setFetchingRates] = useState(false);
  const [ratesError, setRatesError] = useState('');
  const [restoredQrDesign, setRestoredQrDesign] = useState<QRDesignOptions | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState('');
  const [printfulOrder, setPrintfulOrder] = useState<{ orderId: number; orderNumber: string; status: string } | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [finished, setFinished] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [subDragIndex, setSubDragIndex] = useState<number | null>(null);
  const [subDragOverIndex, setSubDragOverIndex] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const didSave = useRef(false);
  const loofaIdRef = useRef(Date.now().toString());
  const qrDesignRef = useRef<QRDesignOptions | null>(null);
  const orderPlacedRef = useRef(false);

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  // Check slug uniqueness against existing loofas in localStorage
  useEffect(() => {
    if (!slug) { setSlugTaken(false); return; }
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setSlugTaken(false); return; }
    const loofas: Array<{ slug: string }> = JSON.parse(stored);
    setSlugTaken(loofas.some((l) => l.slug === slug));
  }, [slug]);

  // Restore state after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resume = params.get('resume');
    if (!resume) return;
    const sessionId = params.get('session_id');
    if (sessionId) setStripeSessionId(sessionId);
    const saved = sessionStorage.getItem('loofabag_checkout_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.name) setName(draft.name);
        if (draft.selectedProductId) setSelectedProductId(draft.selectedProductId);
        if (draft.bagText) setBagText(draft.bagText);
        if (draft.address) setAddress(draft.address);
        if (draft.qrDesign) setRestoredQrDesign(draft.qrDesign);
      } catch {}
    }
    setStep(Number(resume));
    // Clean up URL without reloading
    window.history.replaceState({}, '', '/my-loofas/create');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTemplate = (template: typeof templateDefs[0]) => {
    setSelectedTemplate(template);
    setCustomFields(toFormFields(template.fields));
    setProfileData({});
    setPendingProfileFiles({});
    const matchingSub = submissionTemplateDefs.find((t) => t.id === template.id) ?? submissionTemplateDefs[submissionTemplateDefs.length - 1];
    setSelectedSubmissionTemplate(matchingSub);
    setSubmissionFields(toFormFields(matchingSub.fields));
  };

  const selectSubmissionTemplate = (template: typeof submissionTemplateDefs[0]) => {
    setSelectedSubmissionTemplate(template);
    setSubmissionFields(toFormFields(template.fields));
  };

  const updateField = (idx: number, updates: Partial<FormField>) =>
    setCustomFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  const removeField = (idx: number) =>
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  const addField = () =>
    setCustomFields((prev) => [...prev, { id: makeId(), type: 'text', label: '', optional: true }]);

  const handleProfileTextChange = (fieldId: string, value: string) =>
    setProfileData((prev) => ({ ...prev, [fieldId]: value }));
  const handleProfileFiles = (fieldId: string, files: File[]) =>
    setPendingProfileFiles((prev) => ({ ...prev, [fieldId]: files }));

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIndex(idx); };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    setCustomFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const updateSubField = (idx: number, updates: Partial<FormField>) =>
    setSubmissionFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  const removeSubField = (idx: number) =>
    setSubmissionFields((prev) => prev.filter((_, i) => i !== idx));
  const addSubField = () =>
    setSubmissionFields((prev) => [...prev, { id: makeId(), type: 'text', label: '', optional: true }]);

  const handleSubDragStart = (idx: number) => setSubDragIndex(idx);
  const handleSubDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setSubDragOverIndex(idx); };
  const handleSubDragEnd = () => { setSubDragIndex(null); setSubDragOverIndex(null); };
  const handleSubDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (subDragIndex === null || subDragIndex === idx) { setSubDragIndex(null); setSubDragOverIndex(null); return; }
    setSubmissionFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(subDragIndex, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setSubDragIndex(null);
    setSubDragOverIndex(null);
  };

  const handleCreate = async () => {
    if (didSave.current) return;
    didSave.current = true;
    setCreating(true);

    const stored = localStorage.getItem('myLoofas');
    const current = stored ? JSON.parse(stored) : [];
    const loofaId = loofaIdRef.current;
    if (current.some((l: { id: string }) => l.id === loofaId)) {
      setCreating(false);
      setFinished(true);
      return;
    }

    const updatedProfileData = { ...profileData };

    await Promise.all(
      customFields
        .filter((f) => (f.type === 'photo' || f.type === 'file') && pendingProfileFiles[f.id]?.length)
        .map(async (field) => {
          const fd = new FormData();
          fd.append('loofa_id', loofaId);
          fd.append('type', field.type === 'photo' ? 'photos' : 'files');
          pendingProfileFiles[field.id].forEach((file) => fd.append('files', file));
          const res = await fetch('/api/upload/files', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.paths?.length) {
            updatedProfileData[field.id] = JSON.stringify(data.paths);
          }
        }),
    ).catch(console.error);

    const newLoofa = {
      id: loofaId,
      name: name || `Loofa ${current.length + 1}`,
      slug,
      product: selectedProductId,
      template: selectedTemplate.id,
      emoji: selectedTemplate.emoji,
      profileFields: customFields.filter((f) => f.label.trim()),
      fields: submissionFields.filter((f) => f.label.trim()),
      profileData: updatedProfileData,
      bagText: bagText || null,
    };
    localStorage.setItem('myLoofas', JSON.stringify([...current, newLoofa]));

    // Use pre-rendered design if available, otherwise fall back to server generation
    if (qrRenderedDataUrl) {
      setQrDataUrl(qrRenderedDataUrl);
      fetch('/api/upload/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loofa_id: loofaId, imageData: qrRenderedDataUrl }),
      }).catch(console.error);
    } else {
      const qrUrl = `${window.location.origin}/${slug}`;
      fetch('/api/upload/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loofa_id: loofaId, url: qrUrl }),
      })
        .then((r) => r.json())
        .then((data) => { if (data.dataUrl) setQrDataUrl(data.dataUrl); })
        .catch(console.error);
    }

    setCreating(false);
    setFinished(true);
  };

  const downloadDesignPNG = async () => {
    const PX = Math.round(300 * 9.5); // 2850 — 9.5" at 300 DPI
    const canvas = document.createElement('canvas');
    canvas.width = PX;
    canvas.height = PX;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PX, PX);

    const cx = PX / 2;
    let y = Math.round(PX * 0.10);

    // 1. Bag text
    if (bagText) {
      const lines = bagText.split('\n');
      const fs = Math.round(PX * 0.058);
      ctx.font = `900 ${fs}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const line of lines) {
        ctx.fillText(line, cx, y);
        y += Math.round(fs * 1.35);
      }
      y += Math.round(fs * 0.5);
    }

    // 2. QR code at full print resolution
    if (qrDesignRef.current) {
      const qrPx = Math.round(PX * 0.42);
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = qrPx;
      qrCanvas.height = qrPx;
      await renderQRToCanvas(qrCanvas, `https://loofabag.com/${slug || 'your-name'}`, qrDesignRef.current);
      ctx.drawImage(qrCanvas, Math.round(cx - qrPx / 2), y, qrPx, qrPx);
      y += qrPx + Math.round(PX * 0.02);
    }

    // 3. URL
    const urlFs = Math.round(PX * 0.026);
    ctx.font = `700 ${urlFs}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`loofabag.com/${slug || 'your-name'}`, cx, y);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `loofabag-${slug || 'design'}.png`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const generatePrintFileBlob = async (): Promise<Blob | null> => {
    const design = qrDesignRef.current ?? restoredQrDesign;
    if (!design) return null;

    const PX = Math.round(300 * 9.5); // 2850 px = 9.5" at 300 DPI
    const canvas = document.createElement('canvas');
    canvas.width = PX;
    canvas.height = PX;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PX, PX);

    const cx = PX / 2;
    let y = Math.round(PX * 0.10);

    if (bagText) {
      const lines = bagText.split('\n');
      const fs = Math.round(PX * 0.058);
      ctx.font = `900 ${fs}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (const line of lines) {
        ctx.fillText(line, cx, y);
        y += Math.round(fs * 1.35);
      }
      y += Math.round(fs * 0.5);
    }

    const qrPx = Math.round(PX * 0.42);
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrPx;
    qrCanvas.height = qrPx;
    await renderQRToCanvas(qrCanvas, `https://loofabag.com/${slug || 'your-name'}`, design);
    ctx.drawImage(qrCanvas, Math.round(cx - qrPx / 2), y, qrPx, qrPx);
    y += qrPx + Math.round(PX * 0.02);

    const urlFs = Math.round(PX * 0.026);
    ctx.font = `700 ${urlFs}px Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`loofabag.com/${slug || 'your-name'}`, cx, y);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  };

  const placeOrder = async (sessionId: string) => {
    setPlacingOrder(true);
    setOrderError('');
    try {
      // 1. Generate the full 9.5" × 9.5" print file
      const blob = await generatePrintFileBlob();
      if (!blob) {
        orderPlacedRef.current = false;
        setOrderError('Could not generate print file. Please try again.');
        setPlacingOrder(false);
        return;
      }

      // 2. Upload via FormData to get a Supabase signed URL
      const fd = new FormData();
      fd.append('file', blob, 'design.png');
      fd.append('sessionId', sessionId);
      const uploadRes = await fetch('/api/upload/print-file', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.signedUrl) {
        orderPlacedRef.current = false;
        setOrderError(uploadData.error ?? 'Failed to upload print file. Please try again.');
        setPlacingOrder(false);
        return;
      }

      // 3. Place the Printful order with the signed URL
      const res = await fetch('/api/orders/printful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSessionId: sessionId,
          productId: selectedProductId,
          customerName: address.customerName,
          address,
          printFileUrl: uploadData.signedUrl,
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        setPrintfulOrder(data);
        sessionStorage.setItem('loofabag_order', JSON.stringify(data));
      } else {
        orderPlacedRef.current = false;
        setOrderError(data.error ?? 'Failed to place order. Please contact support.');
      }
    } catch {
      orderPlacedRef.current = false;
      setOrderError('Failed to place order. Please contact support.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Auto-place order when arriving at step 4 after Stripe payment
  useEffect(() => {
    if (step !== 4 || !stripeSessionId || orderPlacedRef.current) return;
    const savedOrder = sessionStorage.getItem('loofabag_order');
    if (savedOrder) {
      try { setPrintfulOrder(JSON.parse(savedOrder)); return; } catch {}
    }
    orderPlacedRef.current = true;
    placeOrder(stripeSessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stripeSessionId]);

  const fetchShippingRates = async () => {
    setFetchingRates(true);
    setRatesError('');
    setShippingRates([]);
    setSelectedRateId('');
    try {
      const res = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, ...address }),
      });
      const data = await res.json();
      if (data.rates?.length) {
        setShippingRates(data.rates);
        setSelectedRateId(data.rates[0].id);
      } else {
        setRatesError(data.error ?? 'No shipping rates available for this address.');
      }
    } catch {
      setRatesError('Failed to fetch shipping rates. Check your connection and try again.');
    } finally {
      setFetchingRates(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    // Save draft so we can restore after redirect
    const design = qrDesignRef.current;
    sessionStorage.setItem('loofabag_checkout_draft', JSON.stringify({
      name,
      selectedProductId,
      bagText,
      address,
      // Save design options (logoFile is a File object — can't be serialized)
      qrDesign: design ? { fgColor: design.fgColor, bgColor: design.bgColor, gradient: design.gradient, shape: design.shape, logoFile: null } : null,
    }));
    const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          slug,
          shippingLabel: selectedRate?.name ?? '',
          shippingAmount: selectedRate ? Math.round(parseFloat(selectedRate.rate) * 100) : 0,
          address,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setCheckingOut(false);
      }
    } catch (err) {
      console.error(err);
      setCheckingOut(false);
    }
  };

  const step1Valid = !!name && !slugTaken;

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <main>
      <NavBar />

      <section className="my-loofas-section">
        <div className="my-loofas-container">
          <h1>Create a New Loofa</h1>

          {finished ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Loofa Created!</h2>
              <p>Your new loofa is ready and saved.</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code" className="qr-generated-img" />
              ) : (
                <div className="qr-generating">Generating QR code…</div>
              )}
              <p className="url-preview" style={{ marginTop: 12 }}>
                URL: <strong>loofabag.com/{slug}</strong>
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => router.push('/my-loofas')}>
                  Back to My Loofas
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Pick your URL */}
              {step === 1 && (
                <div className="step-content">
                  <h2>Pick Your URL</h2>
                  <p className="step-subtitle">This is how people will find your loofa — choose something memorable.</p>
                  <div className="url-input-row">
                    <span className="url-prefix">loofabag.com/</span>
                    <input
                      type="text"
                      placeholder="your-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`name-input url-suffix-input${slugTaken ? ' input-error' : ''}`}
                      autoFocus
                    />
                  </div>
                  {name && !slugTaken && (
                    <p className="slug-available">✓ loofabag.com/{slug} is available</p>
                  )}
                  {slugTaken && (
                    <p className="slug-taken">✗ loofabag.com/{slug} is already taken — try another name</p>
                  )}
                </div>
              )}

              {/* Step 2: Design */}
              {step === 2 && (() => {
                const selectedProduct = PRODUCTS.find((p) => p.id === selectedProductId)!;
                const bagImageUrl = getBagImageUrl(selectedProductId);
                return (
                  <div className="step-content step-content-wide">
                    <h2>Design Your Loofa</h2>
                    <div className="design-two-col">

                      {/* LEFT: QR controls → product selector → text selector */}
                      <div className="design-left">
                        <div className="design-section">
                          <h3 className="design-section-title">QR Code</h3>
                          <p className="step-subtitle">Customize how your QR code looks.</p>
                          <QRDesigner
                            url={slug ? `https://loofabag.com/${slug}` : 'https://loofabag.com'}
                            onDataUrl={setQrRenderedDataUrl}
                            onDesignChange={(d) => { qrDesignRef.current = d; }}
                          />
                        </div>

                        <div className="design-section">
                          <h3 className="design-section-title">Choose Your Bag</h3>
                          <div className="product-selector">
                            {PRODUCTS.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className={`product-card${selectedProductId === product.id ? ' selected' : ''}`}
                                onClick={() => setSelectedProductId(product.id)}
                              >
                                <span className="product-card-name">{product.name}</span>
                                <span className="product-card-desc">{product.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="design-section">
                          <h3 className="design-section-title">Bag Text</h3>
                          <p className="step-subtitle">Choose text to print on your bag — or skip for a blank bag.</p>
                          <BagTextSelector
                            templateId={selectedTemplate.id}
                            onChange={setBagText}
                          />
                        </div>
                      </div>

                      {/* RIGHT: bag image preview with overlays */}
                      <div className="design-right">
                        <div className="bag-preview-sticky">
                          {bagImageUrl && (
                            <div className="bag-preview-overlay-wrap">
                              <img
                                src={bagImageUrl}
                                alt={selectedProduct.name}
                                className="bag-preview-img"
                              />
                              <div className="bag-preview-overlay">
                                {bagText && (
                                  <div className="bag-preview-text-overlay">
                                    {bagText.split('\n').map((line, i) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </div>
                                )}
                                {qrRenderedDataUrl && (
                                  <>
                                    <img
                                      src={qrRenderedDataUrl}
                                      alt="QR"
                                      className="bag-preview-qr-overlay"
                                    />
                                    <div className="bag-preview-url-overlay">
                                      loofabag.com/{slug || 'your-name'}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          <p className="bag-preview-name">{selectedProduct.name}</p>
                          <button
                            type="button"
                            className="download-design-btn"
                            onClick={downloadDesignPNG}
                            disabled={!qrRenderedDataUrl}
                          >
                            ↓ Download print file (9.5" PNG)
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* Step 3: Checkout */}
              {step === 3 && (
                <div className="step-content">
                  <h2>Checkout</h2>
                  <div className="checkout-summary">
                    <div className="summary-item">
                      <span>URL:</span>
                      <strong>loofabag.com/{slug}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Product:</span>
                      <strong>{PRODUCTS.find((p) => p.id === selectedProductId)?.name}</strong>
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div className="shipping-section">
                    <h3 className="shipping-section-title">Shipping address</h3>
                    <div className="shipping-form">
                      <div className="shipping-field shipping-field-full">
                        <label>Full name</label>
                        <input
                          className="shipping-input"
                          placeholder="Jane Smith"
                          value={address.customerName}
                          onChange={(e) => setAddress((a) => ({ ...a, customerName: e.target.value }))}
                        />
                      </div>
                      <div className="shipping-field">
                        <label>Country</label>
                        <select
                          className="shipping-input"
                          value={address.country}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, country: e.target.value, state: '' }));
                            setShippingRates([]);
                            setSelectedRateId('');
                          }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      {(address.country === 'CA' || address.country === 'US') && (
                        <div className="shipping-field">
                          <label>{address.country === 'CA' ? 'Province' : 'State'}</label>
                          <input
                            className="shipping-input"
                            placeholder={address.country === 'CA' ? 'e.g. ON' : 'e.g. CA'}
                            value={address.state}
                            onChange={(e) => {
                              setAddress((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }));
                              setShippingRates([]);
                              setSelectedRateId('');
                            }}
                          />
                        </div>
                      )}
                      <div className="shipping-field shipping-field-full">
                        <label>Street address</label>
                        <input
                          className="shipping-input"
                          placeholder="123 Main St"
                          value={address.address1}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, address1: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                          }}
                        />
                      </div>
                      <div className="shipping-field shipping-field-full">
                        <label>Apt, suite, unit <span className="shipping-optional">(optional)</span></label>
                        <input
                          className="shipping-input"
                          placeholder="Apt 4B"
                          value={address.address2}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, address2: e.target.value }));
                          }}
                        />
                      </div>
                      <div className="shipping-field">
                        <label>City</label>
                        <input
                          className="shipping-input"
                          placeholder="City"
                          value={address.city}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, city: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                          }}
                        />
                      </div>
                      <div className="shipping-field">
                        <label>Postal / ZIP code</label>
                        <input
                          className="shipping-input"
                          placeholder="Postal / ZIP"
                          value={address.zip}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, zip: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary get-rates-btn"
                      onClick={fetchShippingRates}
                      disabled={fetchingRates || !address.country}
                    >
                      {fetchingRates ? 'Getting rates…' : 'Get shipping rates'}
                    </button>

                    {ratesError && <p className="rates-error">{ratesError}</p>}

                    {shippingRates.length > 0 && (
                      <div className="shipping-rates">
                        <h4 className="shipping-rates-title">Select shipping</h4>
                        {shippingRates.map((rate) => (
                          <label key={rate.id} className={`shipping-rate-option${selectedRateId === rate.id ? ' selected' : ''}`}>
                            <input
                              type="radio"
                              name="shippingRate"
                              value={rate.id}
                              checked={selectedRateId === rate.id}
                              onChange={() => setSelectedRateId(rate.id)}
                            />
                            <span className="shipping-rate-name">{rate.name}</span>
                            <span className="shipping-rate-days">
                              {rate.minDeliveryDays}–{rate.maxDeliveryDays} business days
                            </span>
                            <span className="shipping-rate-price">
                              {rate.currency} ${parseFloat(rate.rate).toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-primary checkout-btn"
                    onClick={handleCheckout}
                    disabled={checkingOut || !selectedRateId}
                  >
                    {checkingOut ? 'Redirecting to payment…' : 'Complete Purchase'}
                  </button>
                </div>
              )}

              {/* Step 4: Order placement */}
              {step === 4 && (
                <div className="step-content">
                  {placingOrder && (
                    <div className="order-placing">
                      <div className="order-spinner" />
                      <h2>Placing your order…</h2>
                      <p className="step-subtitle">Generating your print file and placing your order with Printful — this takes a few seconds.</p>
                    </div>
                  )}
                  {!placingOrder && printfulOrder && (
                    <div className="order-confirmed">
                      <div className="order-confirmed-icon">✓</div>
                      <h2>Order Confirmed!</h2>
                      <p className="order-number-label">Order {printfulOrder.orderNumber}</p>
                      <div className="checkout-summary" style={{ marginTop: 20 }}>
                        <div className="summary-item">
                          <span>Product:</span>
                          <strong>{PRODUCTS.find((p) => p.id === selectedProductId)?.name}</strong>
                        </div>
                        <div className="summary-item">
                          <span>Ship to:</span>
                          <strong>{address.customerName}, {address.city}, {address.country}</strong>
                        </div>
                        <div className="summary-item">
                          <span>Status:</span>
                          <strong style={{ textTransform: 'capitalize' }}>{printfulOrder.status}</strong>
                        </div>
                      </div>
                      <p className="order-next-step">Next, set up your loofa profile — this is what people see when they scan your QR code.</p>
                    </div>
                  )}
                  {!placingOrder && orderError && (
                    <div className="order-error">
                      <div className="order-error-icon">✗</div>
                      <h2>Something went wrong</h2>
                      <p className="step-subtitle">{orderError}</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => { orderPlacedRef.current = false; placeOrder(stripeSessionId); }}
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: QR profile */}
              {step === 5 && (
                <div className="step-content">
                  <h2>Set Up Your Profile</h2>
                  <p className="step-subtitle">Choose a template, customize your fields, and fill in your info.</p>
                  <div className="template-grid">
                    {templateDefs.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                        onClick={() => selectTemplate(template)}
                      >
                        <div className="template-icon">{template.emoji}</div>
                        <h3>{template.name}</h3>
                        {template.fields.length > 0 ? (
                          <ul className="template-questions">
                            {template.fields.map((f, i) => (
                              <li key={i}>{f.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="template-blank-hint">Pick your own fields</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="question-editor">
                    <p className="question-editor-label">Profile Fields <span className="drag-hint">drag and drop to reorder</span></p>
                    {customFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className={`field-edit-row${dragIndex === idx ? ' dragging' : ''}${dragOverIndex === idx && dragIndex !== idx ? ' drag-over' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="field-config-row">
                          <span className="field-drag-handle" aria-label="Drag to reorder">⠿</span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(idx, { label: e.target.value })}
                            className="question-edit-input"
                            placeholder={`Field ${idx + 1} label`}
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as FormField['type'] })}
                            className="field-type-select"
                          >
                            <option value="text">Short text</option>
                            <option value="number">Number</option>
                            <option value="paragraph">Paragraph</option>
                            <option value="url">URL / Link</option>
                            <option value="photo">Photo</option>
                            <option value="file">File upload</option>
                          </select>
                          <button
                            type="button"
                            className="question-delete-btn"
                            onClick={() => removeField(idx)}
                            aria-label="Remove field"
                          >×</button>
                        </div>
                        <div className="field-preview">
                          {field.type === 'text' && (
                            <input
                              type="text"
                              className="field-preview-input"
                              placeholder={field.label || `Field ${idx + 1}`}
                              value={profileData[field.id] ?? ''}
                              onChange={(e) => handleProfileTextChange(field.id, e.target.value)}
                            />
                          )}
                          {field.type === 'number' && (
                            <input
                              type="number"
                              className="field-preview-input"
                              placeholder="0"
                              value={profileData[field.id] ?? ''}
                              onChange={(e) => handleProfileTextChange(field.id, e.target.value)}
                              min={0}
                            />
                          )}
                          {field.type === 'paragraph' && (
                            <textarea
                              className="field-preview-textarea"
                              placeholder={field.label || `Field ${idx + 1}`}
                              rows={3}
                              value={profileData[field.id] ?? ''}
                              onChange={(e) => handleProfileTextChange(field.id, e.target.value)}
                            />
                          )}
                          {field.type === 'url' && (
                            <input
                              type="url"
                              className="field-preview-input"
                              placeholder="https://"
                              value={profileData[field.id] ?? ''}
                              onChange={(e) => handleProfileTextChange(field.id, e.target.value)}
                            />
                          )}
                          {field.type === 'photo' && (
                            <DropZone
                              accept="image/*,.heic,.HEIC,.heif,.HEIF"
                              multiple
                              maxFiles={5}
                              onFiles={(files) => handleProfileFiles(field.id, files)}
                            />
                          )}
                          {field.type === 'file' && (
                            <DropZone
                              accept=".pdf,.doc,.docx"
                              onFiles={(files) => handleProfileFiles(field.id, files)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="field-editor-actions">
                      <button type="button" className="add-question-btn" onClick={addField}>
                        + Add field
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Submission form */}
              {step === 6 && (
                <div className="step-content">
                  <h2>Customize Submission Form</h2>
                  <p className="step-subtitle">These are the fields visitors fill in when they connect with you.</p>
                  <div className="template-grid">
                    {submissionTemplateDefs.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`template-card ${selectedSubmissionTemplate.id === template.id ? 'selected' : ''}`}
                        onClick={() => selectSubmissionTemplate(template)}
                      >
                        <div className="template-icon">{template.emoji}</div>
                        <h3>{template.name}</h3>
                        {template.fields.length > 0 ? (
                          <ul className="template-questions">
                            {template.fields.map((f, i) => <li key={i}>{f.label}</li>)}
                          </ul>
                        ) : (
                          <p className="template-blank-hint">Start from scratch</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="question-editor">
                    <p className="question-editor-label">Submission Fields <span className="drag-hint">drag and drop to reorder</span></p>
                    {submissionFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className={`field-edit-row${subDragIndex === idx ? ' dragging' : ''}${subDragOverIndex === idx && subDragIndex !== idx ? ' drag-over' : ''}`}
                        draggable
                        onDragStart={() => handleSubDragStart(idx)}
                        onDragOver={(e) => handleSubDragOver(e, idx)}
                        onDrop={(e) => handleSubDrop(e, idx)}
                        onDragEnd={handleSubDragEnd}
                      >
                        <div className="field-config-row">
                          <span className="field-drag-handle" aria-label="Drag to reorder">⠿</span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateSubField(idx, { label: e.target.value })}
                            className="question-edit-input"
                            placeholder={`Field ${idx + 1} label`}
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateSubField(idx, { type: e.target.value as FormField['type'] })}
                            className="field-type-select"
                          >
                            <option value="text">Short text</option>
                            <option value="number">Number</option>
                            <option value="paragraph">Paragraph</option>
                            <option value="url">URL / Link</option>
                            <option value="photo">Photo</option>
                            <option value="file">File upload</option>
                          </select>
                          <button type="button" className="question-delete-btn" onClick={() => removeSubField(idx)} aria-label="Remove field">×</button>
                        </div>
                        <div className="field-preview">
                          {field.type === 'text' && <input type="text" className="field-preview-input" placeholder={field.label || `Field ${idx + 1}`} />}
                          {field.type === 'number' && <input type="number" className="field-preview-input" placeholder="0" />}
                          {field.type === 'paragraph' && <textarea className="field-preview-textarea" placeholder={field.label || `Field ${idx + 1}`} rows={3} />}
                          {field.type === 'url' && <input type="url" className="field-preview-input" placeholder="https://" />}
                          {field.type === 'photo' && <DropZone accept="image/*,.heic,.HEIC,.heif,.HEIF" multiple maxFiles={5} />}
                          {field.type === 'file' && <DropZone accept=".pdf,.doc,.docx" />}
                        </div>
                      </div>
                    ))}
                    <div className="field-editor-actions">
                      <button type="button" className="add-question-btn" onClick={addSubField}>+ Add field</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '30px' }}>
                {step === 4 ? (
                  <>
                    <div />
                    <div className="step-indicator">Step {step} of 6</div>
                    {printfulOrder && (
                      <button className="btn btn-primary" onClick={handleNext}>
                        Set up my profile →
                      </button>
                    )}
                    {(placingOrder || orderError) && <div />}
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={handlePrev} disabled={step === 1}>
                      Back
                    </button>
                    <div className="step-indicator">Step {step} of 6</div>
                    {step === 6 ? (
                      <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                        {creating ? 'Creating…' : 'Create Loofa'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={step === 1 && !step1Valid}
                      >
                        Next
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
