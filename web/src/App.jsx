import { useCallback, useEffect, useMemo, useState } from "react"
import Dashboard from "./components/Dashboard.jsx"
import InvoiceForm from "./components/InvoiceForm.jsx"
import InvoiceView from "./components/InvoiceView.jsx"
import ReceiptView from "./components/ReceiptView.jsx"
import Settings from "./components/Settings.jsx"
import ClientCatalog from "./components/ClientCatalog.jsx"
import Catalog from "./components/Catalog.jsx"
import AdminMonitor from "./components/AdminMonitor.jsx"
import Auth from "./components/Auth.jsx"
import PosCashier from "./components/PosCashier.jsx"
import LandingPage from "./components/LandingPage.jsx"
import PricingPage from "./components/PricingPage.jsx"
import {
  getInvoiceView,
  getCurrentBusinessId,
  logoutBusiness,
  getProfile
} from "./lib/storage.js"

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "")
  const parts = hash.split("/").filter(Boolean)

  if (parts[0] === "i" && parts[1]) return { view: "invoice", id: parts[1] }
  if (parts[0] === "r" && parts[1]) return { view: "receipt", id: parts[1] }
  if (parts[0] === "login") return { view: "auth", tab: "login" }
  if (parts[0] === "pricing") return { view: "pricing" }
  if (parts[0] === "new" && parts[1] === "register") return { view: "auth", tab: "register" }
  if (parts[0] === "new") return { view: "pricing" }
  if (parts[0] === "edit" && parts[1]) return { view: "form", id: parts[1] }
  if (parts[0] === "catalog") return { view: "catalog" }
  if (parts[0] === "client-catalog" && parts[1]) {
    return { view: "client-catalog", businessId: parts[1] }
  }
  if (parts[0] === "pos") return { view: "pos" }
  if (parts[0] === "admin") return { view: "admin" }
  if (parts[0] === "settings") return { view: "settings" }

  return { view: "dashboard" }
}

function decodeEmbedded() {
  const match = window.location.hash.match(/[?&]d=([^&]+)/)
  if (!match) return null

  try {
    return JSON.parse(decodeURIComponent(escape(atob(match[1]))))
  } catch {
    return null
  }
}

const POS_ENABLED_CATEGORIES = new Set([
  "cafeteria",
  "restaurant",
  "supermarket",
  "paint_shop"
])

