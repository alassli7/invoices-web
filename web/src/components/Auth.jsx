import { useState } from "react"
import { loginBusiness, registerBusiness } from "../lib/storage.js"
import { validateDoc } from "../lib/format.js"

export default function Auth({ onAuth }) {
  const [tab, setTab] = useState("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [docType, setDocType] = useState("freelance")
  const [docNumber, setDocNumber] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const docCheck = validateDoc(docType, docNumber)

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    if (!username.trim() || !password) {
      setError("أدخل اسم المستخدم وكلمة المرور")
      return
    }
    setBusy(true)
    try {
      if (tab === "login") {
        const ok = await loginBusiness(username.trim(), password)
        if (!ok) {
          setError("بيانات الدخول غير صحيحة")
          setBusy(false)
          return
        }
      } else {
        if (password.length < 4) {
          setError("كلمة المرور يجب ألا تقل عن 4 أحرف")
          setBusy(false)
          return
        }
        if (!docCheck.valid) {
          setError("رقم الوثيقة غير صحيح: " + docCheck.message)
          setBusy(false)
          return
        }
        await registerBusiness({
          username: username.trim(),
          password,
          businessName,
          docType,
          docNumber,
          isAdmin
        })
      }
      onAuth()
    } catch (err) {
      setError(err.message || "حدث خطأ")
      setBusy(false)
    }
  }

  return (
    <div className="fa-auth-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .fa-auth-root {
          --ink: #1b2a20;
          --paper: #eef0e5;
          --paper-white: #f9f9f2;
          --pine: #1f4d3a;
          --pine-deep: #163527;
          --stamp: #9c3b29;
          --gold: #b98a34;
          --line: #cdc9b2;
          --line-soft: #dedbc7;
          --danger: #b42318;
          --danger-bg: #fff1f1;
          --ok: #1f6b3b;
          --ok-bg: #edf7ee;

          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(185,138,52,.08), transparent 22%),
            radial-gradient(circle at bottom left, rgba(31,77,58,.08), transparent 24%),
            var(--paper);
          color: var(--ink);
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .fa-auth-root * { box-sizing: border-box; }

        .fa-auth-shell {
          width: 100%;
          max-width: 1080px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 34px;
          align-items: center;
        }

        @media (max-width: 920px) {
          .fa-auth-shell {
            grid-template-columns: 1fr;
            max-width: 560px;
          }
        }

        .fa-auth-side {
          padding: 8px 10px;
        }

        @media (max-width: 920px) {
          .fa-auth-side { display: none; }
        }

        .fa-auth-brand-mark {
          font-family: 'Aref Ruqaa', serif;
          font-weight: 700;
          font-size: 2rem;
          color: var(--pine-deep);
          margin-bottom: 18px;
        }

        .fa-auth-side h1 {
          margin: 0 0 14px;
          font-size: clamp(2rem, 4vw, 2.7rem);
          line-height: 1.28;
          font-weight: 700;
          max-width: 12ch;
        }

        .fa-auth-side p {
          margin: 0 0 22px;
          color: #465247;
          font-size: 1.03rem;
          max-width: 42ch;
        }

        .fa-auth-points {
          display: grid;
          gap: 10px;
        }

        .fa-auth-point {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(249,249,242,0.7);
          border: 1px solid var(--line);
          border-radius: 3px;
          font-size: 0.94rem;
        }

        .fa-auth-point i {
          font-style: normal;
          color: var(--gold);
          font-weight: 700;
        }

        .fa-auth-card-wrap {
          position: relative;
        }

        .fa-auth-stamp {
          position: absolute;
          top: -18px;
          left: -18px;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 2.5px solid var(--stamp);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--stamp);
          font-family: 'Aref Ruqaa', serif;
          font-weight: 700;
          font-size: 0.9rem;
          line-height: 1.1;
          transform: rotate(-14deg);
          background: rgba(249,249,242,0.92);
          z-index: 2;
        }

        .fa-auth-stamp::before {
          content: "";
          position: absolute;
          inset: 6px;
          border: 1px solid var(--stamp);
          border-radius: 50%;
          opacity: 0.55;
        }

        .fa-auth-card {
          background: var(--paper-white);
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 26px;
          box-shadow: 0 18px 40px -24px rgba(22, 53, 39, 0.35);
          position: relative;
        }

        .fa-auth-card::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -10px;
          height: 20px;
          background:
            radial-gradient(circle 6px at 6px 0, transparent 6px, var(--paper) 6.5px) repeat-x,
            transparent;
          background-size: 24px 20px;
          background-position: top center;
        }

        .fa-auth-head {
          margin-bottom: 18px;
        }

        .fa-auth-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--pine-deep);
          background: #e2e8dd;
          padding: 4px 10px;
          border-radius: 2px;
          margin-bottom: 10px;
        }

        .fa-auth-title {
          margin: 0 0 6px;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .fa-auth-sub {
          margin: 0;
          color: #5a6355;
          font-size: 0.95rem;
        }

        .fa-auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 18px;
        }

        .fa-auth-tab {
          border: 1px solid var(--line);
          background: transparent;
          color: var(--pine-deep);
          padding: 11px 14px;
          border-radius: 3px;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease, color .15s ease;
        }

        .fa-auth-tab:hover {
          background: #f4f5ef;
        }

        .fa-auth-tab.active {
          background: var(--pine);
          color: var(--paper-white);
          border-color: var(--pine);
        }

        .fa-auth-form {
          display: grid;
          gap: 14px;
        }

        .fa-auth-field {
          display: grid;
          gap: 6px;
        }

        .fa-auth-label {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--ink);
        }

        .fa-auth-input,
        .fa-auth-select {
          width: 100%;
          border: 1px solid var(--line);
          background: #fff;
          color: var(--ink);
          border-radius: 3px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background .15s ease;
        }

        .fa-auth-input:focus,
        .fa-auth-select:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 138, 52, 0.12);
        }

        .fa-auth-doc-msg {
          display: inline-block;
          margin-top: 7px;
          font-size: 0.82rem;
          padding: 4px 8px;
          border-radius: 999px;
          width: fit-content;
        }

        .fa-auth-doc-msg.ok {
          background: var(--ok-bg);
          color: var(--ok);
          border: 1px solid #c9e7cf;
        }

        .fa-auth-doc-msg.bad {
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid #efc3bf;
        }

        .fa-auth-check {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 3px;
          background: #fcfcf7;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .fa-auth-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--pine);
        }

        .fa-auth-error {
          padding: 10px 12px;
          border-radius: 3px;
          background: var(--danger-bg);
          color: var(--danger);
          border: 1px solid #efc3bf;
          font-size: 0.9rem;
        }

        .fa-auth-submit {
          margin-top: 4px;
          border: none;
          background: var(--pine);
          color: var(--paper-white);
          padding: 13px 18px;
          border-radius: 3px;
          font-family: inherit;
          font-size: 0.98rem;
          font-weight: 700;
          cursor: pointer;
          transition: background .15s ease, transform .15s ease;
        }

        .fa-auth-submit:hover {
          background: var(--pine-deep);
        }

        .fa-auth-submit:active {
          transform: scale(0.98);
        }

        .fa-auth-submit:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .fa-auth-note {
          margin-top: 14px;
          font-size: 0.82rem;
          color: #6b7568;
          text-align: center;
        }
      `}</style>

      <div className="fa-auth-shell">
        <div className="fa-auth-side">
          <div className="fa-auth-brand-mark">فواتيري</div>
          <h1>دخول أو إنشاء نشاطك في دقائق</h1>
          <p>
            نظام فواتير سعودي للأعمال الصغيرة والمتوسطة، مع دعم الوثائق الرسمية،
            الضريبة، وإدارة النشاط من مكان واحد.
          </p>

          <div className="fa-auth-points">
            <div className="fa-auth-point"><i>01</i><span>تسجيل سريع باسم مستخدم فريد</span></div>
            <div className="fa-auth-point"><i>02</i><span>دعم وثيقة العمل الحر والسجل التجاري</span></div>
            <div className="fa-auth-point"><i>03</i><span>جاهز لإصدار الفواتير بعد إنشاء الحساب مباشرة</span></div>
          </div>
        </div>

        <div className="fa-auth-card-wrap">
          <div className="fa-auth-stamp">دخول<br />آمن</div>

          <form className="fa-auth-card" onSubmit={submit}>
            <div className="fa-auth-head">
              <div className="fa-auth-badge">
                {tab === "login" ? "تسجيل الدخول" : "نشاط جديد"}
              </div>
              <h2 className="fa-auth-title">
                {tab === "login" ? "مرحباً بعودتك" : "أنشئ نشاطك الآن"}
              </h2>
              <p className="fa-auth-sub">
                {tab === "login"
                  ? "أدخل بيانات الدخول للوصول إلى نشاطك."
                  : "أكمل البيانات الأساسية لبدء استخدام النظام."}
              </p>
            </div>

            <div className="fa-auth-tabs">
              <button
                type="button"
                className={`fa-auth-tab ${tab === "login" ? "active" : ""}`}
                onClick={() => setTab("login")}
              >
                دخول
              </button>
              <button
                type="button"
                className={`fa-auth-tab ${tab === "register" ? "active" : ""}`}
                onClick={() => setTab("register")}
              >
                نشاط جديد
              </button>
            </div>

            <div className="fa-auth-form">
              {tab === "register" && (
                <>
                  <div className="fa-auth-field">
                    <label className="fa-auth-label">اسم النشاط</label>
                    <input
                      className="fa-auth-input"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="مثال: تصميمي الحر"
                    />
                  </div>

                  <div className="fa-auth-field">
                    <label className="fa-auth-label">نوع الوثيقة</label>
                    <select
                      className="fa-auth-select"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <option value="freelance">وثيقة العمل الحر</option>
                      <option value="cr">رقم الشركة (السجل التجاري)</option>
                    </select>
                  </div>

                  <div className="fa-auth-field">
                    <label className="fa-auth-label">رقم الوثيقة</label>
                    <input
                      className="fa-auth-input"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder={docType === "cr" ? "7XXXXXXXXX" : "FL-XXXXXXXX"}
                      dir="ltr"
                    />
                    {tab === "register" && docNumber && (
                      <span className={`fa-auth-doc-msg ${docCheck.valid ? "ok" : "bad"}`}>
                        {docCheck.message}
                      </span>
                    )}
                  </div>

                  <label className="fa-auth-check">
                    <input
                      type="checkbox"
                      checked={isAdmin}
                      onChange={(e) => setIsAdmin(e.target.checked)}
                    />
                    حساب مسؤول (مراقبة جميع الحسابات)
                  </label>
                </>
              )}

              <div className="fa-auth-field">
                <label className="fa-auth-label">اسم المستخدم</label>
                <input
                  className="fa-auth-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم مستخدم فريد"
                  autoComplete="username"
                />
              </div>

              <div className="fa-auth-field">
                <label className="fa-auth-label">الرقم السري</label>
                <input
                  className="fa-auth-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                />
              </div>

              {error && <div className="fa-auth-error">{error}</div>}

              <button className="fa-auth-submit" disabled={busy} type="submit">
                {busy ? "جارٍ…" : tab === "login" ? "دخول" : "إنشاء النشاط"}
              </button>
            </div>

            <div className="fa-auth-note">
              باستخدامك للنظام فأنت توافق على إدارة بيانات نشاطك داخل حسابك الخاص.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}