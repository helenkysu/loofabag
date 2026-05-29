'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';
import QRDesigner, { renderQRToCanvas } from '@/app/components/QRDesigner';
import type { QRDesignOptions } from '@/app/components/QRDesigner';
import BagTextSelector from '@/app/components/BagTextSelector';

type ProductVariant = { id: string; label: string; image: string };
type Product = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  variants: ProductVariant[] | null;
  dimensions?: string;
  specs?: string[];
};

const PRODUCTS: Product[] = [
  {
    id: 'eco-tote',
    name: 'Eco Tote Bag',
    description: 'Classic canvas tote',
    image: '/bagimages/ecototebag.webp',
    variants: null,
    dimensions: '16″ × 14½″ × 5″',
    specs: ['100% organic cotton', 'Holds up to 30 lbs', 'Durable & eco-friendly'],
  },
  {
    id: 'large-eco-tote',
    name: 'Large Eco Tote Bag',
    description: 'Extra room for everything',
    image: '/bagimages/largeecotote.webp',
    variants: null,
    dimensions: '20″ × 14″ × 5″',
    specs: ['100% organic cotton', 'Roomy & lightweight', 'Sustainably made'],
  },
  {
    id: 'premium-large-tote',
    name: 'Premium Large Tote Bag',
    description: 'Oversized luxury tote',
    image: '/bagimages/premiumtote-black.webp',
    variants: null,
    dimensions: '16″ × 20″',
    specs: ['100% polyester with fusible backing', 'Holds up to 44 lbs', 'Interior pocket + cotton handles'],
  },
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
  // North America
  { code: 'CA', name: 'Canada' },
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  // Europe
  { code: 'AL', name: 'Albania' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'XK', name: 'Kosovo' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SM', name: 'San Marino' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'GB', name: 'United Kingdom' },
  // Asia Pacific
  { code: 'AU', name: 'Australia' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CN', name: 'China' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'MO', name: 'Macau' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KR', name: 'South Korea' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  // Middle East
  { code: 'BH', name: 'Bahrain' },
  { code: 'IL', name: 'Israel' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'OM', name: 'Oman' },
  { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  // Africa
  { code: 'BW', name: 'Botswana' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Senegal' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  // Latin America & Caribbean
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'PA', name: 'Panama' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'UY', name: 'Uruguay' },
];

// Countries where a state / province is required by Printful
const STATE_REQUIRED = new Set(['US', 'CA', 'AU', 'BR', 'IN', 'MX', 'AR', 'MY']);
const STATE_LABEL: Record<string, string> = {
  US: 'State', CA: 'Province', AU: 'State', BR: 'State', IN: 'State / UT',
  MX: 'State', AR: 'Province', MY: 'State',
};
const STATE_PLACEHOLDER: Record<string, string> = {
  US: 'e.g. CA', CA: 'e.g. ON', AU: 'e.g. NSW', BR: 'e.g. SP', IN: 'e.g. MH',
  MX: 'e.g. JAL', AR: 'e.g. BA', MY: 'e.g. KL',
};
// 2-char code countries vs free-text
const STATE_SHORT_CODE = new Set(['US', 'CA']);

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
}

function getBagImageUrl(productId: string): string {
  return PRODUCTS.find((p) => p.id === productId)?.image ?? '';
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'video' | 'url' | 'file';
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
  const [addressErrors, setAddressErrors] = useState<Record<string, boolean>>({});
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
  const [qrToken, setQrToken] = useState('');
  const [backDesign, setBackDesign] = useState<'blank' | 'duplicate' | 'universe' | 'grass'>('blank');
  const [checkoutPreviewSide, setCheckoutPreviewSide] = useState<'front' | 'back'>('front');

  // Notification settings
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifEmail, setNotifEmail] = useState('');

  // Availability data from Printful
  type VariantOption = { id: number; label: string; colorCode: string | null };
  type ProductAvailability = { inStock: boolean; defaultVariantId: number | null; variants: VariantOption[] | null };
  const [availability, setAvailability] = useState<Record<string, ProductAvailability>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const didSave = useRef(false);
  const loofaIdRef = useRef(Date.now().toString());
  const qrDesignRef = useRef<QRDesignOptions | null>(null);
  const orderPlacedRef = useRef(false);
  const designStep2Ref = useRef<HTMLDivElement>(null);
  const designStep3Ref = useRef<HTMLDivElement>(null);

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  // Check slug uniqueness against existing loofas in DB
  useEffect(() => {
    if (!slug) { setSlugTaken(false); return; }
    fetch(`/api/loofas/by-slug?slug=${encodeURIComponent(slug)}`)
      .then((r) => { setSlugTaken(r.ok); })
      .catch(() => setSlugTaken(false));
  }, [slug]);

  // Initialize QR token on mount (fresh session) or restore after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resume = params.get('resume');

    if (resume) {
      // Post-Stripe restore path
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
          if (draft.qrToken) setQrToken(draft.qrToken);
        } catch {}
      }
      setStep(Number(resume));
      window.history.replaceState({}, '', '/my-loofas/create');
    } else {
      // Fresh session — generate or reuse token
      const savedToken = sessionStorage.getItem('loofabag_qr_token');
      if (savedToken) {
        setQrToken(savedToken);
      } else {
        const newToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        sessionStorage.setItem('loofabag_qr_token', newToken);
        setQrToken(newToken);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill notification email from signed-in session
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setNotifEmail(data.user.email);
    });
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

    const loofaId = loofaIdRef.current;

    const updatedProfileData = { ...profileData };

    await Promise.all(
      customFields
        .filter((f) => (f.type === 'photo' || f.type === 'video' || f.type === 'file') && pendingProfileFiles[f.id]?.length)
        .map(async (field) => {
          const fd = new FormData();
          fd.append('loofa_id', loofaId);
          const uploadType = field.type === 'photo' ? 'photos' : field.type === 'video' ? 'videos' : 'files';
          fd.append('type', uploadType);
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
      name: name || 'My Loofa',
      slug,
      qrToken: qrToken || null,
      template: selectedTemplate.id,
      emoji: selectedTemplate.emoji,
      profileFields: customFields.filter((f) => f.label.trim()),
      fields: submissionFields.filter((f) => f.label.trim()),
      profileData: updatedProfileData,
      isActive: true,
    };
    await fetch('/api/loofas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoofa),
    }).catch(console.error);

    // Register the QR token → slug mapping
    if (qrToken) {
      fetch('/api/qr-redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: qrToken, loofa_id: loofaId, slug }),
      }).catch(console.error);
    }

    // Save notification settings
    if (notifEmail.trim()) {
      fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: notifEmail.trim(), enabled: notifEnabled }),
      }).catch(console.error);
    }

    // Use pre-rendered design if available, otherwise fall back to server generation
    if (qrRenderedDataUrl) {
      setQrDataUrl(qrRenderedDataUrl);
      fetch('/api/upload/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loofa_id: loofaId, imageData: qrRenderedDataUrl }),
      }).catch(console.error);
    } else {
      const qrUrl = `${getSiteUrl()}/${slug}`;
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
      const qrUrl = qrToken ? `${getSiteUrl()}/q/${qrToken}` : `${getSiteUrl()}/${slug || 'your-name'}`;
      await renderQRToCanvas(qrCanvas, qrUrl, qrDesignRef.current);
      ctx.drawImage(qrCanvas, Math.round(cx - qrPx / 2), y, qrPx, qrPx);
      y += qrPx + Math.round(PX * 0.02);
    }

    // 3. URL (shows friendly slug URL for human readability)
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
    const printQrUrl = qrToken ? `${getSiteUrl()}/q/${qrToken}` : `${getSiteUrl()}/${slug || 'your-name'}`;
    await renderQRToCanvas(qrCanvas, printQrUrl, design);
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
          variantId: selectedVariantId ?? undefined,
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
  // Fetch availability once when reaching the design step
  useEffect(() => {
    if (step !== 2 || Object.keys(availability).length > 0) return;
    fetch('/api/products/availability')
      .then((r) => r.json())
      .then((data: Record<string, ProductAvailability>) => {
        setAvailability(data);
        // Set default variant for whichever product is currently selected
        const avail = data[selectedProductId];
        if (avail?.defaultVariantId && !selectedVariantId) {
          setSelectedVariantId(avail.defaultVariantId);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
    // Validate required fields
    const errors: Record<string, boolean> = {};
    if (!address.customerName.trim()) errors.customerName = true;
    if (!address.address1.trim()) errors.address1 = true;
    if (!address.city.trim()) errors.city = true;
    if (!address.zip.trim()) errors.zip = true;
    if (STATE_REQUIRED.has(address.country) && !address.state.trim()) errors.state = true;
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFetchingRates(true);
    setRatesError('');
    setShippingRates([]);
    setSelectedRateId('');
    try {
      const res = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, variantId: selectedVariantId ?? undefined, ...address }),
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
      qrToken,
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

                const frontPreview = bagImageUrl && (
                  <div className="bag-preview-sticky">
                    <div className="bag-preview-overlay-wrap">
                      <img src={bagImageUrl} alt={selectedProduct.name} className="bag-preview-img" />
                      <div className="bag-preview-overlay">
                        {bagText && (
                          <div className="bag-preview-text-overlay">
                            {bagText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                          </div>
                        )}
                        {qrRenderedDataUrl && (
                          <>
                            <img src={qrRenderedDataUrl} alt="QR" className="bag-preview-qr-overlay" />
                            <div className="bag-preview-url-overlay">loofabag.com/{slug || 'your-name'}</div>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="bag-preview-name">{selectedProduct.name} · Front</p>
                    <button
                      type="button"
                      className="download-design-btn"
                      onClick={downloadDesignPNG}
                      disabled={!qrRenderedDataUrl}
                    >
                      ↓ Download print file (9.5" PNG)
                    </button>
                  </div>
                );

                const backPreview = bagImageUrl && (
                  <div className="bag-preview-sticky">
                    <div className="bag-preview-overlay-wrap">
                      <img src={bagImageUrl} alt={selectedProduct.name} className="bag-preview-img" />
                      <div className="bag-preview-overlay">
                        {backDesign === 'duplicate' && (
                          <>
                            {bagText && (
                              <div className="bag-preview-text-overlay">
                                {bagText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                              </div>
                            )}
                            {qrRenderedDataUrl && (
                              <>
                                <img src={qrRenderedDataUrl} alt="QR" className="bag-preview-qr-overlay" />
                                <div className="bag-preview-url-overlay">loofabag.com/{slug || 'your-name'}</div>
                              </>
                            )}
                          </>
                        )}
                        {backDesign === 'universe' && (
                          <div className="back-placeholder back-placeholder-universe">
                            <span className="back-placeholder-emoji">🌌</span>
                            <span className="back-placeholder-text">Universe do your thing</span>
                            <span className="back-placeholder-sub">Design coming soon</span>
                          </div>
                        )}
                        {backDesign === 'grass' && (
                          <div className="back-placeholder back-placeholder-grass">
                            <span className="back-placeholder-emoji">🌿</span>
                            <span className="back-placeholder-text">I&apos;m touching grass</span>
                            <span className="back-placeholder-sub">Design coming soon</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="bag-preview-name">{selectedProduct.name} · Back</p>
                  </div>
                );

                return (
                  <div className="step-content step-content-wide">
                    <h2>Design Your Loofa</h2>

                    {/* ── Sub-step 1: Pick your bag ── */}
                    <div className="design-substep">
                      <div className="design-substep-header">
                        <span className="design-substep-num">1</span>
                        <h3 className="design-substep-title">Pick Your Bag</h3>
                      </div>
                      <div className="design-substep-body">
                        <div className="product-selector">
                          {PRODUCTS.map((product) => {
                              const avail = availability[product.id];
                              const oos = avail ? !avail.inStock : false;
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  disabled={oos}
                                  className={`product-card${selectedProductId === product.id ? ' selected' : ''}${oos ? ' product-card-oos' : ''}`}
                                  onClick={() => {
                                    setSelectedProductId(product.id);
                                    const def = availability[product.id]?.defaultVariantId ?? null;
                                    setSelectedVariantId(def);
                                  }}
                                >
                                  <div className="product-card-img-wrap">
                                    {product.image && (
                                      <img src={product.image} alt={product.name} className="product-card-img" />
                                    )}
                                    {oos && <div className="product-card-oos-badge">Out of stock</div>}
                                  </div>
                                  <div className="product-card-info">
                                    <div className="product-card-title-row">
                                      <span className="product-card-name">{product.name}</span>
                                      {product.dimensions && (
                                        <span className="product-card-dims">{product.dimensions}</span>
                                      )}
                                    </div>
                                    {product.specs && (
                                      <div className="product-card-specs">
                                        {product.specs.map((s) => (
                                          <span key={s} className="product-card-spec">{s}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                          })}
                        </div>
                        {/* Handle colour picker for premium tote */}
                        {(() => {
                          const variants = availability[selectedProductId]?.variants;
                          if (!variants?.length) return null;
                          return (
                            <div className="handle-color-picker">
                              <p className="handle-color-label">Handle colour</p>
                              <div className="handle-color-options">
                                {variants.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    className={`handle-color-swatch${selectedVariantId === v.id ? ' selected' : ''}`}
                                    style={{ background: v.colorCode ?? '#ccc' }}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    title={v.label}
                                  >
                                    {selectedVariantId === v.id && <span className="handle-color-check">✓</span>}
                                  </button>
                                ))}
                                <span className="handle-color-name">
                                  {variants.find((v) => v.id === selectedVariantId)?.label ?? ''}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* ── Sub-step 2: Front design ── */}
                    <div className="design-substep" ref={designStep2Ref}>
                      <div className="design-substep-header">
                        <span className="design-substep-num">2</span>
                        <h3 className="design-substep-title">Front Design</h3>
                      </div>
                      <div className="design-substep-body">
                        <div className="design-two-col">
                          <div className="design-left">
                            <p className="step-subtitle" style={{ marginBottom: 12 }}>Customize your QR code and add bag text.</p>
                            <QRDesigner
                              url={qrToken ? `${getSiteUrl()}/q/${qrToken}` : getSiteUrl()}
                              onDataUrl={setQrRenderedDataUrl}
                              onDesignChange={(d) => { qrDesignRef.current = d; }}
                            />
                            <div style={{ marginTop: 20 }}>
                              <p className="step-subtitle" style={{ marginBottom: 8 }}>Bag text <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></p>
                              <BagTextSelector
                                templateId={selectedTemplate.id}
                                onChange={setBagText}
                              />
                            </div>
                            <button
                              type="button"
                              className="design-substep-next"
                              onClick={() => {
                                setTimeout(() => designStep3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
                              }}
                            >
                              Next: Back Design ↓
                            </button>
                          </div>
                          <div className="design-right">
                            {frontPreview}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Sub-step 3: Back design ── */}
                    <div className="design-substep design-substep-last" ref={designStep3Ref}>
                      <div className="design-substep-header">
                        <span className="design-substep-num">3</span>
                        <h3 className="design-substep-title">Back Design</h3>
                      </div>
                      <div className="design-substep-body">
                        <div className="design-two-col">
                          <div className="design-left">
                            <p className="step-subtitle" style={{ marginBottom: 12 }}>Choose what goes on the back of your bag.</p>
                            <div className="back-design-grid">
                              {([
                                { id: 'blank', label: 'Blank', desc: 'Nothing on the back', emoji: '◻️' },
                                { id: 'duplicate', label: 'Duplicate front', desc: 'Same QR on the back', emoji: '🔁' },
                                { id: 'universe', label: 'Universe do your thing', desc: 'Cosmic surprise', emoji: '🌌' },
                                { id: 'grass', label: "I'm touching grass", desc: 'Nature vibes', emoji: '🌿' },
                              ] as const).map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={`back-design-card${backDesign === opt.id ? ' selected' : ''}`}
                                  onClick={() => setBackDesign(opt.id)}
                                >
                                  <span className="back-design-emoji">{opt.emoji}</span>
                                  <span className="back-design-label">{opt.label}</span>
                                  <span className="back-design-desc">{opt.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="design-right">
                            {backPreview}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Step 3: Checkout */}
              {step === 3 && (() => {
                const checkoutProduct = PRODUCTS.find((p) => p.id === selectedProductId)!;
                const checkoutBagUrl = getBagImageUrl(selectedProductId);
                return (
                <div className="step-content step-content-wide">
                  <div className="checkout-two-col">
                    <div className="checkout-form-col">
                  <h2>Checkout</h2>
                  <div className="checkout-summary">
                    <div className="summary-item">
                      <span>URL:</span>
                      <strong>loofabag.com/{slug}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Product:</span>
                      <strong>{checkoutProduct?.name}</strong>
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div className="shipping-section">
                    <h3 className="shipping-section-title">Shipping address</h3>
                    <div className="shipping-form">
                      <div className="shipping-field shipping-field-full">
                        <label>Full name</label>
                        <input
                          className={`shipping-input${addressErrors.customerName ? ' shipping-input-error' : ''}`}
                          placeholder="Jane Smith"
                          value={address.customerName}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, customerName: e.target.value }));
                            if (e.target.value.trim()) setAddressErrors((err) => ({ ...err, customerName: false }));
                          }}
                        />
                        {addressErrors.customerName && <p className="shipping-field-error">Full name is required</p>}
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
                            setAddressErrors((err) => ({ ...err, state: false }));
                          }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      {STATE_REQUIRED.has(address.country) && (
                        <div className="shipping-field">
                          <label>{STATE_LABEL[address.country] ?? 'State / Region'}</label>
                          <input
                            className={`shipping-input${addressErrors.state ? ' shipping-input-error' : ''}`}
                            placeholder={STATE_PLACEHOLDER[address.country] ?? ''}
                            value={address.state}
                            onChange={(e) => {
                              const val = STATE_SHORT_CODE.has(address.country)
                                ? e.target.value.toUpperCase().slice(0, 2)
                                : e.target.value;
                              setAddress((a) => ({ ...a, state: val }));
                              setShippingRates([]);
                              setSelectedRateId('');
                              if (val.trim()) setAddressErrors((err) => ({ ...err, state: false }));
                            }}
                          />
                          {addressErrors.state && <p className="shipping-field-error">{STATE_LABEL[address.country] ?? 'State'} is required</p>}
                        </div>
                      )}
                      <div className="shipping-field shipping-field-full">
                        <label>Street address</label>
                        <input
                          className={`shipping-input${addressErrors.address1 ? ' shipping-input-error' : ''}`}
                          placeholder="123 Main St"
                          value={address.address1}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, address1: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                            if (e.target.value.trim()) setAddressErrors((err) => ({ ...err, address1: false }));
                          }}
                        />
                        {addressErrors.address1 && <p className="shipping-field-error">Street address is required</p>}
                      </div>
                      <div className="shipping-field shipping-field-full">
                        <label>Apt, suite, unit <span className="shipping-optional">(optional)</span></label>
                        <input
                          className="shipping-input"
                          placeholder="Apt 4B"
                          value={address.address2}
                          onChange={(e) => setAddress((a) => ({ ...a, address2: e.target.value }))}
                        />
                      </div>
                      <div className="shipping-field">
                        <label>City</label>
                        <input
                          className={`shipping-input${addressErrors.city ? ' shipping-input-error' : ''}`}
                          placeholder="City"
                          value={address.city}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, city: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                            if (e.target.value.trim()) setAddressErrors((err) => ({ ...err, city: false }));
                          }}
                        />
                        {addressErrors.city && <p className="shipping-field-error">City is required</p>}
                      </div>
                      <div className="shipping-field">
                        <label>Postal / ZIP code</label>
                        <input
                          className={`shipping-input${addressErrors.zip ? ' shipping-input-error' : ''}`}
                          placeholder="Postal / ZIP"
                          value={address.zip}
                          onChange={(e) => {
                            setAddress((a) => ({ ...a, zip: e.target.value }));
                            setShippingRates([]);
                            setSelectedRateId('');
                            if (e.target.value.trim()) setAddressErrors((err) => ({ ...err, zip: false }));
                          }}
                        />
                        {addressErrors.zip && <p className="shipping-field-error">Postal code is required</p>}
                      </div>
                    </div>

                    <p className="shipping-restrictions-note">
                      🚫 Printful does not ship to Russia, Belarus, North Korea, Iran, Cuba, Syria, Sudan, or other sanctioned territories.
                    </p>

                    <button
                      type="button"
                      className="btn btn-secondary get-rates-btn"
                      onClick={fetchShippingRates}
                      disabled={fetchingRates}
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
                    </div>{/* end checkout-form-col */}

                    {/* Bag preview */}
                    <div className="checkout-preview-col">
                      <div className="bag-preview-sticky">
                        <div className="bag-side-tabs">
                          <button type="button" className={`bag-side-tab${checkoutPreviewSide === 'front' ? ' bag-side-tab-active' : ''}`} onClick={() => setCheckoutPreviewSide('front')}>Front</button>
                          <button type="button" className={`bag-side-tab${checkoutPreviewSide === 'back' ? ' bag-side-tab-active' : ''}`} onClick={() => setCheckoutPreviewSide('back')}>Back</button>
                        </div>
                        {checkoutBagUrl && (
                          <div className="bag-preview-overlay-wrap">
                            <img src={checkoutBagUrl} alt={checkoutProduct?.name} className="bag-preview-img" />
                            {checkoutPreviewSide === 'front' && (
                              <div className="bag-preview-overlay">
                                {bagText && (
                                  <div className="bag-preview-text-overlay">
                                    {bagText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                  </div>
                                )}
                                {qrRenderedDataUrl && (
                                  <>
                                    <img src={qrRenderedDataUrl} alt="QR" className="bag-preview-qr-overlay" />
                                    <div className="bag-preview-url-overlay">loofabag.com/{slug || 'your-name'}</div>
                                  </>
                                )}
                              </div>
                            )}
                            {checkoutPreviewSide === 'back' && (
                              <div className="bag-preview-overlay">
                                {backDesign === 'duplicate' && (
                                  <>
                                    {bagText && (
                                      <div className="bag-preview-text-overlay">
                                        {bagText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                      </div>
                                    )}
                                    {qrRenderedDataUrl && (
                                      <>
                                        <img src={qrRenderedDataUrl} alt="QR" className="bag-preview-qr-overlay" />
                                        <div className="bag-preview-url-overlay">loofabag.com/{slug || 'your-name'}</div>
                                      </>
                                    )}
                                  </>
                                )}
                                {backDesign === 'universe' && (
                                  <div className="back-placeholder back-placeholder-universe">
                                    <span className="back-placeholder-emoji">🌌</span>
                                    <span className="back-placeholder-text">Universe do your thing</span>
                                    <span className="back-placeholder-sub">Design coming soon</span>
                                  </div>
                                )}
                                {backDesign === 'grass' && (
                                  <div className="back-placeholder back-placeholder-grass">
                                    <span className="back-placeholder-emoji">🌿</span>
                                    <span className="back-placeholder-text">I&apos;m touching grass</span>
                                    <span className="back-placeholder-sub">Design coming soon</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="bag-preview-name">{checkoutProduct?.name} · {checkoutPreviewSide === 'front' ? 'Front' : 'Back'}</p>
                      </div>
                    </div>
                  </div>{/* end checkout-two-col */}
                </div>
                );
              })()}

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
                            <option value="video">Video</option>
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
                              maxFiles={10}
                              maxSizeMB={5}
                              onFiles={(files) => handleProfileFiles(field.id, files)}
                            />
                          )}
                          {field.type === 'video' && (
                            <DropZone
                              accept="video/*,.mp4,.mov,.avi,.webm"
                              multiple
                              maxFiles={2}
                              maxSizeMB={50}
                              maxDurationSeconds={120}
                              onFiles={(files) => handleProfileFiles(field.id, files)}
                            />
                          )}
                          {field.type === 'file' && (
                            <DropZone
                              accept=".pdf,.docx"
                              maxFiles={1}
                              maxSizeMB={5}
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
                          {field.type === 'photo' && <DropZone accept="image/*,.heic,.HEIC,.heif,.HEIF" multiple maxFiles={5} maxSizeMB={5} />}
                          {field.type === 'file' && <DropZone accept=".pdf,.docx" maxFiles={1} maxSizeMB={5} />}
                        </div>
                      </div>
                    ))}
                    <div className="field-editor-actions">
                      <button type="button" className="add-question-btn" onClick={addSubField}>+ Add field</button>
                    </div>
                  </div>

                  <div className="notif-settings-section">
                    <label className="notif-toggle-row">
                      <span className="notif-toggle-label">
                        <span className="notif-toggle-title">Email notifications for new submissions</span>
                        <span className="notif-toggle-desc">Get an email every time someone submits a response</span>
                      </span>
                      <input
                        type="checkbox"
                        className="notif-checkbox"
                        checked={notifEnabled}
                        onChange={(e) => setNotifEnabled(e.target.checked)}
                      />
                    </label>
                    {notifEnabled && (
                      <div className="notif-email-row">
                        <label className="notif-email-label">Notification email</label>
                        <input
                          type="email"
                          className="notif-email-input"
                          placeholder="you@example.com"
                          value={notifEmail}
                          onChange={(e) => setNotifEmail(e.target.value)}
                        />
                      </div>
                    )}
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
