'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

interface Loofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

interface Tracking {
  trackingNumber: string;
  trackingUrl: string | null;
  carrier: string | null;
  service: string | null;
  shipDate: string | null;
  estimatedDelivery: string | null;
}

interface Order {
  id: string;
  slug: string;
  productId: string;
  productName: string;
  productImage: string | null;
  amountTotal: number | null;
  currency: string | null;
  shippingLabel: string | null;
  address: Record<string, string>;
  printfulOrderNumber: string | null;
  status: string;
  tracking: Tracking | null;
  checkoutDraft: object | null;
  createdAt: string;
}

const STATUS_INFO: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'pending' },
  pending: { label: 'Processing', className: 'pending' },
  inprocess: { label: 'In Production', className: 'pending' },
  onhold: { label: 'On Hold', className: 'onhold' },
  partial: { label: 'Partially Shipped', className: 'shipped' },
  fulfilled: { label: 'Shipped', className: 'shipped' },
  canceled: { label: 'Canceled', className: 'canceled' },
  failed: { label: 'Failed', className: 'canceled' },
};

function statusInfo(status: string) {
  return STATUS_INFO[status] ?? { label: status.charAt(0).toUpperCase() + status.slice(1), className: 'pending' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrdersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/loofas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        setLoofa(data.loofa);
        return fetch(`/api/orders?slug=${encodeURIComponent(data.loofa.slug)}`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setOrders(data.orders ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleReorder = (order: Order) => {
    if (!order.checkoutDraft) return;
    sessionStorage.setItem('loofabag_checkout_draft', JSON.stringify(order.checkoutDraft));
    router.push('/my-loofas/create?resume=3&reorder=1');
  };

  if (notFound) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container">
            <p>Loofa not found.</p>
            <Link href="/my-loofas" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
              Back to My Loofas
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container">
          <Link href={`/my-loofas/${id}`} className="back-link">← Back</Link>
          <h1>Order Tracking</h1>
          {loofa && (
            <p className="step-subtitle">
              {loofa.emoji} {loofa.name} · loofabag.com/{loofa.slug}
            </p>
          )}

          {loading ? (
            <p className="step-subtitle">Loading…</p>
          ) : orders.length === 0 ? (
            <p className="orders-empty">No orders yet for this loofa.</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const info = statusInfo(order.status);
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-card-header">
                      {order.productImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.productImage} alt={order.productName} className="order-card-thumb" />
                      )}
                      <div className="order-card-title">
                        <h3>{order.productName}</h3>
                        <p className="order-card-meta">
                          {order.printfulOrderNumber ?? '—'} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`order-status-badge order-status-${info.className}`}>
                        {info.label}
                      </span>
                    </div>

                    <div className="checkout-summary">
                      <div className="summary-item">
                        <span>Payment:</span>
                        <strong>
                          {order.amountTotal != null
                            ? `${(order.amountTotal / 100).toFixed(2)} ${order.currency?.toUpperCase() ?? ''}`
                            : '—'}
                        </strong>
                      </div>
                      {order.shippingLabel && (
                        <div className="summary-item">
                          <span>Shipping:</span>
                          <strong>{order.shippingLabel}</strong>
                        </div>
                      )}
                    </div>

                    <div className="order-address">
                      <p className="order-address-label">Shipping address</p>
                      {order.address.customerName && <p>{order.address.customerName}</p>}
                      <p>
                        {order.address.address1}
                        {order.address.address2 ? `, ${order.address.address2}` : ''}
                      </p>
                      <p>
                        {order.address.city}
                        {order.address.state ? `, ${order.address.state}` : ''} {order.address.zip}
                      </p>
                      <p>{order.address.country}</p>
                    </div>

                    {order.tracking && (
                      <div className="order-tracking">
                        <p className="order-tracking-label">
                          {order.tracking.carrier ?? 'Carrier'}
                          {order.tracking.service ? ` · ${order.tracking.service}` : ''}
                        </p>
                        {order.tracking.trackingUrl ? (
                          <a
                            href={order.tracking.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="order-tracking-link"
                          >
                            Track package — {order.tracking.trackingNumber} →
                          </a>
                        ) : (
                          <p className="order-tracking-number">Tracking #: {order.tracking.trackingNumber}</p>
                        )}
                        {order.tracking.estimatedDelivery && (
                          <p className="order-tracking-eta">
                            Estimated delivery: {formatDate(order.tracking.estimatedDelivery)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="order-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={!order.checkoutDraft}
                        onClick={() => handleReorder(order)}
                      >
                        Order Again
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
