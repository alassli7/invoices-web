import { useCallback, useEffect, useMemo, useState } from "react"
import {
  listInvoices,
  deleteInvoice,
  saveInvoice,
  getProfile
} from "../lib/storage.js"
import { formatTotal, formatDate, calcSubtotal } from "../lib/format.js"

export default function Dashboard({ go, refresh }) {
  const [invoices, setInvoices] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [editTarget, setEditTarget] = useState(null)
  const [editInput, setEditInput] = useState("")
  const [editErr, setEditErr] = useState("")

  const closeEditModal = useCallback(() => {
    setEditTarget(null)
    setEditInput("")
    setEditErr("")
  }, [])

  const openEditModal = useCallback((invoice) => {
    setEditTarget(invoice)
    setEditInput("")
    setEditErr("")
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [invoiceList, profileData] = await Promise.all([
        listInvoices(),
        getProfile()
      ])
      setInvoices(Array.isArray(invoiceList) ? invoiceList : [])
      setProfile(profileData || null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const syncAfterChange = useCallback(async () => {
    refresh?.()
    setInvoices(await listInvoices())
  }, [refresh])

  const removeInvoice = useCallback(
    async (id) => {
      if (!window.confirm("حذف الفاتورة؟")) return
      await deleteInvoice(id)
      await syncAfterChange()
    },
    [syncAfterChange]
  )

  const updateStatus = useCallback(
    async (invoice, status) => {
      await saveInvoice({ ...invoice, status })
      await syncAfterChange()
    },
    [syncAfterChange]
  )

  const confirmEdit = useCallback(() => {
    const entered = editInput.trim()
    const expected = editTarget?.number?.trim?.() || ""

    if (editTarget && entered === expected) {
      const id = editTarget.id
      closeEditModal()
      go(`/edit/${id}`)
      return
    }

    setEditErr("رقم الفاتورة غير مطابق")
  }, [editInput, editTarget, closeEditModal, go])

  const activeInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status !== "refunded"),
    [invoices]
  )

  const stats = useMemo(() => {
    const total = activeInvoices.reduce(
      (sum, invoice) => sum + calcSubtotal(invoice.items || []),
      0
    )

    const paid = activeInvoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + calcSubtotal(invoice.items || []), 0)

    return {
      total,
      paid,
      unpaid: total - paid,
      count: invoices.length
    }
  }, [activeInvoices, invoices.length])

  const getStatusLabel = (status) => {
    if (status === "paid") return "مدفوعة"
    if (status === "refunded") return "مُلغاة"
    return "مستحقة"
  }

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
          color: var(--ink);
          direction: rtl;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .db-root * { box-sizing: border-box; }

        .db-root button {
          font-family: inherit;
          cursor: pointer;
          border: none;
        }

        .db-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .db-head h1 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 700;
        }

        .db-head-sub {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: #5a6355;
        }

        .db-btn {
          padding: 10px 20px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .db-btn-primary {
          background: var(--pine);
          color: var(--paper-white);
        }

        .db-btn-primary:hover {
          background: var(--pine-deep);
        }

        .db-btn-ghost {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink);
        }

        .db-btn-ghost:hover {
          background: var(--paper);
        }

        .db-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--line-soft);
          border: 1px solid var(--line-soft);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 32px;
        }

        .db-stat {
          background: var(--paper-white);
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .db-stat span {
          font-size: 0.8rem;
          color: #6b7568;
        }

        .db-stat strong {
          font-size: 1.3rem;
          font-variant-numeric: tabular-nums;
        }

        .db-amt-paid { color: var(--pine-deep); }
        .db-amt-due { color: var(--stamp); }

        @media (max-width: 760px) {
          .db-stats { grid-template-columns: 1fr 1fr; }
        }

        .db-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--line-soft);
          border-radius: 3px;
        }

        .db-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .db-table thead th {
          text-align: right;
          padding: 12px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #6b7568;
          border-bottom: 1.5px solid var(--ink);
          white-space: nowrap;
          background: var(--paper);
        }

        .db-table tbody td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--line-soft);
          vertical-align: middle;
        }

        .db-table tbody tr:nth-child(even) td {
          background: rgba(255,255,255,0.4);
        }

        .db-table tbody tr:last-child td {
          border-bottom: none;
        }

        .db-num {
          font-variant-numeric: tabular-nums;
          color: var(--pine-deep);
          font-weight: 600;
          white-space: nowrap;
        }

        .db-amt {
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .db-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 3px;
          font-size: 0.78rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .db-pill::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .db-pill-paid {
          background: rgba(31,77,58,0.1);
          color: var(--pine-deep);
        }

        .db-pill-paid::before {
          background: var(--pine);
        }

        .db-pill-unpaid {
          background: rgba(185,138,52,0.15);
          color: #8a6a28;
        }

        .db-pill-unpaid::before {
          background: var(--gold);
        }

        .db-pill-refunded {
          background: rgba(156,59,41,0.1);
          color: var(--stamp);
        }

        .db-pill-refunded::before {
          background: var(--stamp);
        }

        .db-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .db-actions button {
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 3px;
          padding: 5px 9px;
          font-size: 0.76rem;
          color: var(--ink);
          white-space: nowrap;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }

        .db-actions button:hover {
          border-color: var(--pine);
          color: var(--pine-deep);
        }

        .db-actions .db-danger {
          color: var(--stamp);
        }

        .db-actions .db-danger:hover {
          border-color: var(--stamp);
          background: rgba(156,59,41,0.06);
        }

        .db-empty {
          border: 1px dashed var(--line);
          border-radius: 3px;
          padding: 48px 24px;
          text-align: center;
          color: #5a6355;
          background: var(--paper-white);
        }

        .db-empty p {
          margin: 0;
        }

        .db-loading {
          border: 1px dashed var(--line);
          border-radius: 3px;
          padding: 32px 24px;
          text-align: center;
          color: #5a6355;
          background: var(--paper-white);
          margin-bottom: 24px;
        }

        .db-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(27,42,32,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
        }

        .db-modal {
          background: var(--paper-white);
          border-radius: 3px;
          padding: 26px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 50px -20px rgba(0,0,0,0.4);
        }

        .db-modal h3 {
          margin: 0 0 10px;
          font-size: 1.1rem;
        }

        .db-modal p {
          margin: 0 0 14px;
          font-size: 0.9rem;
          color: #3d4a41;
        }

        .db-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 3px;
          font-size: 0.95rem;
          font-family: inherit;
          background: var(--paper-white);
          color: var(--ink);
        }

        .db-input:focus {
          outline: none;
          border-color: var(--pine);
          box-shadow: 0 0 0 3px rgba(31,77,58,0.12);
        }

        .db-error {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(156,59,41,0.08);
          color: var(--stamp);
          border-radius: 3px;
          font-size: 0.85rem;
        }

        .db-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px dashed var(--line-soft);
          justify-content: flex-end;
        }
      `}</style>

      <div className="db-head">
        <div>
          <h1>الحسابات</h1>
          {profile?.businessName ? (
            <p className="db-head-sub">{profile.businessName}</p>
          ) : null}
        </div>

        <button className="db-btn db-btn-primary" onClick={() => go("/new")}>
          + فاتورة جديدة
        </button>
      </div>

      <div className="db-stats">
        <div className="db-stat">
          <span>إجمالي الإيرادات</span>
          <strong>{formatTotal(stats.total)}</strong>
        </div>

        <div className="db-stat">
          <span>المحصلة (مدفوعة)</span>
          <strong className="db-amt-paid">{formatTotal(stats.paid)}</strong>
        </div>

        <div className="db-stat">
          <span>المستحقة</span>
          <strong className="db-amt-due">{formatTotal(stats.unpaid)}</strong>
        </div>

        <div className="db-stat">
          <span>عدد الفواتير</span>
          <strong>{stats.count}</strong>
        </div>
      </div>

      {loading ? (
        <div className="db-loading">جاري تحميل الفواتير...</div>
      ) : invoices.length === 0 ? (
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
              {invoices.map((invoice) => {
                const amount = calcSubtotal(invoice.items || [])

                return (
                  <tr key={invoice.id}>
                    <td className="db-num">{invoice.number}</td>
                    <td>{invoice.clientName || "-"}</td>
                    <td>{formatDate(invoice.date)}</td>
                    <td className="db-amt">{formatTotal(amount)}</td>
                    <td>
                      <span className={`db-pill db-pill-${invoice.status || "unpaid"}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td>
                      <div className="db-actions">
                        <button onClick={() => go(`/i/${invoice.id}`)}>عرض</button>

                        <button onClick={() => go(`/r/${invoice.id}`)}>إيبسون</button>

                        <button onClick={() => openEditModal(invoice)}>تعديل</button>

                        <button
                          onClick={() =>
                            updateStatus(
                              invoice,
                              invoice.status === "paid" ? "unpaid" : "paid"
                            )
                          }
                        >
                          {invoice.status === "paid" ? "إلغاء الدفع" : "تحديد مدفوعة"}
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              invoice,
                              invoice.status === "refunded" ? "unpaid" : "refunded"
                            )
                          }
                        >
                          {invoice.status === "refunded"
                            ? "تراجع عن الإلغاء"
                            : "إلغاء / استرجاع"}
                        </button>

                        <button
                          className="db-danger"
                          onClick={() => removeInvoice(invoice.id)}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editTarget ? (
        <div className="db-modal-overlay" onClick={closeEditModal}>
          <div className="db-modal" onClick={(e) => e.stopPropagation()}>
            <h3>تأكيد التعديل</h3>
            <p>
              أدخل رقم الفاتورة (<b dir="ltr">{editTarget.number}</b>) للمتابعة:
            </p>

            <input
              className="db-input"
              value={editInput}
              onChange={(e) => {
                setEditInput(e.target.value)
                if (editErr) setEditErr("")
              }}
              placeholder="رقم الفاتورة"
              dir="ltr"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmEdit()
                if (e.key === "Escape") closeEditModal()
              }}
            />

            {editErr ? <div className="db-error">{editErr}</div> : null}

            <div className="db-modal-actions">
              <button className="db-btn db-btn-ghost" onClick={closeEditModal}>
                إلغاء
              </button>
              <button className="db-btn db-btn-primary" onClick={confirmEdit}>
                متابعة التعديل
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}