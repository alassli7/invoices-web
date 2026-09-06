import { useEffect, useState } from "react"
import { formatCurrency, parseNum } from "../lib/format.js"
import { listCatalogByBusiness } from "../lib/storage.js"

// Function to read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Client catalog component for viewing services without login
export default function ClientCatalog({ businessId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!businessId) {
      setError("معرف النشاط غير موجود")
      setLoading(false)
      return
    }
    loadCatalog()
  }, [businessId])

  const loadCatalog = async () => {
    setLoading(true)
    setError("")
    try {
      const catalog = await listCatalogByBusiness(businessId)
      setItems(catalog)
      setLoading(false)
    } catch (e) {
      setError("تعذّرت تحميل الأصناف")
      setLoading(false)
    }
  }

  // Get type label in Arabic
  const getTypeLabel = (type) => {
    const labels = {
      restaurant: "مطعم",
      food: "مأكولات",
      service: "خدمات الكمبيوتر",
      app: "تطبيق",
      super_brand: "سوبر ماركت",
      paint_shop: "محل اصباغ"
    }
    return labels[type] || "خدمة"
  }

  // Get CSS class for type styling
  const getTypeClass = (type) => {
    const classes = {
      restaurant: "restaurant-type",
      food: "food-type",
      service: "service-type",
      app: "app-type",
      super_brand: "super-brand-type",
      paint_shop: "paint-shop-type"
    }
    return classes[type] || "service-type"
  }

  // Auto-detect type from description
  const inferCatalogType = (desc) => {
    const d = (desc || "").trim().toLowerCase()
    const foodKeywords = ["ك chop", "مايونيز", "ثومية", "صلصة", "بصل", "خس", "طماطم", "مخلل", "جبن", "بيضة", "بطاطس", "برجر", "بيتزا", "سندوتش", "كبه", "فرخة", "لحم", "سلطة", "مشويات"]
    if (foodKeywords.some(kw => d.includes(kw))) return "food"
    const serviceKeywords = ["برمجة", "تطبيقات", "مواقع", "حجز نطاق", "استضافة", "شبكة", "راوتر", "كاميرا", "سيرفر", "بيانات", "صيانة", "تعريب", "إعداد"]
    if (serviceKeywords.some(kw => d.includes(kw))) return "service"
    if (/app|برنامج|برمج/.test(d)) return "app"
    if (/سوبر|محل|تجزئة|بيع/.test(d)) return "super_brand"
    return "food"
  }

  return (
    <div className="client-catalog-page">
      <header className="client-catalog-header">
        <div className="container">
          <h1>كتالوج الخدمات</h1>
          <p className="client-catalog-subtitle">اكتشف خدماتنا المميزة</p>
        </div>
      </header>

      <main className="client-catalog-main">
        <div className="container">
          {loading && <div className="center-msg">جارٍ التحميل…</div>}

          {error && <div className="hint err">{error}</div>}

          {items.length === 0 ? (
            <div className="empty-state">
              <h3>لا توجد خدمات متاحة حالياً</h3>
              <p>يبدو أن النشاط لم يضافة خدمات بعد. يرجى التواصل مع owner النشاط.</p>
            </div>
          ) : (
            <div className="services-grid">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="service-card"
                  style={{
                    borderLeftColor: getTypeColor(it.type || "service")
                  }}
                >
                  <div className="service-thumb">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.desc}
                        className="service-image"
                      />
                    ) : (
                      <div className="service-placeholder">
                        {getTypeLabel(it.type || "service")}
                      </div>
                    )}
                  </div>
                  <div className="service-info">
                    <h3 className="service-name">{it.desc || "خدمة"} </h3>
                    <p className="service-price">
                      {formatCurrency(it.price)} لل Unidad
                    </p>
                  </div>
                  <div className="service-actions">
                    <a
                      href={`#/i/${it.id}`}
                      className="btn-details"
                      style={{ direction: "ltr" }}
                    >
                      تفاصيل الطلب
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="client-catalog-footer">
        <div className="container">
          <p>
           جميع الحقوق محفوظة © {new Date().getFullYear()}. تم تطوير الموقع من قبل <a href="#" style={{ color: "currentColor", textDecoration: "none" }}>فواتيري</a>
          </p>
          <div className="footer-links">
            <a href="#" style={{ marginRight: "1rem", color: "#666", textDecoration: "none" }}>الرئيسية</a>
            <a href="#" style={{ color: "#666", textDecoration: "none" }}>من نحن</a>
            <a href="#" style={{ color: "#666", textDecoration: "none" }}>اتصل بنا</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper to get color based on type
function getTypeColor(type) {
  const colors = {
    restaurant: "#e74c3c",
    food: "#27ae60",
    service: "#3498db",
    app: "#9b59b6",
    super_brand: "#f39c12",
    paint_shop: "#95a5a6"
  }
  return colors[type] || "#3498db"
}

// Export helper function
export async function getClientCatalog(businessId) {
  return listCatalogByBusiness(businessId)
}