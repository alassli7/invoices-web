import { useState } from "react"

// ── inline helpers (replaces ../lib/storage.js + ../lib/format.js for standalone preview) ──
const calcSubtotal = (items = []) =>
  items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0)

const formatTotal = (n) =>
  n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س"

const formatDate = (d) => {
  if (!d) return "-"
  try { return new Date(d).toLocaleDateString("ar-SA-u-ca-gregory") } catch { return d }
}

const SEED = [
  { id: "1", number: "INV-2026-0038", clientName: "شركة البرمجيات الذكية", date: "2026-08-14", status: "paid",   items: [{ price: 15000, qty: 1 }, { price: 5000, qty: 1 }] },
  { id: "2", number: "INV-2026-0039", clientName: "مؤسسة الخليج للتقنية",   date: "2026-08-28", status: "unpaid", items: [{ price: 8500, qty: 1 }] },
  { id: "3", number: "INV-2026-0040", clientName: "أحمد المطيري",            date: "2026-09-03", status: "unpaid", items: [{ price: 2200, qty: 3 }] },
  { id: "4", number: "INV-2026-0041", clientName: "شركة التقانة الحديثة",   date: "2026-09-10", status: "refunded", items: [{ price: 1200, qty: 1 }] },
]

const PROFILE = { businessName: "استوديو الشيف — برمجة وتصميم" }

