import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ohwreqztjzkpgoihkvgb.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sjcUOeAVGeGMr4Urtz6NtQ_aWMA7_e7"
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

const STORAGE_BUCKET = "catalog-images"

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
  return DEMO
}

async function uploadImage(file) {
  try {
    const fileName = `${Date.now()}-${file.name}`
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, { cacheControl: "3600", upsert: false })
    if (error) throw error
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)
    return urlData.publicUrl
  } catch (e) {
    console.error("Upload failed:", e)
    return null
  }
}

async function saveCatalogItem(item) {
  const { data, error } = await supabase
    .from("catalog")
    .upsert(item)
  if (error) throw error
  return data
}

async function listCatalogItems(businessId) {
  const { data, error } = await supabase
    .from("catalog")
    .select("*")
    .eq("business_id", businessId)
    .order("createdAt", { ascending: false })
  if (error) throw error
  return data || []
}

export default function ClientCatalog({ businessId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ desc: "", price: "", qty: "1", type: "service", image: "" })
  const [imagePreview, setImagePreview] = useState("")

  useEffect(() => {
    if (!businessId) { setError("معرف النشاط غير موجود"); setLoading(false); return }
    listCatalogByBusiness(businessId)
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => { setError("تعذّر تحميل الأصناف"); setLoading(false) })
  }, [businessId])

  const types = ["all", ...new Set(items.map(i => i.type))]
  const visible = filter === "all" ? items : items.filter(i => i.type === filter)

  const openAddForm = () => {
    setEditingItem(null)
    setForm({ desc: "", price: "", qty: "1", type: "service", image: "" })
    setImagePreview("")
    setShowAddForm(true)
  }

  const openEditForm = (item) => {
    setEditingItem(item)
    setForm({ desc: item.desc || "", price: item.price || "", qty: item.qty || "1", type: item.type || "service", image: item.image || "" })
    setImagePreview(item.image || "")
    setShowAddForm(true)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    setUploading(false)
    if (url) {
      setForm({ ...form, image: url })
      setImagePreview(url)
    } else {
      // fallback: show local preview
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreview(ev.target.result)
        setForm({ ...form, image: ev.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.desc.trim()) return
    const item = {
      ...(editingItem || {}),
      desc: form.desc,
      price: parseFloat(form.price) || 0,
      qty: parseInt(form.qty) || 1,
      type: form.type,
      image: form.image,
      business_id: businessId,
    }
    try {
      if (editingItem) {
        const { error } = await supabase.from("catalog").upsert(item)
        if (error) throw error
        setItems(items.map(i => i.id === editingItem.id ? item : i))
      } else {
        const newItem = { ...item, id: Date.now().toString() }
        await saveCatalogItem(newItem)
        setItems([newItem, ...items])
      }
      setShowAddForm(false)
    } catch (err) {
      setError("فشل في حفظ الصنف")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا الصنف؟")) return
    try {
      await supabase.from("catalog").delete().eq("id", id)
      setItems(items.filter(i => i.id !== id))
    } catch {
      setItems(items.filter(i => i.id !== id))
    }
  }

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
        .cc-header-actions { display: flex; justify-content: flex-end; margin-top: 16px; }
        .cc-add-btn { padding: 10px 24px; background: var(--gold); color: var(--pine-deep); border: none; border-radius: 3px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .cc-add-btn:hover { background: #c99a2e; }

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
        .cc-card-thumb { height: 140px; background: var(--paper); display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--line-soft); position: relative; }
        .cc-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cc-card-placeholder { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #8a9285; font-size: 0.78rem; }
        .cc-card-placeholder-icon { font-size: 1.8rem; }
        .cc-card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .cc-card-name { font-weight: 600; font-size: 0.93rem; }
        .cc-card-price { font-size: 1rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--pine-deep); }
        .cc-type-chip { align-self: flex-start; font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--line); color: #6b7568; }
        .cc-card-cta { display: block; margin: 0 14px 14px; padding: 10px; text-align: center; background: var(--pine); color: var(--paper-white); border-radius: 3px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .cc-card-cta:hover { background: var(--pine-deep); }
        .cc-card-actions { display: flex; gap: 8px; padding: 0 14px 14px; }
        .cc-card-btn { flex: 1; padding: 8px; text-align: center; border-radius: 3px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; font-family: inherit; }
        .cc-card-edit { background: var(--gold); color: var(--pine-deep); }
        .cc-card-edit:hover { background: #c99a2e; }
        .cc-card-delete { background: var(--stamp); color: var(--paper-white); }
        .cc-card-delete:hover { background: #7e2f23; }

        /* upload area */
        .cc-upload-area { border: 2px dashed var(--line); border-radius: 8px; padding: 24px; text-align: center; cursor: pointer; transition: border-color 0.15s; margin-bottom: 16px; }
        .cc-upload-area:hover { border-color: var(--pine); }
        .cc-upload-area.dragover { border-color: var(--gold); background: rgba(185,138,52,0.06); }
        .cc-upload-area img { max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain; }
        .cc-upload-icon { font-size: 2rem; color: var(--pine); }
        .cc-upload-text { color: #5a6355; font-size: 0.88rem; margin-top: 8px; }
        .cc-upload-btn { padding: 8px 20px; background: var(--pine); color: var(--paper-white); border: none; border-radius: 3px; cursor: pointer; font-weight: 600; font-family: inherit; font-size: 0.85rem; margin-top: 10px; }
        .cc-upload-btn:hover { background: var(--pine-deep); }
        .cc-uploading { color: var(--stamp); font-size: 0.82rem; margin-top: 8px; }

        /* form */
        .cc-form-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .cc-form-modal { background: var(--paper-white); border-radius: 8px; padding: 28px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; direction: rtl; }
        .cc-form-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 20px; color: var(--pine-deep); }
        .cc-form-group { margin-bottom: 16px; }
        .cc-form-label { display: block; font-weight: 600; font-size: 0.88rem; margin-bottom: 6px; color: var(--ink); }
        .cc-form-input { width: 100%; padding: 10px 14px; border: 1px solid var(--line); border-radius: 3px; font-size: 0.9rem; font-family: inherit; direction: rtl; }
        .cc-form-input:focus { outline: none; border-color: var(--pine); }
        .cc-form-select { width: 100%; padding: 10px 14px; border: 1px solid var(--line); border-radius: 3px; font-size: 0.9rem; font-family: inherit; direction: rtl; background: var(--paper-white); }
        .cc-form-actions { display: flex; gap: 10px; margin-top: 20px; }
        .cc-form-submit { flex: 1; padding: 12px; background: var(--pine); color: var(--paper-white); border: none; border-radius: 3px; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit; }
        .cc-form-submit:hover { background: var(--pine-deep); }
        .cc-form-cancel { flex: 1; padding: 12px; background: transparent; border: 1px solid var(--line); border-radius: 3px; font-weight: 600; font-size: 0.9rem; cursor: pointer; font-family: inherit; color: var(--ink); }
        .cc-form-cancel:hover { background: var(--paper); }

        /* footer */
        .cc-footer { border-top: 1px solid var(--line-soft); padding: 28px; text-align: center; font-size: 0.82rem; color: #7a8172; }
        .cc-footer a { color: var(--pine); text-decoration: none; }
      `}</style>

      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-brand">فواتيري</div>
          <h1>كتالوج الخدمات</h1>
          <p>اكتشف خدماتنا المميزة وتواصل معنا للطلب</p>
          <div className="cc-header-actions">
            <button className="cc-add-btn" onClick={openAddForm}>➕ إضافة صنف جديد</button>
          </div>
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
                  <div className="cc-card-actions">
                    <button className="cc-card-edit" onClick={() => openEditForm(it)}>✏️ تعديل</button>
                    <button className="cc-card-delete" onClick={() => handleDelete(it.id)}>🗑️ حذف</button>
                  </div>
                  <a href={`#/i/${it.id}`} className="cc-card-cta">تفاصيل الطلب</a>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ─── Add/Edit Modal ─── */}
      {showAddForm && (
        <div className="cc-form-overlay" onClick={() => setShowAddForm(false)}>
          <div className="cc-form-modal" onClick={e => e.stopPropagation()}>
            <div className="cc-form-title">{editingItem ? "تعديل الصنف" : "إضافة صنف جديد"}</div>
            <form onSubmit={handleSubmit}>
              <div className="cc-form-group">
                <label className="cc-form-label">الوصف</label>
                <input className="cc-form-input" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} required />
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <div className="cc-form-group" style={{flex:1}}>
                  <label className="cc-form-label">السعر (ر.س)</label>
                  <input className="cc-form-input" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                </div>
                <div className="cc-form-group" style={{flex:1}}>
                  <label className="cc-form-label">الكمية</label>
                  <input className="cc-form-input" type="number" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} />
                </div>
              </div>
              <div className="cc-form-group">
                <label className="cc-form-label">النوع</label>
                <select className="cc-form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {Object.keys(TYPE_META).map(t => (
                    <option key={t} value={t}>{typeMeta(t).label}</option>
                  ))}
                </select>
              </div>
              <div className="cc-form-group">
                <label className="cc-form-label">صورة المنتج</label>
                <div className="cc-upload-area" onClick={() => fileInputRef.current?.click()}
                     onDragOver={e => e.currentTarget.classList.add('dragover')}
                     onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                     onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); if(e.dataTransfer.files?.[0]) handleImageChange({target:{files:e.dataTransfer.files}})}}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" />
                  ) : (
                    <>
                      <div className="cc-upload-icon">📷</div>
                      <div className="cc-upload-text">اضغط أو اسحب صورة هنا</div>
                      <button type="button" className="cc-upload-btn">اختر صورة</button>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                {uploading && <div className="cc-uploading">جاري الرفع…</div>}
                {imagePreview && !imagePreview.startsWith("http") && (
                  <div style={{marginTop:"8px",fontSize:"0.78rem",color:"#5a6355"}}>(معاينة محلية - سيُحفظ مع الصنف)</div>
                )}
              </div>
              <div className="cc-form-actions">
                <button type="submit" className="cc-form-submit">{editingItem ? "تحديث" : "إضافة"}</button>
                <button type="button" className="cc-form-cancel" onClick={() => setShowAddForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