export default function App() {
  const [route, setRoute] = useState(() => parseHash())
  const [tick, setTick] = useState(0)

  const [publicData, setPublicData] = useState(null)
  const [loadingPublic, setLoadingPublic] = useState(false)

  const [sessionId, setSessionId] = useState(() => getCurrentBusinessId())
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const go = useCallback((path) => {
    setMenuOpen(false)
    window.location.hash = path
  }, [])

  const refresh = useCallback(() => {
    setTick((value) => value + 1)
  }, [])

  const logout = useCallback(() => {
    logoutBusiness()
    setSessionId(null)
    setProfile(null)
    setPublicData(null)
    setMenuOpen(false)
    window.location.hash = "/"
  }, [])

  const loadProfile = useCallback(async () => {
    if (!sessionId) {
      setProfile(null)
      return
    }

    const data = await getProfile()
    setProfile(data || null)
  }, [sessionId])

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash())
      setMenuOpen(false)
    }

    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile, tick])

  useEffect(() => {
    const isPublicInvoicePage =
      route.view === "invoice" || route.view === "receipt" || route.view === "pay"

    if (!isPublicInvoicePage || !route.id) {
      setPublicData(null)
      setLoadingPublic(false)
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        setLoadingPublic(true)
        const data = await getInvoiceView(route.id, decodeEmbedded())
        if (!cancelled) {
          setPublicData(data || null)
        }
      } finally {
        if (!cancelled) {
          setLoadingPublic(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [route])

  const bizName = profile?.businessName || ""
  const isAdmin = Boolean(profile?.isAdmin)
  const bizCategory = profile?.businessCategory || "service"
  const userRole = profile?.role || "owner"

  const canUsePos = useMemo(() => {
    return POS_ENABLED_CATEGORIES.has(bizCategory)
  }, [bizCategory])

  const isOwner = userRole === "owner"
  const isStaff = userRole === "staff"

  const pageTitle =
    route.view === "dashboard" ? "الحسابات" :
    route.view === "form" ? (route.id ? "تعديل فاتورة" : "فاتورة جديدة") :
    route.view === "catalog" ? "الأصناف" :
    route.view === "pos" ? "لوحة الكاشير" :
    route.view === "admin" ? "مراقبة الحسابات" :
    route.view === "settings" ? "إعدادات النشاط" :
    "فواتيري"

  if (route.view === "invoice") {
    if (loadingPublic) return <div className="fa-center-msg">جارٍ التحميل…</div>
    if (!publicData?.invoice) return <div className="fa-center-msg">الفاتورة غير موجودة</div>

    return (
      <InvoiceView
        invoice={publicData.invoice}
        profile={publicData.profile}
        standalone
      />
    )
  }

  if (route.view === "receipt") {
    if (loadingPublic) return <div className="fa-center-msg">جارٍ التحميل…</div>
    if (!publicData?.invoice) return <div className="fa-center-msg">الفاتورة غير موجودة</div>

    return (
      <ReceiptView
        invoice={publicData.invoice}
        profile={publicData.profile}
        standalone
      />
    )
  }

  if (route.view === "client-catalog") {
    if (!route.businessId) {
      return (
        <div className="client-catalog-root" dir="rtl">
          <div className="fa-center-msg">معرف النشاط غير موجود</div>
        </div>
      )
    }

    return (
      <div className="client-catalog-root" dir="rtl">
        <ClientCatalog businessId={route.businessId} />
      </div>
    )
  }

  if (route.view === "pricing") {
    return (
      <PricingPage
        onBack={() => go("/")}
        onGetStarted={() => go("/new/register")}
        onLogin={() => go("/login")}
      />
    )
  }

  if (!sessionId && (route.view === "auth" || route.view === "dashboard")) {
    if (route.view === "dashboard") {
      return (
        <LandingPage
          onGetStarted={() => go("/new")}
          onLogin={() => go("/login")}
          onPricing={() => go("/pricing")}
        />
      )
    }
    return (
      <Auth
        initialTab={route.tab || "login"}
        onAuth={() => {
          setSessionId(getCurrentBusinessId())
          setRoute(parseHash())
        }}
      />
    )
  }

  return (
    <div className="fa-app-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .fa-app-root {
          --ink: #1b2a20;
          --paper: #eef0e5;
          --paper-white: #f9f9f2;
          --pine: #1f4d3a;
          --pine-deep: #163527;
          --stamp: #9c3b29;
          --gold: #b98a34;
          --line: #cdc9b2;
          --line-soft: #dedbc7;
          --sidebar: #f6f7f0;
          --sidebar-active: #e1e8de;
          --danger: #b42318;

          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .fa-app-root * { box-sizing: border-box; }

        .fa-center-msg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--paper);
          color: var(--pine-deep);
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          font-size: 1rem;
        }

        .fa-shell {
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);

  overflow-x: hidden;
  box-sizing: border-box;
}

        @media (max-width: 960px) {
          .fa-shell {
            grid-template-columns: 1fr;
          }
        }

        .fa-sidebar {
  direction: rtl;
          background: var(--sidebar);
          border-inline-start: 1px solid var(--line);
          border-inline-end: 1px solid var(--line);
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        @media (max-width: 960px) {
  .fa-sidebar {
    position: fixed;

    top: 0;
    right: 0;
    bottom: 0;
    left: auto;

    width: min(290px, 86vw);
    max-width: 86vw;

    height: 100dvh;
    min-height: 100vh;

    transform: translateX(100%);
    transition: transform .22s ease;

    z-index: 1000;

    overflow-x: hidden;
    overflow-y: auto;

    box-sizing: border-box;

    -webkit-overflow-scrolling: touch;

    box-shadow: -12px 0 32px rgba(0, 0, 0, .16);
  }

  .fa-sidebar.open {
    transform: translateX(0);
  }
}

        .fa-brand {
          font-family: 'Aref Ruqaa', serif;
          font-weight: 700;
          font-size: 1.9rem;
          color: var(--pine-deep);
          text-align: center;
          padding-bottom: 10px;
          border-bottom: 1px dashed var(--line);
        }

        .fa-biz-box {
          background: var(--paper-white);
          border: 1px solid var(--line);
          border-radius: 3px;
          padding: 12px 14px;
          text-align: center;
        }

        .fa-biz-name {
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .fa-biz-role {
          font-size: .78rem;
          color: #6b7568;
        }

        .fa-nav {
          display: grid;
          gap: 8px;
        }

        .fa-nav button {
          width: 100%;
          text-align: right;
          background: transparent;
          color: var(--ink);
          border: 1px solid transparent;
          border-radius: 3px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }

        .fa-nav button:hover {
          background: #eef2eb;
          border-color: var(--line-soft);
        }

        .fa-nav button.active {
          background: var(--sidebar-active);
          border-color: var(--line);
          color: var(--pine-deep);
        }

        .fa-sidebar-footer {
          margin-top: auto;
        }

        .fa-logout-btn {
          width: 100%;
          background: transparent;
          color: var(--danger);
          border: 1px solid #efc3bf;
          border-radius: 3px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s ease;
        }

        .fa-logout-btn:hover {
          background: #fff1f1;
        }

        .fa-main {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding: 28px;
  box-sizing: border-box;
  overflow-x: hidden;
}

        @media (max-width: 960px) {
          .fa-main {
            padding: 18px;
          }
        }

        .fa-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 22px;
          background: var(--paper-white);
          border: 1px solid var(--line);
          border-radius: 3px;
          padding: 14px 16px;
          box-shadow: 0 10px 25px -24px rgba(22, 53, 39, 0.35);
        }

        .fa-topbar-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fa-topbar-title strong {
          font-size: 1.08rem;
          color: var(--pine-deep);
        }

        .fa-topbar-title span {
          font-size: .84rem;
          color: #6b7568;
        }

        .fa-menu-btn {
          display: none;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--pine-deep);
          border-radius: 3px;
          padding: 10px 12px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 960px) {
          .fa-menu-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
        }

        .fa-content-card {
          background: transparent;
          min-width: 0;
        }

        .fa-overlay {
  display: none;
}

@media (max-width: 960px) {
  .fa-overlay {
    display: block;
    position: fixed;
    inset: 0;

    background: rgba(27, 42, 32, .35);

    z-index: 50;
  }
}

/* MOBILE RESPONSIVE FINAL FIX */

@media (max-width: 960px) {

  .fa-shell {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .fa-main {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 16px;
    margin: 0;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .fa-content-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .fa-sidebar {
    direction: rtl;
  }

  .fa-overlay {
    z-index: 900;
  }

  /* منع العناصر الكبيرة من كسر الشاشة */

  img,
  video,
  canvas,
  svg,
  iframe {
    max-width: 100%;
  }

  input,
  textarea,
  select,
  button {
    max-width: 100%;
    box-sizing: border-box;
  }

  /* الجداول */

  table {
    max-width: 100%;
  }

  .table-container,
  .table-wrapper,
  .table-scroll,
  .overflow-table {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* النماذج */

  form {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  /* البطاقات */

  .card,
  .panel,
  .section,
  .form-card,
  .invoice-card {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  /* أزرار */

  button,
  .btn,
  .button {
    touch-action: manipulation;
  }

  /* النصوص الطويلة */

  h1,
  h2,
  h3,
  h4,
  p,
  span,
  label,
  td,
  th {
    overflow-wrap: anywhere;
  }
}

/* =======================================================
   iPhone / Small phones
   ======================================================= */

@media (max-width: 600px) {

  .fa-main {
    padding: 12px;
  }

  .fa-content-card {
    border-radius: 14px;
  }

  .fa-sidebar {
    width: min(290px, 88vw);
    max-width: 88vw;
  }

  h1 {
    font-size: clamp(22px, 7vw, 30px);
  }

  h2 {
    font-size: clamp(20px, 6vw, 26px);
  }

  h3 {
    font-size: clamp(17px, 5vw, 21px);
  }

  input,
  select,
  textarea {
    font-size: 16px !important;
  }

  button,
  .btn,
  .button {
    min-height: 44px;
  }

  /* الأعمدة تتحول إلى عمود واحد */

  .form-grid,
  .fields-grid,
  .invoice-grid,
  .dashboard-grid,
  .stats-grid {
    grid-template-columns: 1fr !important;
  }

  /* مجموعات الأزرار */

  .actions,
  .form-actions,
  .toolbar,
  .button-row {
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .actions > button,
  .form-actions > button,
  .toolbar > button,
  .button-row > button {
    max-width: 100%;
  }

  /* الصور */

  img {
    height: auto;
  }
}

/* =======================================================
   Very small phones
   ======================================================= */

@media (max-width: 380px) {

  .fa-main {
    padding: 8px;
  }

  .fa-sidebar {
    width: 92vw;
    max-width: 92vw;
  }

  .fa-content-card {
    border-radius: 10px;
  }

  button,
  .btn,
  .button {
    width: 100%;
  }
}
      `}</style>

      <div className="fa-shell">
        {menuOpen && <div className="fa-overlay" onClick={() => setMenuOpen(false)} />}

        <aside className={`fa-sidebar ${menuOpen ? "open" : ""}`}>
          <div className="fa-brand">فواتيري</div>

          <div className="fa-biz-box">
            <div className="fa-biz-name">{bizName || "نشاطي"}</div>
            <div className="fa-biz-role">
              {isStaff ? "موظف" : isAdmin ? "مالك / مسؤول" : "مالك النشاط"}
            </div>
          </div>

          <nav className="fa-nav">
            <button
              className={route.view === "dashboard" ? "active" : ""}
              onClick={() => go("/")}
            >
              الحسابات
            </button>

            <button
              className={route.view === "form" && !route.id ? "active" : ""}
              onClick={() => go("/new")}
            >
              فاتورة جديدة
            </button>

            {isOwner ? (
              <button
                className={route.view === "catalog" ? "active" : ""}
                onClick={() => go("/catalog")}
              >
                الأصناف
              </button>
            ) : null}

            {canUsePos ? (
              <button
                className={route.view === "pos" ? "active" : ""}
                onClick={() => go("/pos")}
              >
                لوحة الكاشير
              </button>
            ) : null}

            {isAdmin && isOwner ? (
              <button
                className={route.view === "admin" ? "active" : ""}
                onClick={() => go("/admin")}
              >
                مراقبة الحسابات
              </button>
            ) : null}

            {isOwner ? (
              <button
                className={route.view === "settings" ? "active" : ""}
                onClick={() => go("/settings")}
              >
                إعدادات النشاط
              </button>
            ) : null}
          </nav>

          <div className="fa-sidebar-footer">
            <button className="fa-logout-btn" onClick={logout}>
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <main className="fa-main">
          <div className="fa-topbar">
            <div className="fa-topbar-title">
              <strong>{pageTitle}</strong>
              <span>{bizName || "إدارة نشاطك في مكان واحد"}</span>
            </div>

            <button className="fa-menu-btn" onClick={() => setMenuOpen(true)}>
              ☰ القائمة
            </button>
          </div>

          <div className="fa-content-card">
            {route.view === "dashboard" && (
              <Dashboard key={tick} go={go} refresh={refresh} />
            )}

            {route.view === "form" && (
              <InvoiceForm
                key={route.id || "new"}
                id={route.id}
                go={go}
                refresh={refresh}
              />
            )}

            {route.view === "catalog" && <Catalog go={go} refresh={refresh} />}

            {route.view === "pos" && <PosCashier go={go} />}

            {route.view === "admin" && <AdminMonitor go={go} />}

            {route.view === "settings" && (
              <Settings go={go} refresh={refresh} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}