import { useEffect, useState } from "react"
import {
  listAllBusinesses,
  listAllInvoices,
  getBusinessById
} from "../lib/storage.js"
import { formatCurrency, formatTotal, formatDate, calcSubtotal } from "../lib/format.js"

export default function AdminMonitor({ go }) {
  const [businesses, setBusinesses] = useState([])
  const [invoices, setInvoices] = useState([])
  const [bizNames, setBizNames] = useState({})

  useEffect(() => {
    listAllBusinesses().then(setBusinesses)
    listAllInvoices().then(async (list) => {
      setInvoices(list)
      const names = {}
      for (const inv of list) {
        if (!names[inv.business_id]) {
          const b = await getBusinessById(inv.business_id)
          names[inv.business_id] = b?.businessName || "—"
        }
      }
      setBizNames(names)
    })
  }, [])

  const total = invoices.reduce((s, i) => s + calcSubtotal(i.items), 0)
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + calcSubtotal(i.items), 0)
  const unpaid = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + calcSubtotal(i.items), 0)
  const refunded = invoices.filter((i) => i.status === "refunded").length

  return (
    <div>
      <div className="page-head">
        <h1>مراقبة الحسابات</h1>
      </div>

      <div className="stats">
        <div className="stat">
          <span>عدد الأنشطة</span>
          <strong>{businesses.length}</strong>
        </div>
        <div className="stat">
          <span>عدد الفواتير</span>
          <strong>{invoices.length}</strong>
        </div>
        <div className="stat">
          <span>إجمالي المبالغ</span>
          <strong>{formatTotal(total)}</strong>
        </div>
        <div className="stat">
          <span>المحصلة</span>
          <strong className="green">{formatTotal(paid)}</strong>
        </div>
        <div className="stat">
          <span>المستحقة</span>
          <strong className="red">{formatTotal(unpaid)}</strong>
        </div>
        <div className="stat">
          <span>المُلغاة</span>
          <strong>{refunded}</strong>
        </div>
      </div>

      <fieldset className="box">
        <legend>الأنشطة</legend>
        {businesses.length === 0 ? (
          <div className="empty">لا توجد أنشطة مسجّلة غير المسؤول.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>اسم النشاط</th>
                <th>اسم المستخدم</th>
                <th>الوثيقة</th>
                <th>فواتير</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id}>
                  <td>{b.businessName}</td>
                  <td dir="ltr">{b.username}</td>
                  <td>
                    {b.docType === "cr" ? "سجل تجاري" : "عمل حر"}:{" "}
                    <b dir="ltr">{b.docNumber || "-"}</b>
                  </td>
                  <td>{invoices.filter((i) => i.business_id === b.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </fieldset>

      <fieldset className="box">
        <legend>جميع الفواتير</legend>
        {invoices.length === 0 ? (
          <div className="empty">لا توجد فواتير.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>النشاط</th>
                <th>رقم الفاتورة</th>
                <th>العميل</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{bizNames[inv.business_id] || "—"}</td>
                  <td>{inv.number}</td>
                  <td>{inv.clientName || "-"}</td>
                  <td>{formatDate(inv.date)}</td>
                  <td>{formatTotal(calcSubtotal(inv.items))}</td>
                  <td>
                    <span className={`pill ${inv.status}`}>
                      {inv.status === "paid"
                        ? "مدفوعة"
                        : inv.status === "refunded"
                        ? "مُلغاة"
                        : "مستحقة"}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => go(`/i/${inv.id}`)}>عرض</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </fieldset>
    </div>
  )
}
