import { useEffect, useMemo, useRef, useState } from "react"
import {
  getProfile,
  listCatalog,
  listInvoices,
  saveInvoice,
  getNextInvoiceNumber
} from "../lib/storage.js"
import {
  calcSubtotal,
  getCustomerOptions,
  getExtrasForType,
  defaultProfile,
  formatCurrency,
  formatTotal,
  hasVat,
  invoiceTotal,
  itemExtrasNames,
  itemExtrasTotal,
  itemTotal,
  parseNum,
  vatAmount
} from "../lib/format.js"

function nowParts() {
  const d = new Date()
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5)
  }
}

export default function PosCashier({ go }) {
  const [profile, setProfile] = useState(defaultProfile)
  const [catalog, setCatalog] = useState([])
  const [search, setSearch] = useState("")
  const [items, setItems] = useState([])
  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [businessType, setBusinessType] = useState("service")
  const basketEndRef = useRef(null)

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p)
      setBusinessType(p.businessCategory || "service")
    })
    listCatalog().then(setCatalog)
  }, [])

  const visibleCatalog = useMemo(() => {
    const q = search.trim().toLowerCase()
    // فلترة حسب نوع النشاط أولاً
    const byType = catalog.filter((c) => {
      if (!c.type) return true // أصناف بدون نوع تظهر دائماً
      return c.type === businessType
    })
    if (!q) return byType
    return byType.filter((c) => (c.desc || "").toLowerCase().includes(q))
  }, [catalog, search, businessType])

  // إضافة صنف من الكتالوج إلى السلة
  const addToBasket = (c) => {
    const existing = items.find(
      (it) =>
        !it.cancelled &&
        it.desc === c.desc &&
        (!it.extras || it.extras.length === 0) &&
        parseNum(it.price) === parseNum(c.price)
    )
    if (existing) {
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
          image: c.image || ""
        }
      ])
    }
    requestAnimationFrame(() =>
      basketEndRef.current?.scrollIntoView({ behavior: "smooth" })
    )
  }

  const addQty = (idx, d) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const q = (parseNum(it.qty) || 0) + d
        return q <= 0 ? { ...it, qty: 1 } : { ...it, qty: q }
      })
    )

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const clearAll = () => {
    if (items.length && confirm("مسح جميع الطلبات؟")) setItems([])
  }

  // خيارات العميل: إضافة/إزالة مكوّن (موجب بسعر) أو خيار «بدون» (بدون سعر)
  const toggleOption = (idx, name, price, type) =>
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it
        const extras = it.extras || []
        const has = extras.some((e) => e.name === name)
        return {
          ...it,
          extras: has
            ? extras.filter((e) => e.name !== name)
            : [...extras, { name, price: getExtrasForType(type)?.find(e => e.name === name)?.price ?? price }]
        }
      })
    )

  const checkout = async () => {
    if (!items.length) return
    setSaving(true)
    try {
      let number = ""
      try {
        number = await getNextInvoiceNumber()
      } catch {
        const existing = await listInvoices()
        const year = new Date().getFullYear()
        const prefix = `INV-${year}-`
        let max = 0
        for (const inv of existing) {
          if (typeof inv.number === "string" && inv.number.startsWith(prefix)) {
            const n = parseInt(inv.number.slice(prefix.length), 10)
            if (!isNaN(n) && n > max) max = n
          }
        }
        number = `${prefix}${String(max + 1).padStart(4, "0")}`
      }
      const { date, time } = nowParts()
      const invoice = {
        id: number,
        number,
        date,
        time,
        dueDate: null,
        amended: false,
        revisedAt: null,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: "",
        items,
        status: "paid",
        note: note.trim(),
        createdAt: new Date().toISOString()
      }
      await saveInvoice(invoice)
      setItems([])
      setClientName("")
      setClientPhone("")
      setNote("")
      go(`/i/${invoice.id}`)
    } finally {
      setSaving(false)
    }
  }

  const subtotal = calcSubtotal(items)
  const vat = vatAmount(subtotal, profile)
  const grand = invoiceTotal(subtotal, profile)

  return (
    <div className="pos">
      <div className="page-head pos-head">
        <h1>لوحة الكاشير</h1>
        <div className="pos-meta">
          <span>{profile.businessName || "نشاطي"}</span>
          <span className="pos-count">{items.length} بند</span>
        </div>
      </div>

      <div className="pos-client">
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="اسم العميل (اختياري)"
        />
        <input
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="الجوال"
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
              <p className="hint">لا توجد أصناف. أضفها من صفحة الأصناف.</p>
            )}
            {visibleCatalog.map((c) => (
              <button
                type="button"
                key={c.id}
                className="menu-card"
                onClick={() => addToBasket(c)}
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
        </section>

        {/* ====== الأسفل: السلة ====== */}
        <section className="pos-basket">
          <div className="pos-cat-head">
            <h2>السلة</h2>
            <button className="link" type="button" onClick={clearAll}>
              مسح الكل
            </button>
          </div>
          <div className="pos-basket-list">
            {items.length === 0 && (
              <p className="hint">السلة فارغة — اختر صنفاً من القائمة.</p>
            )}
            {items.map((it, idx) => (
              <div className="basket-row" key={idx}>
                <div className="basket-main">
                  <div className="basket-thumb">
                    {it.image ? (
                      <img src={it.image} alt={it.desc} className="menu-thumb" />
                    ) : (
                      <div className="menu-thumb menu-thumb-empty">—</div>
                    )}
                  </div>
                  <div className="basket-desc">
                    <span className="basket-name">{it.desc}</span>
                    <div className="basket-qty">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => addQty(idx, -1)}
                      >
                        -
                      </button>
                      <strong>{it.qty}</strong>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => addQty(idx, 1)}
                      >
                        +
                      </button>
                      <span className="basket-unit-price">
                        × {formatCurrency(it.price)}
                      </span>
                    </div>
                  </div>
                  <div className="basket-total">
                    <strong>{formatCurrency(itemTotal(it))}</strong>
                  </div>
                  <div className="basket-actions">
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
                  {getCustomerOptions(businessType).map((o) => {
                    const on = (it.extras || []).some((x) => x.name === o.name)
                    return (
                      <button
                        type="button"
                        key={o.name}
                        className={on ? "opt-chip on" : "opt-chip"}
                        onClick={() => toggleOption(idx, o.name, o.price, businessType)}
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

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            className="pos-note"
          />

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
              disabled={saving || items.length === 0}
              onClick={checkout}
            >
              {saving ? "جارٍ الحفظ…" : "إتمام الفاتورة وحفظها"}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
