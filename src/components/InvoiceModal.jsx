import React from 'react';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const invoiceNumber = order.reference || order.orderId || `TN-${order._id?.slice(-6) || 'INV01'}`;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleDateString('en-IN');

  const items = order.items || [];
  const subtotal = order.subtotal || items.reduce((s, it) => s + (it.price * it.quantity), 0);
  const total = order.total || subtotal;
  const discount = order.discount || 0;
  const shipping = order.shippingFee !== undefined ? order.shippingFee : (subtotal >= 999 ? 0 : 49);

  // Robust Cross-Browser Print / Save as PDF
  const handlePrint = () => {
    // Generate an isolated printable document in a hidden iframe
    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const content = document.getElementById('printable-invoice-content')?.innerHTML;
    const doc = iframe.contentWindow || iframe.contentDocument;
    const docTarget = doc.document || doc;

    docTarget.open();
    docTarget.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_${invoiceNumber}</title>
          <meta charset="utf-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif; }
            body { background: #ffffff; color: #000000; padding: 40px; }
            .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; }
            .invoice-paid-stamp { display: inline-block; border: 3px solid #000000; color: #000000; font-weight: 900; font-size: 13px; padding: 4px 12px; letter-spacing: 0.1em; transform: rotate(-5deg); border-radius: 4px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            .invoice-table th { border-bottom: 2px solid #000000; padding: 10px 6px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .invoice-table td { padding: 12px 6px; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
            .invoice-totals { margin-left: auto; width: 280px; display: flex; flex-direction: column; gap: 8px; margin-top: 20px; border-top: 2px solid #000000; padding-top: 12px; }
            @page { margin: 15mm; size: auto; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    docTarget.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  // Direct Download Invoice as HTML / PDF format file
  const handleDownloadInvoice = () => {
    const content = document.getElementById('printable-invoice-content')?.innerHTML;
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice_${invoiceNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif; }
    body { background: #ffffff; color: #000000; padding: 40px; max-width: 720px; margin: 0 auto; }
    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
    .invoice-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; }
    .invoice-paid-stamp { display: inline-block; border: 3px solid #000; color: #000; font-weight: 900; font-size: 13px; padding: 4px 12px; letter-spacing: 0.1em; transform: rotate(-5deg); border-radius: 4px; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .invoice-table th { border-bottom: 2px solid #000; padding: 10px 6px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .invoice-table td { padding: 12px 6px; border-bottom: 1px solid #e4e4e7; font-size: 13px; }
    .invoice-totals { margin-left: auto; width: 280px; display: flex; flex-direction: column; gap: 8px; margin-top: 20px; border-top: 2px solid #000; padding-top: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ToyNest_Invoice_${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '700px', backgroundColor: '#ffffff', color: '#09090b', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close no-print"
          onClick={onClose}
          aria-label="Close invoice"
          style={{ background: '#f4f4f5', color: '#09090b', borderColor: '#d4d4d8' }}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="invoice-container">
          {/* Printable Body Content */}
          <div id="printable-invoice-content">
            {/* Header */}
            <div className="invoice-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <div style={{ width: '28px', height: '28px', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontWeight: 900, fontSize: '14px' }}>
                    TN
                  </div>
                  <h2 className="invoice-title">TOYNEST STORE</h2>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#52525b' }}>
                  Premium Toys & Early Learning Essentials<br />
                  support@toynest.local | +91 (80) 4567-8900
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="invoice-paid-stamp">PAID • UPI QR</div>
                <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.5rem' }}>
                  Invoice: <strong>#{invoiceNumber}</strong><br />
                  Date: {orderDate}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e4e4e7', fontSize: '0.85rem' }}>
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#71717a', letterSpacing: '0.05em' }}>
                  Billed & Shipped To:
                </strong>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  {order.customer?.name || 'Valued Customer'}
                </div>
                <div style={{ color: '#52525b', marginTop: '0.2rem' }}>
                  {order.customer?.phone}<br />
                  {order.customer?.email}<br />
                  {order.customer?.address}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#71717a', letterSpacing: '0.05em' }}>
                  Payment Summary:
                </strong>
                <div style={{ marginTop: '0.2rem', color: '#52525b' }}>
                  Method: <strong>UPI QR (Scan & Pay)</strong><br />
                  Transaction Ref: <strong>{order.payment?.reference || invoiceNumber}</strong><br />
                  Status: <strong style={{ color: '#000000' }}>Completed / Verified</strong>
                </div>
              </div>
            </div>

            {/* Itemized Table showing Individual Price & Line Total */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Toy Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const unitPrice = item.price;
                  const qty = item.quantity;
                  const lineTotal = unitPrice * qty;

                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.category && (
                          <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{item.category}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₹{unitPrice.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                        ₹{lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="invoice-totals">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Discount:</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Delivery Charges:</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, borderTop: '1px solid #000000', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <span>Total Paid:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer Note */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #e4e4e7', textAlign: 'center', fontSize: '0.75rem', color: '#71717a' }}>
              Thank you for shopping at ToyNest! All toys comply with safety and non-toxic standards.
              <br />
              This is a computer-generated tax invoice verified electronically through UPI QR Payment.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, minWidth: '160px', background: '#000000', color: '#ffffff', borderColor: '#000000' }}
              onClick={handlePrint}
            >
              <i className="fa-solid fa-print" /> Print / Save as PDF
            </button>

            <button
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '160px', background: '#f4f4f5', color: '#000000', borderColor: '#d4d4d8' }}
              onClick={handleDownloadInvoice}
            >
              <i className="fa-solid fa-download" /> Download Invoice
            </button>

            <button
              className="btn btn-outline"
              style={{ borderColor: '#d4d4d8', color: '#000000' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
