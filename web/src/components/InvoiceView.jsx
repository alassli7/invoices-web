import { useEffect, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import JsBarcode from "jsbarcode"
import {
  formatCurrency,
  formatTotal,
  formatDate,
  calcSubtotal,
  buildShareUrl,
  whatsappShareUrl,
  docLabel,
  docLogo,
  itemTotal,
  itemExtrasTotal,
  hasVat,
  getVatRate,
  getTaxNumber,
  vatAmount,
  invoiceTotal,
  getBankLogo,
  getEffectiveBankLogo,
  BANK_PLACEHOLDER,
  downloadInvoiceXML,
  itemQtyLabel
} from "../lib/format.js"

export default function InvoiceView({ invoice, profile, standalone }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const shareUrl = buildShareUrl(invoice.id, invoice, profile)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("انسخ رابط الفاتورة:", shareUrl)
    }
  }

  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, shareUrl, {
          format: "CODE128",
          lineColor: "#000",
          width: 1,
          height: 55,
          displayValue: true,
          fontSize: 20,
          fontOptions: "bold",
          font: "Courier New, monospace",
          textMargin: 6,
          background: "#fff",
          margin: 10
        })
      } catch (e) {
        /* تجاهل أخطاء الباركود */
      }
    }
  }, [shareUrl])

  const subtotal = calcSubtotal(invoice.items)
  // إكمال جدول الأصناف إلى 10 أسطر فارغة لملء A4
  const displayItems = (() => {
    const items = invoice.items || []
    const minRows = 10
    if (items.length >= minRows) return items
    const pad = Array.from({ length: minRows - items.length }, () => ({
      desc: "",
      qty: "",
      price: "",
      empty: true
    }))
    return [...items, ...pad]
  })()
  const effectiveBankLogo = getEffectiveBankLogo(profile) || getBankLogo(profile.bankId) || getBankLogo(profile.payMethods?.bankId) || ""
  const goBack = () => {
    if (standalone) window.location.hash = "/"
    else window.history.back()
  }
  const handlePrint = () => {
    // تأكد من اكتمال رسم الباركود قبل الطباعة
    const doPrint = () => {
      try {
        window.print()
      } catch {
        // fallback: افتح نافذة طباعة منفصلة
        const el = document.getElementById("invoice-sheet")
        if (!el) return
        const w = window.open("", "_blank")
        if (!w) return
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>فاتورة ${invoice.number}</title><style>body{margin:0;padding:20px;font-family:sans-serif} img{max-width:100%}</style></head><body>${el.outerHTML}</body></html>`)
        w.document.close()
        w.focus()
        setTimeout(() => { w.print(); w.close() }, 300)
      }
    }
    // انتظر تحميل الصور والباركود
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => setTimeout(doPrint, 200))
    } else {
      setTimeout(doPrint, 300)
    }
  }

  return (
    <div className="iv-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .iv-root {
          --ink: #000;
          --paper: #fff;
          --paper-white: #fff;
          --pine: #000;
          --pine-deep: #000;
          --stamp: #000;
          --gold: #999;
          --line: #000;
          --line-soft: #ccc;
          --danger: #000;

          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background: #fff;
          color: #000;
          direction: rtl;
          min-height: 100vh;
          line-height: 1.35;
          -webkit-font-smoothing: antialiased;
        }
        .iv-root * { box-sizing: border-box; }
        .iv-root button { font-family: inherit; cursor: pointer; border: none; }

        .iv-container { width: 794px; max-width: 100%; margin: 0 auto; padding: 20px 16px; box-sizing: border-box; }
        @media screen and (max-width: 820px) {
          .iv-container { width: 100%; padding: 12px 8px; }
        }

        .iv-toolbar {
          display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; padding: 14px 16px;
          background: var(--paper-white); border: 1px solid var(--line); border-radius: 3px;
        }
        .btn {
          padding: 11px 22px; border-radius: 3px; font-size: 0.95rem; font-weight: 600;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .btn:active { transform: scale(0.97); }
        .btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
        .btn-ghost { background: transparent; color: var(--pine-deep); border: 1px solid var(--line); }
        .btn-ghost:hover { background: var(--paper-white); border-color: var(--gold); color: var(--pine-deep); }
        .btn-primary { background: var(--pine); color: var(--paper-white); border: 1px solid var(--pine); }
        .btn-primary:hover { background: var(--pine-deep); border-color: var(--pine-deep); }
        .btn-gold { background: var(--gold); color: var(--ink); border: 1px solid var(--gold); }
        .btn-gold:hover { background: #a67a2c; border-color: #a67a2c; }
        .btn-danger { background: transparent; color: var(--danger); border: 1px solid #efc3bf; }
        .btn-danger:hover { background: #fff3f2; border-color: var(--danger); }
        .btn-lg { padding: 14px 28px; font-size: 1.02rem; }
        .btn-icon { display: inline-flex; align-items: center; gap: 8px; }

        .iv-sheet {
          background: #fff; border: 1px solid #000; border-radius: 0;
          box-shadow: 0 8px 24px -20px rgba(0,0,0,0.15); overflow: hidden;
        }

        /* Stamp */
        .iv-stamp {
          position: absolute; top: -18px; left: -22px; width: 92px; height: 92px; border-radius: 50%;
          border: 2.5px solid var(--stamp); display: flex; align-items: center; justify-content: center;
          text-align: center; font-family: 'Aref Ruqaa', serif; font-weight: 700; font-size: 0.95rem; line-height: 1.15;
          color: var(--stamp); background: rgba(249,249,242,0.9);
        }
        .iv-stamp::before {
          content: ""; position: absolute; inset: 6px; border: 1px solid var(--stamp); border-radius: 50%; opacity: 0.55;
        }

        /* Header - مضغوط ليستوعب 10 أصناف في A4 */
        .inv-head {
          display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: start;
          padding: 14px 20px 10px; position: relative; border-bottom: 1.5px solid var(--ink);
        }
        .iv-root .inv-head::before {
          content: ""; position: absolute; inset: 0 0 auto 0; height: 3px;
          background: linear-gradient(90deg, var(--gold), transparent 65%); opacity: 0.8;
        }
        .inv-logo-side { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .inv-logo-side img { max-height: 56px; max-width: 150px; object-fit: contain; border-radius: 4px; background: #fff; padding: 3px; border: 1px solid var(--line); }
        .logo-caption { font-size: 0.68rem; color: #6b7568; text-align: center; max-width: 150px; line-height: 1.2; }
        .logo-placeholder { font-size: 0.72rem; color: #000; text-align: center; padding: 6px 10px; border: 1px dashed #000; border-radius: 3px; background: #f5f5f5; }

        .inv-title { text-align: center; min-width: 180px; }
        .biz-name { font-family: 'Aref Ruqaa', serif; font-size: 1.2rem; font-weight: 700; color: var(--pine-deep); margin-bottom: 2px; line-height: 1.2; }
        .inv-title h2 { margin: 0 0 2px; font-size: 1.1rem; font-weight: 700; color: var(--ink); line-height: 1.2; }
        .inv-no { font-size: 0.82rem; color: #5a6355; font-variant-numeric: tabular-nums; }
        .inv-tax-no { font-size: 0.7rem; color: #7a8172; margin-top: 2px; }
        .stamps { display: flex; gap: 4px; justify-content: center; margin-top: 4px; }
        .stamp {
          font-size: 0.62rem; font-weight: 700; padding: 2px 8px; border-radius: 2px;
          background: #e5e5e5; color: #000; border: 1px solid #999;
        }
        .stamp-cancel { background: #e5e5e5; color: #000; border: 1px solid #999; }

        /* Meta - سطر واحد 4 خانات مع رفع الثانية قرب خط الثالثة */
        .inv-meta {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
          padding: 6px 20px; border-bottom: 1px solid var(--line-soft); background: #fff;
        }
        .inv-meta div { display: flex; flex-direction: column; gap: 1px; text-align: center; padding: 2px 6px; border-inline-start: 1px solid #ccc; }
        .inv-meta div:first-child { border-inline-start: none; }
        .inv-meta div:nth-child(2) { padding-inline-start: 2px; padding-inline-end: 2px; margin-inline-start: -1px; }
        .inv-meta div:nth-child(3) { border-inline-start: 1.5px solid #000; padding-inline-start: 6px; }
        .inv-meta span { font-size: 0.66rem; font-weight: 600; color: #000; white-space: nowrap; }
        .inv-meta b { font-size: 0.78rem; color: #000; font-variant-numeric: tabular-nums; white-space: nowrap; }
        @media (max-width: 600px) {
          .inv-meta { grid-template-columns: repeat(2, 1fr); }
          .inv-meta div { text-align: right; }
        }
        .inv-meta b.green { color: var(--pine-deep); }
        .inv-meta b.red { color: var(--stamp); }
        .inv-meta b.muted { color: #7a8172; }

        /* Client - العميل + 3 خانات على سطر واحد + عنوان ورقم ضريبي في سطر ثان */
        .inv-client {
          display: grid;
          grid-template-columns: auto 1fr 1fr 1fr;
          gap: 8px 12px;
          align-items: center;
          padding: 8px 20px;
          border-bottom: 1px solid #ccc;
          background: #fff;

          direction: rtl;
          text-align: right;
        }
        .inv-client div:nth-child(5) { grid-column: 1 / span 2; }
        .inv-client div:nth-child(6) { grid-column: 3 / span 2; }

        .inv-client h3 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--pine-deep);
          white-space: nowrap;

          padding-right: 8px;
          padding-left: 0;

          border-right: 1px solid var(--line-soft);
          border-left: none;
        }

        .inv-client div {
          display: flex;
          flex-direction: column;
          gap: 1px;
          font-size: 0.82rem;
          line-height: 1.3;
          text-align: right;
        }

        .inv-client span {
          color: #000;
          font-weight: 600;
          font-size: 0.68rem;
          white-space: nowrap;
        }

        @media (max-width: 700px) {
          .inv-client {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .inv-client h3 {
            border-right: none;
            border-bottom: 1px solid var(--line-soft);
            padding-right: 0;
            padding-bottom: 4px;
          }
        }

        /* Items Table - مضغوط ليستوعب 10 أسطر في A4 */
        .inv-items { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
        .inv-items thead th {
          text-align: right; padding: 6px 8px; font-size: 0.68rem; font-weight: 600;
          color: #6b7568; border-bottom: 1.5px solid var(--ink); white-space: nowrap; background: var(--paper);
        }
        .inv-items tbody td { padding: 6px 8px; border-bottom: 1px solid var(--line-soft); vertical-align: top; line-height: 1.3; }
        .inv-items tbody tr:nth-child(even) td { background: rgba(255,255,255,0.4); }
        .inv-items tbody tr:last-child td { border-bottom: none; }
        .inv-items tbody tr.cancelled td { opacity: 0.5; text-decoration: line-through; color: #7a8172; }
        .inv-items tr.empty-row td { height: 20px; background: #fff; border-bottom: 1px solid var(--line-soft); }
        .inv-items tr.empty-row:last-child td { border-bottom: none; }

        .inv-item-desc { font-weight: 500; word-break: break-word; }
        .inv-extras { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
        .inv-extra { font-size: 0.65rem; background: #f4f5ef; border: 1px dashed var(--line); padding: 1px 6px; border-radius: 999px; color: #5a6355; }
        .inv-item-extra-total { font-size: 0.65rem; color: #7a8172; margin-top: 1px; }

        .inv-items td:nth-child(2) { text-align: center; font-variant-numeric: tabular-nums; }
        .inv-items td:nth-child(3),
        .inv-items td:nth-child(4) { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }

        .inv-items tfoot td { padding: 6px 8px; font-size: 0.82rem; }
        .inv-items tfoot tr:first-child td { border-top: 1px solid var(--line-soft); }
        .inv-items tfoot tr.inv-grand td {
          font-weight: 700; font-size: 0.88rem; color: var(--pine-deep);
          border-top: 1.5px solid var(--ink); background: var(--paper);
        }

        /* Bank / Payment Methods - مضغوط */
        .inv-bank { padding: 10px 20px; border-top: 1px solid var(--line-soft); }
        .inv-bank h3 { margin: 0 0 8px; font-size: 0.88rem; font-weight: 700; color: var(--pine-deep); }
        .pay-methods { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
        .pay-method {
          background: var(--paper); border: 1px solid var(--line); border-radius: 3px; padding: 8px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .pay-method:hover { border-color: var(--gold); box-shadow: 0 4px 16px -8px rgba(185,138,52,0.3); }
        .pm-logo { max-height: 28px; max-width: 100px; object-fit: contain; margin-bottom: 4px; background: #fff; padding: 3px; border-radius: 3px; border: 1px solid var(--line); }
        .pm-title { font-weight: 700; font-size: 0.82rem; margin-bottom: 3px; }
        .pm-sub { font-size: 0.72rem; color: #5a6355; margin: 1px 0; }
        .pm-sub b { color: var(--ink); }

        /* Note - مضغوط */
        .inv-note { padding: 8px 20px; border-top: 1px solid var(--line-soft); background: #fcfcf7; }
        .inv-note p { margin: 0; color: #5a6355; font-size: 0.78rem; line-height: 1.3; }

        /* Codes - باركود أعلى QR */
        .inv-codes { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 10px 20px; border-top: 1px solid var(--line-soft); }
        .code-block { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .code-label { font-size: 0.68rem; font-weight: 600; color: #6b7568; text-align: center; }
        .code-block canvas { background: #fff; padding: 4px; border: 1px solid var(--line); border-radius: 3px; }

        /* Footer - مضغوط */
        .inv-footer { padding: 8px 20px; text-align: center; font-size: 0.75rem; color: #7a8172; border-top: 1px solid var(--line-soft); background: var(--paper); }

        /* Print - A4 */
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 210mm; height: auto; overflow: visible !important; }
          .iv-root { background: #fff !important; min-height: auto !important; width: 210mm !important; max-width: 210mm !important; overflow: visible !important; }
          .iv-toolbar, .no-print { display: none !important; }
          .iv-container { width: 190mm !important; max-width: 190mm !important; padding: 0 !important; margin: 0 auto !important; }
          .iv-sheet { box-shadow: none !important; border: 1px solid #ddd !important; border-radius: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; }
          .inv-head, .inv-meta, .inv-client, .inv-bank, .inv-note, .inv-footer { break-inside: avoid; }
          .inv-items { page-break-inside: auto; }
          .inv-items tr { page-break-inside: avoid; page-break-after: auto; }
          .code-block canvas { background: #fff !important; }
        }
        /* Screen A4 preview - ensure not exceeding */
        .iv-container { width: 100%; max-width: 860px; }
        .iv-sheet { width: 100%; max-width: 100%; box-sizing: border-box; }
      `}</style>

      <div className="iv-container">
        <div className="iv-toolbar no-print">
          <button className="btn btn-ghost" onClick={goBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:"scaleX(-1)"}}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            رجوع
          </button>
          <button className="btn btn-ghost" onClick={() => window.location.hash = `/r/${invoice.id}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            نسخة إيبسون
          </button>
          <button className="btn btn-ghost" onClick={copyLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? "تم النسخ ✓" : "نسخ الرابط"}
          </button>
          <button className="btn btn-ghost" onClick={() => window.open(whatsappShareUrl(shareUrl), "_blank")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            واتساب
          </button>
          <button className="btn btn-primary btn-icon" onClick={handlePrint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            طباعة / PDF
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => downloadInvoiceXML(invoice, profile)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            XML
          </button>
        </div>

        <div className="iv-sheet" id="invoice-sheet">
          <header className="inv-head">
            <div className="inv-logo-side">
              {profile.freelanceLogo ? (
                <img src={profile.freelanceLogo} alt="شعار العمل الحر" />
              ) : (
                <img
                  src={docLogo(profile.docType)}
                  alt={docLabel(profile.docType)}
                  style={{ maxHeight: 64, objectFit: "contain" }}
                />
              )}
              {profile.docNumber && (
                <div className="logo-caption">
                  {docLabel(profile.docType)}: <b dir="ltr" style={{ unicodeBidi: "isolate" }}>{profile.docNumber}</b>
                </div>
              )}
            </div>
            <div className="inv-title">
              <div className="biz-name">{profile.businessName}</div>
              <h2>فاتورة</h2>
              <div className="inv-no">رقم: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.number}</span></div>
              {profile.address && <div style={{ fontSize: "0.7rem", color: "#000", marginTop: "2px" }}>{profile.address}</div>}
              <div style={{ fontSize: "0.68rem", color: "#000" }}>{[profile.phone, profile.email].filter(Boolean).join(" • ")}</div>
              {profile.docNumber && <div style={{ fontSize: "0.65rem", color: "#000" }}>{docLabel(profile.docType)}: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{profile.docNumber}</span></div>}
              {hasVat(profile) && (
                <div className="inv-tax-no">
                  الرقم الضريبي: <b dir="ltr" style={{ unicodeBidi: "isolate" }}>{getTaxNumber(profile)}</b> • {getVatRate(profile)}%
                </div>
              )}
              <div className="stamps">
                {invoice.amended && <span className="stamp">معدّلة</span>}
                {invoice.status === "refunded" && (
                  <span className="stamp stamp-cancel">مُلغاة</span>
                )}
              </div>
            </div>
            <div className="inv-logo-side">
              {profile.companyLogo ? (
                <img src={profile.companyLogo} alt="شعار الشركة" />
              ) : (
                <div className="logo-placeholder">شعار الشركة</div>
              )}
              <div className="logo-caption" style={{ visibility: profile.companyLogo ? "hidden" : "visible", height: "1.2em" }}>&nbsp;</div>
            </div>
          </header>

          <section className="inv-meta">
            <div>
              <span>تاريخ الإصدار:</span> {formatDate(invoice.date)}
            </div>
            <div>
              <span>وقت الإصدار:</span> {invoice.time || "-"}
            </div>
            <div>
              <span>تاريخ الاستحقاق:</span> {formatDate(invoice.dueDate)}
            </div>
            <div>
              <span>الحالة:</span>{" "}
              <b
                className={
                  invoice.status === "paid"
                    ? "green"
                    : invoice.status === "refunded"
                    ? "muted"
                    : "red"
                }
              >
                {invoice.status === "paid"
                  ? "مدفوعة"
                  : invoice.status === "refunded"
                  ? "مُلغاة"
                  : "مستحقة"}
              </b>
            </div>
          </section>

          <section className="inv-client">
            <h3>العميل</h3>
            <div>
              <span>الاسم:</span> {invoice.clientName || "-"}
            </div>
            <div>
              <span>الجوال:</span> <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.clientPhone || "-"}</span>
            </div>
            <div>
              <span>البريد:</span> <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.clientEmail || "-"}</span>
            </div>
            <div>
              <span>العنوان:</span> {invoice.clientAddress || "-"}
            </div>
            <div>
              <span>الرقم الضريبي:</span> <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.clientTaxNumber || "-"}</span>
            </div>
          </section>

          <table className="inv-items">
            <thead>
              <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((it, i) => {
                const isEmptyDesc = !it.desc || String(it.desc).trim() === "" || String(it.desc).trim() === "-"
                const isRealEmpty = it.empty || (isEmptyDesc && (Number(it.price) || 0) === 0)
                return (
                  <tr key={i} className={it.cancelled ? "cancelled" : isRealEmpty ? "empty-row" : ""}>
                    <td className="inv-item-desc">{isRealEmpty ? "\u00A0" : it.desc}
                      {!isRealEmpty && it.extras && it.extras.length > 0 && (
                        <div className="inv-extras">
                          {it.extras.map((e, j) => (
                            <span key={j} className="inv-extra">
                              {e.name} +{formatCurrency(e.price)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  <td>{isRealEmpty ? "\u00A0" : itemQtyLabel(it)}</td>
                  <td>{isRealEmpty ? "\u00A0" : <>{formatCurrency(it.price)}{itemExtrasTotal(it) > 0 && (
                    <div className="inv-item-extra-total">مكوّنات +{formatCurrency(itemExtrasTotal(it))}</div>
                  )}</>}</td>
                    <td>
                      {isRealEmpty ? "\u00A0" : (it.cancelled
                        ? "ملغاة"
                        : formatCurrency(itemTotal(it)))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">المجموع الفرعي</td>
                <td>{formatTotal(subtotal)}</td>
              </tr>
              {hasVat(profile) && (
                <>
                  <tr>
                    <td colSpan="3">ضريبة القيمة المضافة ({getVatRate(profile)}%)</td>
                    <td>{formatCurrency(vatAmount(subtotal, profile))}</td>
                  </tr>
                  <tr className="inv-grand">
                    <td colSpan="3">الإجمالي شاملاً الضريبة</td>
                    <td>{formatTotal(invoiceTotal(subtotal, profile))}</td>
                  </tr>
                </>
              )}
              {!hasVat(profile) && (
                <tr className="inv-grand">
                  <td colSpan="3">الإجمالي</td>
                  <td>{formatTotal(subtotal)}</td>
                </tr>
              )}
            </tfoot>
          </table>

          <section className="inv-bank">
            <h3>طرق الدفع المتاحة</h3>
            <div className="pay-methods">
              {profile.payMethods?.bank && (
                <div className="pay-method bank-method">
                  <div className="pm-details">
                    {effectiveBankLogo && (
                      <img
                        className="pm-logo"
                        src={effectiveBankLogo}
                        alt="تحويل بنكي"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BANK_PLACEHOLDER }}
                      />
                    )}
                    <div className="pm-title">تحويل بنكي — بنك {profile.bankName}</div>
                    <div className="pm-sub">
                      اسم المستفيد: {profile.accountName || "ـ"}
                    </div>
                    <div className="pm-sub">
                      رقم الحساب: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{profile.accountNumber || "-"}</span>
                    </div>
                    <div className="pm-sub">
                      الآيبان (IBAN): <b dir="ltr" style={{ unicodeBidi: "isolate" }}>{profile.iban || "-"}</b>
                    </div>
                  </div>
                </div>
              )}
              {profile.payMethods?.applePay && (
                <div className="pay-method">
                  {profile.payMethods?.applePayLogo && (
                    <img className="pm-logo" src={profile.payMethods.applePayLogo} alt="Apple Pay" />
                  )}
                  <div className="pm-title">Apple Pay</div>
                  <div className="pm-sub">
                    الدفع على الرقم: <b dir="ltr">{profile.payMethods?.applePayPhone || "-"}</b>
                  </div>
                </div>
              )}
              {profile.payMethods?.mastercard && (
                <div className="pay-method">
                  {profile.payMethods?.mastercardLogo && (
                    <img className="pm-logo" src={profile.payMethods.mastercardLogo} alt="Mastercard" />
                  )}
                  <div className="pm-title">بطاقة Mastercard</div>
                  <div className="pm-sub">ادفع بالبطاقة.</div>
                </div>
              )}
            </div>
          </section>

          <section className="inv-note">
            <p>{invoice.note || profile.note}</p>
          </section>

            <section className="inv-codes">
              <div className="code-block">
                <div className="code-label">باركود الفاتورة</div>
                <canvas ref={canvasRef}></canvas>
              </div>

              <div className="code-block">
                <div className="code-label">رمز الاستجابة السريعة</div>
                <QRCodeCanvas value={shareUrl} size={90} />
              </div>

            </section>

          <footer className="inv-footer">
            {profile.phone || profile.email
              ? `للتواصل: ${[profile.phone, profile.email].filter(Boolean).join(" - ")}`
              : "شكراً لتعاملكم معنا"}
          </footer>
        </div>
      </div>
    </div>
  )
}