export default function Dashboard({ go, refresh }) {
  const [invoices, setInvoices] = useState(SEED)
  const [profile] = useState(PROFILE)
  const [editTarget, setEditTarget] = useState(null)
  const [editInput, setEditInput] = useState("")
  const [editErr, setEditErr] = useState("")

  const remove = (id) => {
    if (!confirm("حذف الفاتورة؟")) return
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    refresh?.()
  }

  const setStatus = (inv, status) => {
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status } : i)))
    refresh?.()
  }

  const confirmEdit = () => {
    if (editTarget && editInput.trim() === editTarget.number) {
      const id = editTarget.id
      setEditTarget(null)
      setEditInput("")
      go?.(`/edit/${id}`)
    } else {
      setEditErr("رقم الفاتورة غير مطابق")
    }
  }

  const total  = invoices.reduce((s, i) => s + calcSubtotal(i.items), 0)
  const paid   = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + calcSubtotal(i.items), 0)
  const unpaid = total - paid

  return (
    <div className="db-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@700&display=swap');

        .db-root {
          --ink: #1b2a20;
          --paper: #eef0e5;
          --paper-white: #f9f9f2;
          --pine: #1f4d3a;
          --pine-deep: #163527;
          --stamp: #9c3b29;
          --gold: #b98a34;
          --line: #cdc9b2;
          --line-soft: #dedbc7;

          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background: var(--paper);
          color: var(--ink);
          direction: rtl;
          line-height: 1.6;
          min-height: 100vh;
          padding: 28px;
          -webkit-font-smoothing: antialiased;
        }
        .db-root * { box-sizing: border-box; }
        .db-root button { font-family: inherit; cursor: pointer; border: none; }

        .db-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
        .db-head h1 { margin: 0; font-family: 'Aref Ruqaa', serif; font-size: 1.8rem; font-weight: 700; }
        .db-head-sub { margin: 4px 0 0; font-size: 0.88rem; color: #5a6355; }

        .db-btn { padding: 10px 20px; border-radius: 3px; font-weight: 600; font-size: 0.9rem; transition: background 0.15s ease, border-color 0.15s ease; }
        .db-btn-primary { background: var(--pine); color: var(--paper-white); }
        .db-btn-primary:hover { background: var(--pine-deep); }
        .db-btn-ghost { background: transparent; border: 1px solid var(--line); color: var(--ink); }
        .db-btn-ghost:hover { background: var(--paper-white); }

        .db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line-soft); border: 1px solid var(--line-soft); border-radius: 3px; overflow: hidden; margin-bottom: 32px; }
        .db-stat { background: var(--paper-white); padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
        .db-stat span { font-size: 0.78rem; color: #6b7568; }
        .db-stat strong { font-size: 1.2rem; font-variant-numeric: tabular-nums; }
        .db-amt-paid { color: var(--pine-deep); }
        .db-amt-due  { color: var(--stamp); }
        @media (max-width: 760px) { .db-stats { grid-template-columns: 1fr 1fr; } }

        .db-table-wrap { overflow-x: auto; border: 1px solid var(--line-soft); border-radius: 3px; }
        .db-table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
        .db-table thead th { text-align: right; padding: 11px 14px; font-size: 0.76rem; font-weight: 600; color: #6b7568; border-bottom: 1.5px solid var(--ink); white-space: nowrap; background: var(--paper); }
        .db-table tbody td { padding: 12px 14px; border-bottom: 1px solid var(--line-soft); vertical-align: middle; }
        .db-table tbody tr:nth-child(even) td { background: rgba(255,255,255,0.45); }
        .db-table tbody tr:last-child td { border-bottom: none; }
        .db-num { font-variant-numeric: tabular-nums; color: var(--pine-deep); font-weight: 600; white-space: nowrap; }
        .db-amt { font-variant-numeric: tabular-nums; white-space: nowrap; }

        .db-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 3px; font-size: 0.76rem; font-weight: 600; white-space: nowrap; }
        .db-pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .db-pill-paid     { background: rgba(31,77,58,0.1);   color: var(--pine-deep); }
        .db-pill-paid::before { background: var(--pine); }
        .db-pill-unpaid   { background: rgba(185,138,52,0.15); color: #8a6a28; }
        .db-pill-unpaid::before { background: var(--gold); }
        .db-pill-refunded { background: rgba(156,59,41,0.1);  color: var(--stamp); }
        .db-pill-refunded::before { background: var(--stamp); }

        .db-actions { display: flex; flex-wrap: wrap; gap: 4px; }
        .db-actions button { background: transparent; border: 1px solid var(--line); border-radius: 3px; padding: 5px 9px; font-size: 0.75rem; color: var(--ink); white-space: nowrap; transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .db-actions button:hover { border-color: var(--pine); color: var(--pine-deep); }
        .db-danger { color: var(--stamp) !important; }
        .db-danger:hover { border-color: var(--stamp) !important; background: rgba(156,59,41,0.06) !important; }

        .db-empty { border: 1px dashed var(--line); border-radius: 3px; padding: 48px 24px; text-align: center; color: #5a6355; background: var(--paper-white); }
        .db-empty p { margin: 0; }

        .db-overlay { position: fixed; inset: 0; background: rgba(27,42,32,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50; }
        .db-modal { background: var(--paper-white); border-radius: 3px; padding: 28px; max-width: 400px; width: 100%; box-shadow: 0 20px 50px -20px rgba(0,0,0,0.4); }
        .db-modal h3 { margin: 0 0 10px; font-size: 1.08rem; font-weight: 700; }
        .db-modal p  { margin: 0 0 14px; font-size: 0.9rem; color: #3d4a41; }
        .db-input { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 3px; font-size: 0.95rem; font-family: inherit; background: var(--paper-white); color: var(--ink); }
        .db-input:focus { outline: none; border-color: var(--pine); box-shadow: 0 0 0 3px rgba(31,77,58,0.12); }
        .db-err { margin-top: 10px; padding: 8px 12px; background: rgba(156,59,41,0.08); color: var(--stamp); border-radius: 3px; font-size: 0.85rem; }
        .db-modal-footer { display: flex; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px dashed var(--line-soft); justify-content: flex-end; }
      `}</style>

      {/* ─── header ─── */}
      <div className="db-head">
        <div>
          <h1>الحسابات</h1>
          {profile?.businessName && <p className="db-head-sub">{profile.businessName}</p>}
        </div>
        <button className="db-btn db-btn-primary" onClick={() => go?.("/new")}>
          + فاتورة جديدة
        </button>
      </div>

      {/* ─── stats bar ─── */}
      <div className="db-stats">
        <div className="db-stat">
          <span>إجمالي الإيرادات</span>
          <strong>{formatTotal(total)}</strong>
        </div>
        <div className="db-stat">
          <span>المحصلة (مدفوعة)</span>
          <strong className="db-amt-paid">{formatTotal(paid)}</strong>
        </div>
        <div className="db-stat">
          <span>المستحقة</span>
          <strong className="db-amt-due">{formatTotal(unpaid)}</strong>
        </div>
        <div className="db-stat">
          <span>عدد الفواتير</span>
          <strong>{invoices.length}</strong>
        </div>
      </div>

      {/* ─── invoices table ─── */}
      {invoices.length === 0 ? (
        <div className="db-empty">
          <p>لا توجد فواتير بعد. أنشئ فاتورة من «فاتورة جديدة».</p>
        </div>
      ) : (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="db-num">{inv.number}</td>
                  <td>{inv.clientName || "-"}</td>
                  <td>{formatDate(inv.date)}</td>
                  <td className="db-amt">{formatTotal(calcSubtotal(inv.items))}</td>
                  <td>
                    <span className={`db-pill db-pill-${inv.status}`}>
                      {inv.status === "paid" ? "مدفوعة" : inv.status === "refunded" ? "مُلغاة" : "مستحقة"}
                    </span>
                  </td>
                  <td>
                    <div className="db-actions">
                      <button onClick={() => go?.(`/i/${inv.id}`)}>عرض</button>
                      <button onClick={() => go?.(`/r/${inv.id}`)}>إيبسون</button>
                      <button onClick={() => { setEditTarget(inv); setEditInput(""); setEditErr("") }}>تعديل</button>
                      <button onClick={() => setStatus(inv, inv.status === "paid" ? "unpaid" : "paid")}>
                        {inv.status === "paid" ? "إلغاء الدفع" : "تحديد مدفوعة"}
                      </button>
                      <button onClick={() => setStatus(inv, inv.status === "refunded" ? "unpaid" : "refunded")}>
                        {inv.status === "refunded" ? "تراجع عن الإلغاء" : "إلغاء / استرجاع"}
                      </button>
                      <button className="db-danger" onClick={() => remove(inv.id)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── edit confirmation modal ─── */}
      {editTarget && (
        <div className="db-overlay" onClick={() => setEditTarget(null)}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد التعديل</h3>
            <p>أدخل رقم الفاتورة (<b dir="ltr">{editTarget.number}</b>) للمتابعة:</p>
            <input
              className="db-input"
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              placeholder="رقم الفاتورة"
              dir="ltr"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
            />
            {editErr && <div className="db-err">{editErr}</div>}
            <div className="db-modal-footer">
              <button className="db-btn db-btn-ghost" onClick={() => setEditTarget(null)}>إلغاء</button>
              <button className="db-btn db-btn-primary" onClick={confirmEdit}>متابعة التعديل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
