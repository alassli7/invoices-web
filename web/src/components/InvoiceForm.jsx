import { useEffect, useMemo, useRef, useState } from "react"
import {
  getInvoice,
  saveInvoice,
  getProfile,
  listInvoices,
  listCatalog,
  getNextInvoiceNumber
} from "../lib/storage.js"
import {
  calcSubtotal,
  formatCurrency,
  formatTotal,
  defaultProfile,
  parseNum,
  itemTotal,
  itemExtrasTotal,
  itemExtrasNames,
  getCustomerOptions,
  hasVat,
  vatAmount,
  invoiceTotal,
  isServiceItem,
  serviceUnits,
  itemQtyLabel
} from "../lib/format.js"
import NumInput from "./NumInput.jsx"

const emptyItem = () => ({ desc: "", qty: 1, price: 0, unit: "hour", type: "service" })

function nowParts() {
  const d = new Date()
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5)
  }
}

export default function InvoiceForm({ id, go, refresh }) {
  const [profile, setProfile] = useState(defaultProfile)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [number, setNumber] = useState("")
  const [date, setDate] = useState(nowParts().date)
  const [time, setTime] = useState(nowParts().time)
  const [dueDate, setDueDate] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientTaxNumber, setClientTaxNumber] = useState("")
  const [items, setItems] = useState([emptyItem()])
  const [status, setStatus] = useState("unpaid")
  const [note, setNote] = useState(defaultProfile.note)
  const [saving, setSaving] = useState(false)
  const [catalog, setCatalog] = useState([])
  const [search, setSearch] = useState("")
  const [basketType, setBasketType] = useState("service")
  const basketEndRef = useRef(null)

  useEffect(() => {
    listCatalog().then(setCatalog)
    .then(() => {
      const firstType = catalog[0]?.type
      setBasketType(firstType || "service")
    })
  }, [])

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p)
      setProfileLoaded(true)
      setNote(p.note)
    })
    if (id) {
      getInvoice(id).then((inv) => {
        if (!inv) return
        setNumber(inv.number || "")
        setDate(inv.date ? inv.date.slice(0, 10) : date)
        setTime(inv.time || time)
        setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "")
        setClientName(inv.clientName || "")
        setClientPhone(inv.clientPhone || "")
        setClientEmail(inv.clientEmail || "")
        setClientAddress(inv.clientAddress || "")
        setClientTaxNumber(inv.clientTaxNumber || "")
        setItems(inv.items && inv.items.length ? inv.items : [emptyItem()])
        setStatus(inv.status || "unpaid")
        setNote(inv.note || defaultProfile.note)
      })
    } else {
      const { date: d, time: t } = nowParts()
      setDate(d)
      setTime(t)
      getNextInvoiceNumber().then(setNumber)
    }
    // eslint-disable-next-line
  }, [])

  // الأصناف المعروضة مع البحث
  const visibleCatalog = useMemo(() => {
    const q = search.trim()
    if (!q) return catalog
    return catalog.filter((c) =>
      (c.desc || "").toLowerCase().includes(q.toLowerCase())
    )
  }, [catalog, search])

  // إضافة صنف من الكتالوج إلى السلة
  const addCatalogToBasket = (c) => {
    const existing = items.find(
      (it) =>
        !it.cancelled &&
        it.desc === c.desc &&
        it.extras === undefined &&
        parseNum(it.price) === parseNum(c.price)
    )
    if (existing) {
      // زيادة الكمية إذا كان نفس البند غير_modifier
      setItems((prev) =>
        prev.map((it) =>
          it === existing ? { ...it, qty: (parseNum(it.qty) || 0) + 1 } : it
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          desc: c.desc,
          qty: parseNum(c.qty) || 1,
          price: parseNum(c.price),
          type: c.type || "service",
          unit: c.unit || "hour",
          image: c.image || ""
        }
      ])
    }
    requestAnimationFrame(() =>
      basketEndRef.current?.scrollIntoView({ behavior: "smooth" })
    )
  }

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    )
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const removeItem = (idx) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : [emptyItem()]
    )

  const toggleCancel = (idx) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, cancelled: !it.cancelled } : it))
    )

  // خيارات العميل: إضافة/إزالة مكوّن (موجب بسعر) أو خيار «بدون» (بدون سعر)
  const toggleOption = (idx, name, price) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const extras = it.extras || []
        const has = extras.some((e) => e.name === name)
        return {
          ...it,
          extras: has
            ? extras.filter((e) => e.name !== name)
            : [...extras, { name, price: getExtrasForType(basketType)?.find(e => e.name === name)?.price ?? price }]
        }
      })
    )

  const save = async () => {
    setSaving(true)
    const existing = await listInvoices()
    const canEditMetaSave = profile.role !== "staff"
    let num = ""
    if (canEditMetaSave && number && number.trim()) {
      num = number.trim()
    } else if (!id) {
      // الموظف أو حقل فارغ: ولّد رقما جديدا عبر RPC ولا تسمح بالتعديل
      try {
        num = await getNextInvoiceNumber()
      } catch {
        const year = new Date().getFullYear()
        const prefix = `INV-${year}-`
        let max = 0
        for (const inv of existing) {
          if (typeof inv.number === "string" && inv.number.startsWith(prefix)) {
            const n = parseInt(inv.number.slice(prefix.length), 10)
            if (!isNaN(n) && n > max) max = n
          }
        }
        num = `${prefix}${String(max + 1).padStart(4, "0")}`
      }
    } else {
      num = number.trim() || existing.find((inv) => inv.id === id)?.number || ""
      if (!num) {
        try {
          num = await getNextInvoiceNumber()
        } catch {
          const year = new Date().getFullYear()
          const prefix = `INV-${year}-`
          let max = 0
          for (const inv of existing) {
            if (typeof inv.number === "string" && inv.number.startsWith(prefix)) {
              const n = parseInt(inv.number.slice(prefix.length), 10)
              if (!isNaN(n) && n > max) max = n
            }
          }
          num = `${prefix}${String(max + 1).padStart(4, "0")}`
        }
      }
    }
    if (!id) {
      const taken = new Set(existing.map((i) => i.number))
      if (taken.has(num)) {
        let i = 1
        let cand = num
        while (taken.has(cand)) {
          i++
          cand = `${num}-${i}`
        }
        num = cand
      }
    }
    // الوقت والتاريخ غير قابلين للتعديل نهائياً — عند الإنشاء يُجبر على الحالية، عند التعديل يُحفظ الأصلي
    let finalDate = date
    let finalTime = time
    if (!id) {
      const now = nowParts()
      finalDate = now.date
      finalTime = now.time
    } else {
      const orig = existing.find((inv) => inv.id === id)
      if (orig) {
        finalDate = orig.date || date
        finalTime = orig.time || time
      }
    }
    const invoice = {
      id: id || num,
      number: num,
      date: finalDate,
      time: finalTime,
      dueDate,
      amended: id ? true : false,
      revisedAt: id ? new Date().toISOString() : null,
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      clientTaxNumber,
      items,
      status,
      note: note || profile.note,
      createdAt: new Date().toISOString()
    }
    await saveInvoice(invoice)
    setSaving(false)
    refresh()
    go(`/i/${invoice.id}`)
  }

  const subtotal = calcSubtotal(items)
  const vat = vatAmount(subtotal, profile)
  const grand = invoiceTotal(subtotal, profile)

  const isNew = !id
  const canEditMeta = profileLoaded ? profile.role !== "staff" : false
  return (
    <div className="pos">
      <div className="page-head pos-head">
        <h1>{id ? "تعديل فاتورة" : "فاتورة جديدة"}</h1>
        <div className="pos-meta">
          <label>
            رقم الفاتورة
            <input
              value={number}
              readOnly={!canEditMeta}
              disabled={!canEditMeta}
              onChange={canEditMeta ? (e) => setNumber(e.target.value) : undefined}
              placeholder={isNew ? "جاري التوليد تلقائياً..." : ""}
              title={
                canEditMeta
                  ? "يمكن للمالك تعديل الرقم - يُولد تلقائياً عبر generate_invoice_number"
                  : "يُولد تلقائياً عبر generate_invoice_number ولا يمكن تعديله إلا لحساب المالك"
              }
              style={{
                background: canEditMeta ? "#fff" : "#f6f7f0",
                color: "#1b2a20",
                cursor: canEditMeta ? "text" : "not-allowed",
                opacity: canEditMeta ? 1 : 0.85,
                borderColor: "#cdc9b2"
              }}
              tabIndex={canEditMeta ? 0 : -1}
            />
            {isNew && !number && (
              <span style={{ fontSize: ".75rem", color: "#6b7568" }}>يتم التوليد من Supabase RPC...</span>
            )}
            {isNew && number && !canEditMeta && (
              <span style={{ fontSize: ".72rem", color: "#1f4d3a" }}>مولّد تلقائياً • غير قابل للتعديل إلا للمالك</span>
            )}
            {canEditMeta && (
              <span style={{ fontSize: ".72rem", color: "#1f6b3b" }}>وضع المالك: يمكنك التعديل</span>
            )}
          </label>
          <label>
            التاريخ
            <input
              type="date"
              value={date}
              readOnly
              disabled
              tabIndex={-1}
              style={{ background: "#f6f7f0", cursor: "not-allowed", opacity: 0.85 }}
              title="تاريخ الإنشاء — غير قابل للتعديل (يُحدد تلقائياً)"
            />
            <span style={{ fontSize: ".72rem", color: "#6b7568" }}>غير قابل للتعديل</span>
          </label>
          <label>
            الوقت
            <input
              type="time"
              value={time}
              readOnly
              disabled
              tabIndex={-1}
              style={{ background: "#f6f7f0", cursor: "not-allowed", opacity: 0.85 }}
              title="وقت الإنشاء — غير قابل للتعديل (يُحدد تلقائياً)"
            />
            <span style={{ fontSize: ".72rem", color: "#6b7568" }}>غير قابل للتعديل</span>
          </label>
          <label>
            الحالة
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="unpaid">مستحقة</option>
              <option value="paid">مدفوعة</option>
            </select>
          </label>
        </div>
      </div>

      <div className="pos-client" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="اسم العميل / الجهة *"
          style={{ gridColumn: "1 / -1" }}
        />
        <input
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="الجوال"
        />
        <input
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          placeholder="البريد (اختياري)"
        />
        <input
          value={clientAddress}
          onChange={(e) => setClientAddress(e.target.value)}
          placeholder="عنوان العميل"
        />
        <input
          value={clientTaxNumber}
          onChange={(e) => setClientTaxNumber(e.target.value)}
          placeholder="الرقم الضريبي للعميل (إن وجد)"
          dir="ltr"
        />
      </div>

      <div className="pos-body">
        {/* ====== الأعلى: قائمة الأصناف ====== */}
        <section className="pos-catalog">
          <div className="pos-cat-head">
            <h2>الأصناف</h2>
            <input
              className="pos-search"
              placeholder="بحث…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="menu-grid">
            {visibleCatalog.length === 0 && (
              <p className="hint">
                لا توجد أصناف. أضف أصنافاً من صفحة الأصناف (الكتالوج).
              </p>
            )}
            {visibleCatalog.map((c) => (
              <button
                type="button"
                key={c.id}
                className="menu-card"
                onClick={() => addCatalogToBasket(c)}
              >
                {c.image ? (
                  <img src={c.image} alt={c.desc} className="menu-thumb" />
                ) : (
                  <div className="menu-thumb menu-thumb-empty">بدون صورة</div>
                )}
                <span className="menu-name">{c.desc}</span>
                <span className="menu-price">{formatCurrency(c.price)}</span>
              </button>
            ))}
          </div>
          <button className="ghost pos-custom" type="button" onClick={addItem}>
            + إضافة بند مخصص يدوياً
          </button>
        </section>

        {/* ====== الأسفل: السلة ====== */}
        <section className="pos-basket">
          <div className="pos-cat-head">
            <h2>السلة</h2>
            <span className="pos-count">{items.length} بند</span>
          </div>
          <div className="pos-basket-list">
            {items.map((it, idx) => (
              <div
                key={idx}
                className={`basket-row${it.cancelled ? " cancelled" : ""}`}
              >
                <div className="basket-main">
                  <div className="basket-thumb">
                    {it.image ? (
                      <img src={it.image} alt={it.desc} className="menu-thumb" />
                    ) : (
                      <div className="menu-thumb menu-thumb-empty">—</div>
                    )}
                  </div>
                  <div className="basket-desc">
                    <input
                      value={it.desc}
                      onChange={(e) => updateItem(idx, "desc", e.target.value)}
                      placeholder="وصف البند"
                    />
                    <div className="basket-qty">
                      <NumInput
                        value={it.qty}
                        onCommit={(v) => updateItem(idx, "qty", v)}
                      />
                      {isServiceItem(it) && (
                        <select
                          value={it.unit || "hour"}
                          onChange={(e) => updateItem(idx, "unit", e.target.value)}
                          style={{ padding: "4px 6px", border: "1px solid #cdc9b2", borderRadius: "3px", fontSize: "0.85rem" }}
                        >
                          {serviceUnits.filter(u => ["hour","day","month"].includes(u.value)).map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      )}
                      <span className="basket-unit-price">
                        × {formatCurrency(it.price)}
                      </span>
                      <NumInput
                        value={it.price}
                        className="basket-price"
                        onCommit={(v) => updateItem(idx, "price", v)}
                      />
                    </div>
                    {isServiceItem(it) && (
                      <div style={{ fontSize: ".75rem", color: "#6b7568", marginTop: "2px" }}>{itemQtyLabel(it)}</div>
                    )}
                  </div>
                  <div className="basket-total">
                    <strong>{formatCurrency(itemTotal(it))}</strong>
                  </div>
                  <div className="basket-actions">
                    <button
                      className="link"
                      type="button"
                      onClick={() => toggleCancel(idx)}
                    >
                      {it.cancelled ? "تراجع" : "إلغاء"}
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => removeItem(idx)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="basket-options">
                  {getCustomerOptions(basketType).map((o) => {
                    const on = (it.extras || []).some((x) => x.name === o.name)
                    return (
                      <button
                        type="button"
                        key={o.name}
                        className={on ? "opt-chip on" : "opt-chip"}
                        onClick={() => toggleOption(idx, o.name, o.price)}
                      >
                        {o.name}
                        {o.price > 0 ? ` +${formatCurrency(o.price)}` : ""}
                      </button>
                    )
                  })}
                  {itemExtrasTotal(it) > 0 && (
                    <span className="basket-opt-total">
                      مكوّنات: +{formatCurrency(itemExtrasTotal(it))}
                    </span>
                  )}
                  {itemExtrasNames(it).join("، ") && (
                    <span className="basket-opt-list">
                      {itemExtrasNames(it).join("، ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={basketEndRef} />
          </div>

          <div className="pos-totals">
            <div className="pos-total-line">
              <span>المجموع الفرعي</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            {hasVat(profile) && (
              <div className="pos-total-line">
                <span>ضريبة القيمة المضافة</span>
                <strong>{formatCurrency(vat)}</strong>
              </div>
            )}
            <div className="pos-total-line grand">
              <span>الإجمالي</span>
              <strong>{formatTotal(grand)}</strong>
            </div>
            <button
              className="primary pos-save"
              disabled={saving}
              onClick={save}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ وعرض الفاتورة"}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
