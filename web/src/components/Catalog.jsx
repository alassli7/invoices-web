import { useEffect, useState, useRef } from "react"
import {
  listCatalog,
  saveCatalogItem,
  deleteCatalogItem,
  seedDefaultCatalog,
  getCurrentBusinessId
} from "../lib/storage.js"
import { formatCurrency, parseNum, catalogTypes, catalogTypeLabel, inferCatalogType, isFoodItem, isServiceItem, isAppItem, isSuperBrandItem, isPaintShopItem } from "../lib/format.js"
import NumInput from "./NumInput.jsx"

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Catalog({ go, refresh }) {
  const [items, setItems] = useState([])
  const [desc, setDesc] = useState("")
  const [price, setPrice] = useState("")
  const [qty, setQty] = useState(1)
  const [type, setType] = useState("restaurant")
  const [image, setImage] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [seedBusy, setSeedBusy] = useState(false)
  const [seedMsg, setSeedMsg] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef(null)

  const load = () => listCatalog().then(setItems)

  useEffect(() => {
    load()
  }, [])

  const reset = () => {
    setDesc("")
    setPrice("")
    setQty(1)
    setType("restaurant")
    setImage("")
    setEditingId(null)
    setError("")
  }

  const edit = (it) => {
    setEditingId(it.id)
    setDesc(it.desc)
    setPrice(it.price)
    setQty(it.qty || 1)
    setType(it.type || inferCatalogType(it.desc))
    setImage(it.image || "")
    setError("")
  }

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataURL = await readFileAsDataURL(file)
      setImage(dataURL)
    } catch {
      setError("تعذّرت قراءة الصورة")
    }
    e.target.value = ""
  }

  const save = async () => {
    if (!desc.trim()) return
    setError("")
    try {
      await saveCatalogItem({
        id: editingId || undefined,
        desc: desc.trim(),
        price: parseNum(price),
        qty: parseNum(qty) || 1,
        type,
        image
      })
      reset()
      await load()
      refresh()
    } catch (e) {
      const msg = e.message || "حدث خطأ"
      if (msg.includes("image") && msg.includes("does not exist")) {
        setError(
          `حفظ الصور يتطلّب إضافة عمود image إلى جدول catalog. نفّذ في محرر SQL الخاص بـ Supabase:  ALTER TABLE catalog ADD COLUMN IF NOT EXISTS image text;  ثم أعد المحاولة.`
        )
      } else {
        setError(msg)
      }
    }
  }

  const remove = async (id) => {
    if (!confirm("حذف الصنف؟")) return
    await deleteCatalogItem(id)
    await load()
    refresh()
  }

  const seed = async () => {
    setSeedBusy(true)
    setSeedMsg("")
    try {
      const n = await seedDefaultCatalog(getCurrentBusinessId())
      setSeedMsg(
        n > 0 ? `أُضيف ${n} صنفاً جاهزاً. عدّل الأسعار ثم احفظ ما يناسبك.` : "الأصناف الجاهزة موجودة بالفعل."
      )
      await load()
      refresh()
    } catch (e) {
      setSeedMsg(e.message || "حدث خطأ")
    }
    setSeedBusy(false)
  }

  return (
    <div>
      <div className="page-head">
        <h1>كتالوج المأكولات والخدمات</h1>
        <button className="ghost" onClick={seed} disabled={seedBusy}>
          {seedBusy ? "جارٍ التعبئة…" : "أضف الأصناف الجاهزة"}
        </button>
      </div>
      {seedMsg && <div className="hint">{seedMsg}</div>}
      {error && <div className="hint err">{error}</div>}

      <fieldset className="box">
        <legend>{editingId ? "تعديل صنف" : "صنف جديد"}</legend>
        {image && (
          <div className="item-image-big">
            <img src={image} alt="الصنف" />
          </div>
        )}
        <label>
          الوصف
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="اسم الصنف / الخدمة / الأكلة" />
        </label>
        <div className="form-grid">
          <label>
            السعر (ريال)
            <input type="text" inputMode="decimal" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            الكمية الافتراضية
            <input type="text" inputMode="decimal" dir="ltr" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
        </div>
        <label className="file-row">
          صورة الصنف (اختياري)
          <div className="file-controls">
            <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
              {image ? "تغيير الصورة" : "اختيار صورة"}
            </button>
            {image && (
              <button type="button" className="ghost" onClick={() => setImage("")}>
                إزالة
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onPickImage}
            />
          </div>
        </label>
        <div className="head-actions">
          <button className="ghost" onClick={reset}>
            إلغاء
          </button>
          <button className="primary" onClick={save}>
            {editingId ? "حفظ التعديل" : "حفظ الصنف"}
          </button>
        </div>
      </fieldset>

      {items.length === 0 ? (
        <div className="empty">لا توجد أصناف محفوظة بعد. أضف صنفاً لاستخدامه لاحقاً في الفواتير.</div>
      ) : (
        <div className="menu-grid">
          {items.map((it) => (
            <div className="menu-card" key={it.id}>
              <div className="menu-thumb">
                {it.image ? (
                  <img src={it.image} alt={it.desc} />
                ) : (
                  <span className="menu-placeholder">لا صورة</span>
                )}
              </div>
              <div className="menu-info">
                <div className="menu-name">{it.desc}</div>
                <div className="menu-price">{formatCurrency(it.price)}</div>
                <div className="menu-actions">
                  <button className="ghost" onClick={() => edit(it)}>
                    صوره/تعديل
                  </button>
                  <button className="danger" onClick={() => remove(it.id)}>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
