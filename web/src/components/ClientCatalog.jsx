import { useEffect, useState } from "react"

// ── inline helpers (replaces ../lib/format.js + ../lib/storage.js) ──

const formatCurrency = (n) =>
  (parseFloat(n) || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س"

const TYPE_META = {
  restaurant:  { label: "مطعم",              color: "#1f4d3a" },
  food:        { label: "مأكولات",            color: "#2d6a4f" },
  service:     { label: "خدمات الكمبيوتر",   color: "#1f4d3a" },
  app:         { label: "تطبيق",              color: "#5c4a8a" },
  super_brand: { label: "سوبر ماركت",        color: "#9c3b29" },
  paint_shop:  { label: "محل أصباغ",         color: "#7a6318" },
}
const typeMeta = (t) => TYPE_META[t] || TYPE_META.service

// ── demo data (replaces listCatalogByBusiness) ──
const DEMO = [
  { id: "1", desc: "برمجة موقع إلكتروني",      price: 3500, qty: 1, type: "service",    image: "" },
  { id: "2", desc: "تطبيق جوال (iOS + Android)",price: 8000, qty: 1, type: "app",        image: "" },
  { id: "3", desc: "صيانة شبكة داخلية",         price: 350,  qty: 1, type: "service",    image: "" },
  { id: "4", desc: "استضافة سنوية + نطاق",      price: 800,  qty: 1, type: "service",    image: "" },
  { id: "5", desc: "برجر كلاسيك",               price: 28,   qty: 1, type: "restaurant", image: "" },
  { id: "6", desc: "بيتزا مارغريتا وسط",        price: 38,   qty: 1, type: "restaurant", image: "" },
]

async function listCatalogByBusiness(businessId) {
  // real implementation calls Supabase; here returns demo data
  return DEMO
}

export default function ClientCatalog({ businessId }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")
  const [filter,  setFilter]  = useState("all")

  useEffect(() => {
    if (!businessId) { setError("معرف النشاط غير موجود"); setLoading(false); return }
    listCatalogByBusiness(businessId)
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => { setError("تعذّر تحميل الأصناف"); setLoading(false) })
  }, [businessId])

  const types = ["all", ...new Set(items.map(i => i.type))]
  const visible = filter === "all" ? items : items.filter(i => i.type === filter)

  return (
    <div className="cc-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@700&display=swap');

        .cc-root {
          --ink: #1b2a20; --paper: #eef0e5; --paper-white: #f9f9f2;
          --pine: #1f4d3a; --pine-deep: #163527;
          --stamp: #9c3b29; --gold: #b98a34;
          --line: #cdc9b2; --line-soft: #dedbc7;
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background: var(--paper); color: var(--ink);
          direction: rtl; line-height: 1.6; min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .cc-root * { box-sizing: border-box; }

        /* header */
        .cc-header { background: var(--pine-deep); color: var(--paper-white); padding: 36px 28px 32px; }
        .cc-header-inner { max-width: 1000px; margin: 0 auto; }
        .cc-brand { font-family: 'Aref Ruqaa', serif; font-size: 1.3rem; font-weight: 700; color: var(--gold); margin-bottom: 16px; }
        .cc-header h1 { margin: 0 0 6px; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; }
        .cc-header p  { margin: 0; color: rgba(249,249,242,0.7); font-size: 0.95rem; }

        /* filter bar */
        .cc-filters { background: var(--paper-white); border-bottom: 1px solid var(--line-soft); padding: 14px 28px; overflow-x: auto; }
        .cc-filters-inner { max-width: 1000px; margin: 0 auto; display: flex; gap: 8px; }
        .cc-filter-btn { padding: 7px 16px; border-radius: 999px; border: 1px solid var(--line); background: transparent; font-size: 0.82rem; font-weight: 600; color: var(--ink); cursor: pointer; white-space: nowrap; transition: border-color 0.15s, background 0.15s, color 0.15s; font-family: inherit; }
        .cc-filter-btn:hover { border-color: var(--pine); color: var(--pine-deep); }
        .cc-filter-btn.active { background: var(--pine); color: var(--paper-white); border-color: var(--pine); }

        /* main */
        .cc-main { max-width: 1000px; margin: 0 auto; padding: 28px; }
        .cc-msg { text-align: center; color: #5a6355; padding: 48px 0; font-size: 0.95rem; }
        .cc-err { padding: 12px 16px; background: rgba(156,59,41,0.08); color: var(--stamp); border-radius: 3px; margin-bottom: 16px; font-size: 0.88rem; }

        /* grid */
        .cc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; }
        .cc-card { background: var(--paper-white); border: 1px solid var(--line-soft); border-radius: 3px; overflow: hidden; display: flex; flex-direction: column; }
        .cc-card-accent { height: 4px; }
        .cc-card-thumb { height: 140px; background: var(--paper); display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--line-soft); }
        .cc-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cc-card-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #8a9285; font-size: 0.78rem; }
        .cc-card-placeholder-icon { font-size: 1.8rem; }
        .cc-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .cc-card-name { font-weight: 600; font-size: 0.93rem; }
        .cc-card-price { font-size: 1rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--pine-deep); }
        .cc-type-chip { align-self: flex-start; font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: #6b7568; }
        .cc-card-cta { display: block; margin: 0 14px 14px; padding: 10px; text-align: center; background: var(--pine); color: var(--paper-white); border-radius: 3px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .cc-card-cta:hover { background: var(--pine-deep); }

        /* footer */
        .cc-footer { border-top: 1px solid var(--line-soft); padding: 28px; text-align: center; font-size: 0.82rem; color: #7a8172; }
        .cc-footer a { color: var(--pine); text-decoration: none; }
      `}</style>

      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-brand">فواتيري</div>
          <h1>كتالوج الخدمات</h1>
          <p>اكتشف خدماتنا المميزة وتواصل معنا للطلب</p>
        </div>
      </header>

      {/* ─── type filters ─── */}
      {!loading && !error && items.length > 0 && (
        <div className="cc-filters">
          <div className="cc-filters-inner">
            {types.map(t => (
              <button
                key={t}
                className={`cc-filter-btn${filter === t ? " active" : ""}`}
                onClick={() => setFilter(t)}
              >
                {t === "all" ? "الكل" : typeMeta(t).label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="cc-main">
        {loading && <p className="cc-msg">جارٍ التحميل…</p>}
        {error   && <div className="cc-err">{error}</div>}

        {!loading && !error && visible.length === 0 && (
          <p className="cc-msg">لا توجد خدمات متاحة حالياً. يرجى التواصل مع صاحب النشاط.</p>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="cc-grid">
            {visible.map(it => {
              const meta = typeMeta(it.type)
              return (
                <div className="cc-card" key={it.id}>
                  <div className="cc-card-accent" style={{ background: meta.color }} />
                  <div className="cc-card-thumb">
                    {it.image ? (
                      <img src={it.image} alt={it.desc} />
                    ) : (
                      <div className="cc-card-placeholder">
                        <span className="cc-card-placeholder-icon">📦</span>
                        <span>{meta.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="cc-card-body">
                    <div className="cc-card-name">{it.desc}</div>
                    <div className="cc-card-price">{formatCurrency(it.price)}</div>
                    <span className="cc-type-chip">{meta.label}</span>
                  </div>
                  <a href={`#/i/${it.id}`} className="cc-card-cta">تفاصيل الطلب</a>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="cc-footer">
        جميع الحقوق محفوظة © {new Date().getFullYear()} ·{" "}
        <a href="#">فواتيري</a>
      </footer>
    </div>
  )
}

export async function getClientCatalog(businessId) {
  return listCatalogByBusiness(businessId)
}
