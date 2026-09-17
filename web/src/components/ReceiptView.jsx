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
  itemQtyLabel,
  generateZATCAQRCode,
  generateUUID,
  downloadZATCACompliantXML
} from "../lib/format.js"
export default function ReceiptView({ invoice, profile, standalone }) {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const shareUrl = buildShareUrl(invoice.id, invoice, profile)
  const subtotal = calcSubtotal(invoice.items)
  const effectiveBankLogo = getEffectiveBankLogo(profile) || getBankLogo(profile.bankId) || getBankLogo(profile.payMethods?.bankId) || ""
  const zatcaQRData = generateZATCAQRCode(invoice, profile)
  const uuid = invoice.uuid || generateUUID()
  const hash = invoice.hash || ""
  const stamp = invoice.stamp || ""

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
          height: 42,
          displayValue: true,
          fontSize: 16,
          fontOptions: "bold",
          font: "Courier New, monospace",
          textMargin: 4,
          background: "#fff",
          margin: 6
        })
      } catch (e) {
        /* تجاهل */
      }
    }
  }, [shareUrl])

  const printReceipt = () => {
    const style = document.createElement("style")
    style.id = "print-page-style"
    style.textContent = "@page { margin: 5mm !important; }"
    document.head.appendChild(style)
    const doPrint = () => {
      try {
        window.print()
      } catch {
        const el = document.getElementById("receipt")
        if (el) {
          const w = window.open("", "_blank")
          if (w) {
            w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>إيصال ${invoice.number}</title><style>body{margin:0;padding:10px;font-family:sans-serif}</style></head><body>${el.outerHTML}</body></html>`)
            w.document.close()
            w.focus()
            setTimeout(() => { w.print(); w.close() }, 300)
          }
        }
      } finally {
        setTimeout(() => style.remove(), 1000)
      }
    }
    if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(doPrint, 200))
    else setTimeout(doPrint, 300)
  }

  const goBack = () => {
    if (standalone) window.location.hash = "/"
    else window.history.back()
  }

  return (
    <div className="rv-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .rv-root {
          --ink: #000;
          --paper: #fff;
          --paper-white: #fff;
          --line: #000;
          --line-soft: #ccc;
          --gold: #999;

          /* خط الطابعة الحرارية - monospaced */
          font-family: 'Courier New', Courier, 'IBM Plex Sans Arabic', monospace;
          background: #fff;
          color: #000;
          direction: rtl;
          min-height: 100vh;
          line-height: 1.45;
          -webkit-font-smoothing: antialiased;
          font-variant-ligatures: none;
        }
        .rv-root * { box-sizing: border-box; }
        .rv-root button { font-family: 'IBM Plex Sans Arabic', sans-serif; cursor: pointer; border: none; }

        .rv-container { max-width: 80mm; width: 80mm; margin: 0 auto; padding: 12px 8px; }
        @media screen and (max-width: 420px) {
          .rv-container { max-width: 100%; width: 100%; }
        }

        .rv-toolbar {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; padding: 12px;
          background: #fff; border: 1px solid #000; border-radius: 3px;
        }
        .btn {
          padding: 10px 20px; border-radius: 3px; font-size: 0.9rem; font-weight: 600;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .btn:active { transform: scale(0.97); }
        .btn:focus-visible { outline: 2px solid #999; outline-offset: 2px; }
        .btn-ghost { background: #fff; color: #000; border: 1px solid #000; }
        .btn-ghost:hover { background: #f5f5f5; border-color: #000; color: #000; }
        .btn-primary { background: #000; color: #fff; border: 1px solid #000; }
        .btn-primary:hover { background: #222; border-color: #222; }
        .btn-gold { background: #e5e5e5; color: #000; border: 1px solid #999; }
        .btn-gold:hover { background: #ddd; border-color: #999; }
        .btn-danger { background: #fff; color: #000; border: 1px solid #000; }
        .btn-danger:hover { background: #f5f5f5; border-color: #000; }
        .btn-icon { display: inline-flex; align-items: center; gap: 6px; }

        .rv-receipt {
          width: 100%; background: transparent; border: none; box-shadow: none; overflow: visible; color: #000;
        }

        .r-header {
          padding: 10px 0 8px; border: none; background: transparent; color: #000; text-align: center;
        }
        .r-header::before { display: none; }
        .r-logos { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
        .r-logo-side { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .r-logo-side img { max-height: 40px; max-width: 90px; object-fit: contain; background: transparent; border: none; padding: 0; }
        .r-logo-text { font-size: 0.68rem; color: #000; text-align: center; padding: 4px 0; border: none; background: transparent; }
        .r-logo-caption { font-size: 0.65rem; color: #000; text-align: center; max-width: 110px; }

        .r-biz { font-family: 'Aref Ruqaa', serif; font-size: 1.15rem; font-weight: 700; color: #000; text-align: center; margin-bottom: 1px; }
        .r-doc { font-size: 0.8rem; text-align: center; color: #000; margin-bottom: 2px; }
        .r-vat-no { font-size: 0.68rem; text-align: center; color: #000; margin-bottom: 2px; }
        .r-stamps { display: flex; gap: 4px; justify-content: center; margin-bottom: 4px; }
        .r-stamp { font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 0; background: transparent; color: #000; border: 1px solid #000; }
        .r-stamp-cancel { background: transparent; color: #000; border: 1px solid #000; }
        .r-sub { font-size: 0.7rem; text-align: center; color: #000; margin-bottom: 4px; }

        .r-dash { border: none; border-top: 1px dashed #000; margin: 6px 0; }

        .r-meta { padding: 6px 0; background: transparent; }
        .r-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 2px 0; }
        .r-row span:first-child { color: #000; font-weight: 400; }
        .r-row span:last-child { font-variant-numeric: tabular-nums; color: #000; font-weight: 600; }
        .r-row .r-green, .r-row .r-red, .r-row .muted { color: #000 !important; }

        .r-client { padding: 6px 0; font-size: 0.82rem; color: #000; font-weight: 500; background: transparent; border: none; }
        .r-client-sub { padding: 0 0 6px; font-size: 0.7rem; color: #000; background: transparent; }

        .r-item-head { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.68rem; font-weight: 700; color: #000; border-top: 1px dashed #000; border-bottom: 1px dashed #000; background: transparent; }
        .r-item { padding: 5px 0; border: none; border-bottom: 1px dotted #bbb; background: transparent; }
        .r-item:last-child { border-bottom: 1px dotted #bbb; }
        .r-item.cancelled { opacity: 0.6; text-decoration: line-through; }
        .r-item-name { font-weight: 600; font-size: 0.78rem; margin-bottom: 2px; color: #000; }
        .r-extras { display: flex; flex-direction: column; gap: 1px; margin-top: 2px; padding-right: 6px; border-inline-start: 1px solid #000; }
        .r-extras .r-row { font-size: 0.68rem; padding: 1px 0; }
        .r-extras .r-row span:first-child { color: #000; }
        .r-extras .r-row span:last-child { color: #000; }

        .r-totals { padding: 6px 0; border: none; border-top: 1px dashed #000; background: transparent; margin-top: 4px; }
        .r-totals .r-row { font-size: 0.8rem; }
        .r-totals .r-row.r-total { font-weight: 700; font-size: 0.9rem; color: #000; border-top: 1px dashed #000; padding-top: 6px; margin-top: 4px; }

        .r-bank { padding: 6px 0; border: none; border-top: 1px dashed #000; background: transparent; margin-top: 4px; }
        .r-bank-name { font-size: 0.74rem; font-weight: 700; color: #000; margin-bottom: 6px; text-align: center; }
        .r-bank-method { margin-bottom: 6px; }
        .r-bank-method:last-child { margin-bottom: 0; }
        .r-pm-logo { max-height: 24px; max-width: 80px; object-fit: contain; margin-bottom: 4px; background: transparent; border: none; padding: 0; display: block; margin-left: auto; margin-right: auto; }
        .r-bank-method .r-row { font-size: 0.72rem; padding: 1px 0; justify-content: center; gap: 8px; }
        .r-bank-method .r-row span:first-child { color: #000; }
        .r-bank-method .r-row span:last-child { color: #000; font-weight: 600; }

        .r-note { padding: 6px 0; font-size: 0.7rem; color: #000; border: none; border-top: 1px dashed #000; background: transparent; text-align: center; margin-top: 4px; }

        .r-codes { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0; border: none; background: transparent; margin-top: 4px; }
        .r-qr { display: flex; justify-content: center; }
        .r-qr canvas { background: #fff; padding: 0; border: none; }
        .r-qr svg { background: #fff; padding: 0; border: none; }

        .r-foot { text-align: center; padding: 8px 0; font-size: 0.68rem; color: #000; border: none; border-top: 1px dashed #000; background: transparent; margin-top: 4px; }

        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          html, body { width: 80mm; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .rv-root { background: #fff !important; width: 80mm !important; max-width: 80mm !important; min-height: auto !important; font-family: 'Courier New', Courier, monospace !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .rv-toolbar, .no-print { display: none !important; }
          .rv-container { width: 76mm !important; max-width: 76mm !important; padding: 0 !important; margin: 0 auto !important; background: #fff !important; }
          .rv-receipt { box-shadow: none !important; border: none !important; border-radius: 0 !important; width: 100% !important; background: #fff !important; color: #000 !important; font-family: 'Courier New', Courier, monospace !important; }
          .r-header { background: #fff !important; border: none !important; color: #000 !important; }
          .r-header::before { display: none !important; }
          .r-logos, .r-biz, .r-doc, .r-vat-no, .r-sub, .r-meta, .r-client, .r-client-sub, .r-item, .r-totals, .r-bank, .r-note, .r-foot, .r-row { background: #fff !important; color: #000 !important; border-color: #000 !important; }
          .r-biz { color: #000 !important; }
          .r-doc, .r-vat-no, .r-sub, .r-client-sub { color: #000 !important; }
          .r-row span:first-child { color: #000 !important; }
          .r-row span:last-child { color: #000 !important; }
          .r-row .r-green, .r-row .r-red, .r-row .muted { color: #000 !important; }
          .r-stamp { background: #e5e5e5 !important; color: #000 !important; border: 1px solid #999 !important; }
          .r-stamp-cancel { background: #e5e5e5 !important; color: #000 !important; }
          .r-dash { border-top: 1px dashed #999 !important; }
          .r-item-head { background: transparent !important; color: #000 !important; border-top: 1px dashed #000 !important; border-bottom: 1px dashed #000 !important; }
          .r-item { border-bottom: 1px dotted #bbb !important; }
          .r-totals { border-top: 1px dashed #000 !important; background: transparent !important; }
          .r-totals .r-row.r-total { border-top: 1px dashed #000 !important; color: #000 !important; }
          .r-bank { background: transparent !important; border-top: 1px dashed #000 !important; }
          .r-bank-name { color: #000 !important; }
          .r-note { background: #f5f5f5 !important; border-top: 1px solid #ccc !important; color: #000 !important; }
          .r-foot { background: transparent !important; color: #000 !important; border-top: 1px dashed #000 !important; }
          .r-extras { border-inline-start: 2px solid #999 !important; }
          .r-logo-text { background: #fff !important; border: 1px dashed #999 !important; color: #000 !important; }
          .r-logo-caption { color: #000 !important; }
          /* الشعارات تبقى ملونة - لا تطبق عليها الفلتر */
          .r-logo-side img, .r-pm-logo { filter: none !important; -webkit-filter: none !important; background: #fff !important; border: 1px solid #ccc !important; }
          .r-qr canvas, .r-qr svg { background: #fff !important; border: 1px solid #000 !important; }
        }
      `}</style>

      <div className="rv-container">
        <div className="rv-toolbar no-print">
          <button className="btn btn-ghost btn-icon" onClick={goBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:"scaleX(-1)"}}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            رجوع
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => window.location.hash = `/i/${invoice.id}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            نسخة A4
          </button>
          <button className="btn btn-ghost btn-icon" onClick={copyLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied ? "تم النسخ ✓" : "نسخ الرابط"}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => window.open(whatsappShareUrl(shareUrl), "_blank")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            واتساب
          </button>
          <button className="btn btn-primary btn-icon" onClick={printReceipt}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            طباعة إيبسون
          </button>
          <button className="btn btn-gold btn-icon" onClick={() => downloadZATCACompliantXML(invoice, profile)} title="تحميل فاتورة إلكترونية ZATCA">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            XML
          </button>
        </div>

        <div className="rv-receipt" id="receipt">
          <div className="r-header">
            <div className="r-logos">
              <div className="r-logo-side">
                {profile.freelanceLogo ? (
                  <img src={profile.freelanceLogo} alt="شعار العمل الحر" />
                ) : (
                  <div className="r-logo-text">شعار العمل الحر</div>
                )}
                {profile.docNumber && (
                  <div className="r-logo-caption">
                    {docLabel(profile.docType)}: <b dir="ltr">{profile.docNumber}</b>
                  </div>
                )}
              </div>
              <div className="r-logo-side">
                {profile.companyLogo ? (
                  <img src={profile.companyLogo} alt="شعار الشركة" />
                ) : (
                  <div className="r-logo-text">شعار الشركة</div>
                )}
                <div className="r-logo-caption">مصمم التطبيقات للهواتف الذكية</div>
              </div>
            </div>
            <div className="r-biz">{profile.businessName}</div>
            <div className="r-doc">فاتورة — رقم: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.number}</span></div>
            {profile.address && <div className="r-sub" style={{ fontSize: "0.68rem" }}>{profile.address}</div>}
            {profile.docNumber && <div className="r-sub" style={{ fontSize: "0.65rem" }}>{docLabel(profile.docType)}: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{profile.docNumber}</span></div>}
            {hasVat(profile) && (
              <div className="r-vat-no">الرقم الضريبي: <b dir="ltr" style={{ unicodeBidi: "isolate" }}>{getTaxNumber(profile)}</b> • {getVatRate(profile)}%</div>
            )}
            {(invoice.amended || invoice.status === "refunded") && (
              <div className="r-stamps">
                {invoice.amended && <span className="r-stamp">معدّلة</span>}
                {invoice.status === "refunded" && (
                  <span className="r-stamp r-stamp-cancel">مُلغاة</span>
                )}
              </div>
            )}
            {(profile.phone || profile.email) && (
              <div className="r-sub">
                {[profile.phone, profile.email].filter(Boolean).join(" - ")}
              </div>
            )}
          </div>

          <div className="r-meta">
            <div className="r-row"><span>فاتورة</span><span>{invoice.number}</span></div>
            <div className="r-row"><span>التاريخ</span><span>{formatDate(invoice.date)}</span></div>
            <div className="r-row"><span>الوقت</span><span>{invoice.time || "-"}</span></div>
            <div className="r-row"><span>الاستحقاق</span><span>{formatDate(invoice.dueDate)}</span></div>
            <div className="r-row">
              <span>الحالة</span>
              <span
                className={
                  invoice.status === "paid"
                    ? "r-green"
                    : invoice.status === "refunded"
                    ? "muted"
                    : "r-red"
                }
              >
                {invoice.status === "paid"
                  ? "مدفوعة"
                  : invoice.status === "refunded"
                  ? "مُلغاة"
                  : "مستحقة"}
              </span>
            </div>
          </div>

          <hr className="r-dash" />
          <div className="r-client">العميل: {invoice.clientName || "-"}</div>
          {(invoice.clientPhone || invoice.clientEmail) && (
            <div className="r-client-sub">
              {[invoice.clientPhone, invoice.clientEmail].filter(Boolean).join(" - ")}
            </div>
          )}
          {invoice.clientAddress && <div className="r-client-sub">العنوان: {invoice.clientAddress}</div>}
          {invoice.clientTaxNumber && <div className="r-client-sub">الرقم الضريبي للعميل: <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{invoice.clientTaxNumber}</span></div>}

          <hr className="r-dash" />
          <div className="r-item-head">
            <span>الصنف</span>
            <span>المبلغ</span>
          </div>
          {(invoice.items || []).map((it, i) => (
            <div className={`r-item ${it.cancelled ? "cancelled" : ""}`} key={i}>
              <div className="r-item-name">{it.desc || "-"}</div>
              {(it.extras && it.extras.length > 0) && (
                <div className="r-extras">
                  {it.extras.map((e, j) => (
                    <div className="r-row" key={j}>
                      <span>+ {e.name}</span>
                      <span>+{formatCurrency(e.price)}</span>
                    </div>
                  ))}
                </div>
              )}
              {it.cancelled ? (
                <div className="r-row">
                  <span>الحالة</span>
                  <span>ملغاة</span>
                </div>
              ) : (
                <div className="r-row">
                  <span>
                    {itemQtyLabel(it)} × {formatCurrency(it.price)}
                    {itemExtrasTotal(it) > 0 && ` + مكوّنات ${formatCurrency(itemExtrasTotal(it))}`}
                  </span>
                  <span>
                    {formatCurrency(itemTotal(it))}
                  </span>
                </div>
              )}
            </div>
          ))}

          <hr className="r-dash" />
          <div className="r-totals">
            <div className="r-row"><span>المجموع الفرعي</span><span>{formatTotal(subtotal)}</span></div>
            {hasVat(profile) && (
              <>
                <div className="r-row"><span>ضريبة ({getVatRate(profile)}%)</span><span>{formatCurrency(vatAmount(subtotal, profile))}</span></div>
                <div className="r-row r-total"><span>الإجمالي (شاملاً الضريبة)</span><span>{formatTotal(invoiceTotal(subtotal, profile))}</span></div>
              </>
            )}
            {!hasVat(profile) && (
              <div className="r-row r-total"><span>الإجمالي</span><span>{formatTotal(subtotal)}</span></div>
            )}
          </div>

          <hr className="r-dash" />
          <div className="r-bank">
            <div className="r-bank-name">طرق الدفع</div>
            {profile.payMethods?.bank && (
              <div className="r-bank-method">
                <div className="r-bank-details">
                  {effectiveBankLogo && (
                    <img
                      className="r-pm-logo"
                      src={effectiveBankLogo}
                      alt="تحويل بنكي"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BANK_PLACEHOLDER }}
                    />
                  )}
                  <div className="r-row"><span>تحويل بنكي</span><span>بنك {profile.bankName}</span></div>
                  <div className="r-row"><span>اسم المستفيد</span><span>{profile.accountName || "عبدالله خليفه السعدون"}</span></div>
                  <div className="r-row"><span>الحساب</span><span>{profile.accountNumber || "-"}</span></div>
                  <div className="r-row"><span>IBAN</span><span dir="ltr">{profile.iban || "-"}</span></div>
                </div>
              </div>
            )}
            {profile.payMethods?.applePay && (
              <>
                {profile.payMethods?.applePayLogo && (
                  <img className="r-pm-logo" src={profile.payMethods.applePayLogo} alt="Apple Pay" />
                )}
                <div className="r-row"><span>Apple Pay</span><span dir="ltr">{profile.payMethods?.applePayPhone || "-"}</span></div>
              </>
            )}
            {profile.payMethods?.mastercard && (
              <>
                {profile.payMethods?.mastercardLogo && (
                  <img className="r-pm-logo" src={profile.payMethods.mastercardLogo} alt="Mastercard" />
                )}
                <div className="r-row"><span>Mastercard</span><span>ادفع بالبطاقة</span></div>
              </>
            )}
          </div>

          <div className="r-note">{invoice.note || profile.note}</div>

          <div className="r-codes">
            <canvas ref={canvasRef}></canvas>
            <div className="r-qr">
              <QRCodeCanvas value={zatcaQRData} size={70} />
            </div>
            <div style={{ direction: "ltr", textAlign: "center", fontSize: "0.6rem", color: "#000", marginTop: "4px" }}>
              <div>UUID: <b>{uuid}</b></div>
              <div>Hash: <b style={{ fontSize: "0.55rem" }}>{hash ? hash.slice(0, 16) + "..." : "-"}</b></div>
              <div>Stamp: <b style={{ fontSize: "0.55rem" }}>{stamp ? stamp.slice(0, 16) + "..." : "-"}</b></div>
            </div>
          </div>

          <div className="r-foot">شكراً لتعاملكم معنا</div>
        </div>
      </div>
    </div>
  )
}