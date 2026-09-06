import { useEffect, useState } from "react"
import {
  getProfile,
  saveProfile,
  getCurrentBusinessId,
  getBusinessById,
  changePassword,
  seedCatalogForCategory,
  addStaff,
  listStaff,
  removeStaff
} from "../lib/storage.js"
import { defaultProfile, docLogo, SAUDI_BANKS, getBankLogo, getBankLogoUrl, getDisplayBanks, BANK_PLACEHOLDER, BANKS_BUCKET } from "../lib/format.js"

export default function Settings({ go, refresh }) {
  const [mounted, setMounted] = useState(false)
  const [p, setP] = useState(defaultProfile)
  const [username, setUsername] = useState("")
  const [saved, setSaved] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwMsg, setPwMsg] = useState("")
  const [pwBusy, setPwBusy] = useState(false)
  const [originalCategory, setOriginalCategory] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)

  // إدارة الموظفين
  const [staffList, setStaffList] = useState([])
  const [staffUser, setStaffUser] = useState("")
  const [staffPass, setStaffPass] = useState("")
  const [staffMsg, setStaffMsg] = useState("")
  const [staffBusy, setStaffBusy] = useState(false)

  useEffect(() => {
    setMounted(true)

    getProfile().then((prof) => {
      setP(prof)
      setOriginalCategory(prof.businessCategory || "service")
    })

    const bid = getCurrentBusinessId()
    if (bid) getBusinessById(bid).then((b) => b && setUsername(b.username))

    listStaff().then(setStaffList)
  }, [])

  const set = (field, value) => setP((prev) => ({ ...prev, [field]: value }))

  const onLogo = (field) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set(field, reader.result)
    reader.readAsDataURL(file)
  }

  const onPayLogo = (field) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () =>
      set("payMethods", { ...p.payMethods, [field]: reader.result })
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaveError("")
    setSaving(true)
    try {
      await saveProfile(p)

      const newCategory = p.businessCategory || "service"
      if (newCategory !== originalCategory) {
        await seedCatalogForCategory(newCategory)
        setOriginalCategory(newCategory)
      }

      setSaved(true)
      refresh?.()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err.message || "تعذّر الحفظ")
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    setPwMsg("")
    if (pw.length < 4) {
      setPwMsg("كلمة المرور يجب ألا تقل عن 4 أحرف")
      return
    }
    if (pw !== pw2) {
      setPwMsg("كلمتا المرور غير متطابقتين")
      return
    }
    setPwBusy(true)
    try {
      await changePassword(pw)
      setPwMsg("تم تغيير كلمة المرور ✓")
      setPw("")
      setPw2("")
    } catch (e) {
      setPwMsg(e.message || "تعذّر التغيير")
    }
    setPwBusy(false)
    setTimeout(() => setPwMsg(""), 2500)
  }

  const addStaffMember = async () => {
    setStaffMsg("")
    if (!staffUser.trim() || staffPass.length < 4) {
      setStaffMsg("أدخل اسم المستخدم وكلمة مرور لا تقل عن 4 أحرف")
      return
    }
    setStaffBusy(true)
    try {
      await addStaff({ username: staffUser.trim(), password: staffPass })
      setStaffMsg("✅ تم إضافة الموظف بنجاح")
      setStaffUser("")
      setStaffPass("")
      listStaff().then(setStaffList)
    } catch (e) {
      setStaffMsg("❌ " + (e.message || "تعذّر الإضافة"))
    }
    setStaffBusy(false)
    setTimeout(() => setStaffMsg(""), 3000)
  }

  const deleteStaff = async (id) => {
    if (!window.confirm("حذف هذا الموظف؟")) return
    await removeStaff(id)
    listStaff().then(setStaffList)
  }

  return (
    <div className={`st-root${mounted ? " st-mounted" : ""}`} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .st-root {
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
          --danger-bg: #fff3f2;
          --success-bg: #edf7ee;
          --success-text: #1f6b3b;

          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .st-root * { box-sizing: border-box; }

        .st-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 28px;
        }

        @media (max-width: 640px) {
          .st-container { padding: 20px; }
        }

        .st-page-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .st-title-wrap h1 {
          margin: 0 0 8px;
          font-size: clamp(1.7rem, 3vw, 2.2rem);
          font-weight: 700;
        }

        .st-title-wrap p {
          margin: 0;
          color: #5a6355;
          font-size: 0.98rem;
        }

        .st-btn {
          padding: 11px 22px;
          border-radius: 3px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .st-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .st-btn-primary {
          background: var(--pine);
          color: var(--paper-white);
        }

        .st-btn-primary:hover { background: var(--pine-deep); }

        .st-btn-ghost {
          background: transparent;
          color: var(--pine-deep);
          border: 1px solid var(--line);
        }

        .st-btn-ghost:hover { background: var(--paper-white); }

        .st-btn-danger {
          background: transparent;
          color: var(--danger);
          border: 1px solid #efc3bf;
        }

        .st-btn-danger:hover {
          background: var(--danger-bg);
        }

        .st-toast {
          margin-bottom: 18px;
          padding: 12px 16px;
          border: 1px solid var(--line);
          background: var(--paper-white);
          border-radius: 3px;
          font-size: 0.92rem;
        }

        .st-toast.success {
          background: var(--success-bg);
          color: var(--success-text);
          border-color: #c9e7cf;
        }

        .st-toast.error {
          background: #fff1f1;
          color: #b42318;
          border-color: #efc3bf;
        }

        .st-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        @media (max-width: 920px) {
          .st-grid { grid-template-columns: 1fr; }
        }

        .st-card {
          background: var(--paper-white);
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 22px;
          box-shadow: 0 12px 30px -24px rgba(22, 53, 39, 0.35);
          position: relative;
          overflow: hidden;
        }

        .st-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 4px;
          background: linear-gradient(90deg, var(--gold), transparent 65%);
          opacity: 0.8;
        }

        .st-card.full {
          grid-column: 1 / -1;
        }

        .st-card-title {
          margin: 0 0 16px;
          font-size: 1.08rem;
          font-weight: 700;
          color: var(--pine-deep);
          border-bottom: 1px dashed var(--line-soft);
          padding-bottom: 10px;
        }

        .st-fields {
          display: grid;
          gap: 14px;
        }

        .st-field {
          display: grid;
          gap: 6px;
        }

        .st-field label,
        .st-label {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--ink);
        }

        .st-input,
        .st-select,
        .st-textarea {
          width: 100%;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 3px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 0.95rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .st-input:focus,
        .st-select:focus,
        .st-textarea:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(185, 138, 52, 0.12);
        }

        .st-input[disabled] {
          background: #f3f4ef;
          color: #6b7568;
        }

        .st-hint {
          font-size: 0.86rem;
          color: #6b7568;
          background: #f4f5ef;
          border: 1px dashed var(--line);
          padding: 10px 12px;
          border-radius: 3px;
        }

        .st-hint.green {
          background: #edf7ee;
          border-color: #c9e7cf;
          color: #1f6b3b;
        }

        .st-inline {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .st-logo-preview {
          max-height: 76px;
          max-width: 180px;
          object-fit: contain;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: #fff;
          padding: 6px;
        }

        .st-logo-preview.sm {
          max-height: 52px;
          max-width: 130px;
        }

        .st-check {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 3px;
          background: #fcfcf7;
        }

        .st-check input {
          width: 16px;
          height: 16px;
          accent-color: var(--pine);
        }

        .st-staff-list {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .st-staff-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: #fcfcf7;
          border: 1px solid var(--line);
          border-radius: 3px;
        }

        .st-doc-box {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 2px;
          margin-bottom: 4px;
          padding: 10px 12px;
          background: #fcfcf7;
          border: 1px solid var(--line-soft);
          border-radius: 3px;
        }

        .st-doc-box img {
          height: 48px;
          object-fit: contain;
          border-radius: 6px;
          background: #fff;
          padding: 4px;
          border: 1px solid var(--line);
        }

        .st-doc-box span {
          font-size: .85rem;
          color: #5a6355;
        }

        .st-save-bar {
          position: sticky;
          bottom: 14px;
          z-index: 30;
          margin-top: 28px;
          background: rgba(249,249,242,0.92);
          backdrop-filter: blur(8px);
          border: 1px solid var(--line);
          box-shadow: 0 16px 40px -28px rgba(22, 53, 39, 0.45);
          border-radius: 6px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .st-save-msg {
          font-size: 0.9rem;
          color: #5a6355;
        }

        .st-save-msg.error {
          color: #b42318;
        }

        .st-badge {
          display: inline-block;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--pine-deep);
          background: #e2e8dd;
          padding: 4px 10px;
          border-radius: 2px;
          margin-bottom: 10px;
        }
      `}</style>

      <div className="st-container">
        <div className="st-page-head">
          <div className="st-title-wrap">
            <div className="st-badge">إعدادات النشاط</div>
            <h1>إدارة بيانات نشاطك</h1>
            <p>حدّث الهوية، الضريبة، طرق الدفع، الموظفين، ومعلومات الفواتير من مكان واحد.</p>
          </div>

          <button className="st-btn st-btn-primary" onClick={save} disabled={saving}>
            {saving ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>

        {saved && <div className="st-toast success">تم حفظ بيانات النشاط ✓</div>}
        {saveError && <div className="st-toast error">❌ {saveError}</div>}

        <div className="st-grid">
          <section className="st-card">
            <h2 className="st-card-title">الحساب</h2>
            <div className="st-fields">
              <div className="st-field">
                <label className="st-label">اسم المستخدم</label>
                <input className="st-input" value={username} disabled readOnly />
              </div>
              <div className="st-hint">
                اسم المستخدم فريد لكل نشاط ويُستخدم للدخول. لإنشاء نشاط آخر سجّل الخروج واختر «نشاط جديد».
              </div>
            </div>
          </section>

          <section className="st-card">
            <h2 className="st-card-title">التواصل وتنويه الضريبة</h2>
            <div className="st-fields">
              <div className="st-field">
                <label className="st-label">الجوال</label>
                <input
                  className="st-input"
                  value={p.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div className="st-field">
                <label className="st-label">البريد الإلكتروني</label>
                <input
                  className="st-input"
                  value={p.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>

              <div className="st-field">
                <label className="st-label">العنوان (يظهر في الفاتورة)</label>
                <input
                  className="st-input"
                  value={p.address || ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="المدينة، الشارع..."
                />
              </div>

              <div className="st-field">
                <label className="st-label">تنويه الضريبة (يظهر في الفاتورة)</label>
                <input
                  className="st-input"
                  value={p.note}
                  onChange={(e) => set("note", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="st-card full">
            <h2 className="st-card-title">الهوية</h2>
            <div className="st-grid" style={{ gap: 18 }}>
              <div className="st-fields">
                <div className="st-field">
                  <label className="st-label">اسم النشاط</label>
                  <input
                    className="st-input"
                    value={p.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                  />
                </div>

                <div className="st-field">
                  <label className="st-label">نوع النشاط</label>
                  <select
                    className="st-select"
                    value={p.businessCategory || "service"}
                    onChange={(e) => set("businessCategory", e.target.value)}
                  >
                    <option value="service">خدمات (برمجة / شبكات)</option>
                    <option value="cafeteria">كافتيريا</option>
                    <option value="restaurant">مطعم</option>
                    <option value="supermarket">سوبر ماركت</option>
                    <option value="paint_shop">محل أصباغ</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                {(p.businessCategory === "cafeteria" || p.businessCategory === "restaurant") && (
                  <div className="st-hint green">
                    ✅ سيتم تفعيل لوحة الكاشير لهذا النشاط
                  </div>
                )}

                <div className="st-field">
                  <label className="st-label">نوع الوثيقة</label>
                  <select
                    className="st-select"
                    value={p.docType || "freelance"}
                    onChange={(e) => set("docType", e.target.value)}
                  >
                    <option value="freelance">وثيقة العمل الحر</option>
                    <option value="cr">رقم الشركة (السجل التجاري)</option>
                  </select>
                </div>

                <div className="st-doc-box">
                  <img src={docLogo(p.docType || "freelance")} alt="شعار الوثيقة" />
                  <span>
                    {p.docType === "cr"
                      ? "وزارة التجارة"
                      : "وزارة الموارد البشرية — العمل الحر"}
                  </span>
                </div>

                <div className="st-field">
                  <label className="st-label">رقم الوثيقة</label>
                  <input
                    className="st-input"
                    dir="ltr"
                    value={p.docNumber || ""}
                    onChange={(e) => set("docNumber", e.target.value)}
                    placeholder={p.docType === "cr" ? "7XXXXXXXXX" : "FL-XXXXXXXX"}
                  />
                </div>
              </div>

              <div className="st-fields">
                <div className="st-field">
                  <label className="st-label">شعار العمل الحر (صورة — يظهر يسار الفاتورة)</label>
                  <input className="st-input" type="file" accept="image/*" onChange={onLogo("freelanceLogo")} />
                </div>
                {p.freelanceLogo && (
                  <img className="st-logo-preview" src={p.freelanceLogo} alt="preview" />
                )}

                <div className="st-field">
                  <label className="st-label">شعار الشركة / المشروع (صورة — يظهر يمين الفاتورة)</label>
                  <input className="st-input" type="file" accept="image/*" onChange={onLogo("companyLogo")} />
                </div>
                {p.companyLogo && (
                  <img className="st-logo-preview" src={p.companyLogo} alt="preview" />
                )}
              </div>
            </div>
          </section>

          <section className="st-card">
            <h2 className="st-card-title">بيانات البنك</h2>
            <div className="st-fields">
              <div className="st-field">
                <label className="st-label">اختر البنك</label>
                <select
                  className="st-select"
                  value={p.bankId || ""}
                  onChange={(e) => {
                    const bankId = e.target.value
                    if (bankId && bankId !== "custom") {
                      const bank = SAUDI_BANKS.find(b => b.id === bankId)
                      if (bank) {
                        setP(prev => ({
                          ...prev,
                          bankId,
                          bankName: bank.name,
                          payMethods: { ...prev.payMethods, bankLogo: getBankLogoUrl(bankId), bankId }
                        }))
                      }
                    } else if (bankId === "custom") {
                      setP(prev => ({ ...prev, bankId, payMethods: { ...prev.payMethods, bankId } }))
                    } else {
                      setP(prev => ({ ...prev, bankId: "", bankName: "", payMethods: { ...prev.payMethods, bankLogo: "", bankId: "" } }))
                    }
                  }}
                >
                  <option value="">— اختر البنك —</option>
                  {getDisplayBanks().map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                <div className="st-hint" style={{ marginTop: 8, fontSize: ".82rem" }}>
                  الصور تُحمّل تلقائياً من Supabase Storage bucket: <code>{BANKS_BUCKET}</code> — تأكد من رفع ملفات الشعارات بنفس الأسماء داخل الـ bucket وجعله Public
                </div>
              </div>

              {(p.bankId && p.bankId !== "custom") && (
                <div className="st-field">
                  <div className="st-inline" style={{ gap: 16, marginTop: 4, alignItems: "center" }}>
                    <img
                      src={getBankLogo(p.bankId) || BANK_PLACEHOLDER}
                      alt={p.bankName}
                      style={{ height: 44, width: "auto", maxWidth: 180, objectFit: "contain", background: "#fff", padding: 8, borderRadius: 6, border: "1px solid var(--line)" }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BANK_PLACEHOLDER }}
                    />
                    <span style={{ fontSize: 0.9, color: "#5a6355" }}>
                      تم اختيار: <strong>{p.bankName}</strong>
                      <br />
                      <span style={{ fontSize: ".78rem", color: "#7a8172" }}>
                        {SAUDI_BANKS.find(b => b.id === p.bankId)?.logoFile} → {getBankLogo(p.bankId)}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {p.bankId === "custom" && (
                <div className="st-field">
                  <label className="st-label">اسم البنك (يدوي)</label>
                  <input
                    className="st-input"
                    value={p.bankName}
                    onChange={(e) => set("bankName", e.target.value)}
                    placeholder="أدخل اسم البنك يدوياً"
                  />
                </div>
              )}

              <div className="st-field">
                <label className="st-label">اسم المستفيد (صاحب الحساب)</label>
                <input
                  className="st-input"
                  value={p.accountName}
                  onChange={(e) => set("accountName", e.target.value)}
                />
              </div>

              <div className="st-field">
                <label className="st-label">رقم الحساب</label>
                <input
                  className="st-input"
                  value={p.accountNumber}
                  onChange={(e) => set("accountNumber", e.target.value)}
                />
              </div>

              <div className="st-field">
                <label className="st-label">الآيبان (IBAN)</label>
                <input
                  className="st-input"
                  dir="ltr"
                  value={p.iban}
                  onChange={(e) => set("iban", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="st-card">
            <h2 className="st-card-title">الضريبة (VAT)</h2>
            <div className="st-fields">
              <div className="st-hint">
                تُطبَّق الضريبة على الفواتير فقط إذا أدخلت رقمك الضريبي واخترت نسبة 15% أو 5%.
                البيانات تُحفظ ضمن إعدادات النشاط.
              </div>

              <div className="st-field">
                <label className="st-label">الرقم الضريبي</label>
                <input
                  className="st-input"
                  dir="ltr"
                  value={p.payMethods?.taxNumber || ""}
                  onChange={(e) =>
                    set("payMethods", {
                      ...p.payMethods,
                      taxNumber: e.target.value.trim()
                    })
                  }
                  placeholder="3XXXXXXXXXXXXX"
                />
              </div>

              <div className="st-field">
                <label className="st-label">نسبة ضريبة القيمة المضافة</label>
                <select
                  className="st-select"
                  value={Number(p.payMethods?.vatRate) || 0}
                  onChange={(e) =>
                    set("payMethods", {
                      ...p.payMethods,
                      vatRate: Number(e.target.value) || 0
                    })
                  }
                >
                  <option value={0}>لا ضريبة</option>
                  <option value={15}>15%</option>
                  <option value={5}>5%</option>
                </select>
              </div>

              {((p.payMethods?.taxNumber || "").trim() !== "" &&
                Number(p.payMethods?.vatRate) > 0) && (
                <div className="st-hint green">
                  سيتم تطبيق ضريبة {p.payMethods.vatRate}% تلقائياً على الفواتير الجديدة.
                </div>
              )}
            </div>
          </section>

          <section className="st-card full">
            <h2 className="st-card-title">طرق الدفع المتاحة للعميل</h2>
            <div className="st-grid" style={{ gap: 18 }}>
              <div className="st-fields">
                <label className="st-check">
                  <input
                    type="checkbox"
                    checked={p.payMethods?.bank}
                    onChange={(e) =>
                      set("payMethods", { ...p.payMethods, bank: e.target.checked })
                    }
                  />
                  تحويل بنكي ({p.bankName})
                </label>

                <div className="st-field">
                  <label className="st-label">شعار التحويل البنكي (صورة مخصصة — يترك فارغاً لاستخدام شعار الـ bucket)</label>
                  <input className="st-input" type="file" accept="image/*" onChange={onPayLogo("bankLogo")} />
                  <div className="st-hint" style={{ fontSize: ".82rem" }}>
                    إذا اخترت بنكاً من القائمة سيُستخدم شعار الـ bucket تلقائياً. يمكنك رفع صورة مخصصة هنا لتجاوزه.
                  </div>
                </div>
                {(p.payMethods?.bankLogo || (p.bankId && p.bankId !== "custom" && getBankLogo(p.bankId))) && (
                  <img
                    className="st-logo-preview sm"
                    src={p.payMethods?.bankLogo || getBankLogo(p.bankId)}
                    alt="bank"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = BANK_PLACEHOLDER }}
                  />
                )}

                <label className="st-check">
                  <input
                    type="checkbox"
                    checked={p.payMethods?.applePay}
                    onChange={(e) =>
                      set("payMethods", { ...p.payMethods, applePay: e.target.checked })
                    }
                  />
                  Apple Pay
                </label>

                {p.payMethods?.applePay && (
                  <div className="st-field">
                    <label className="st-label">رقم الجوال لـ Apple Pay</label>
                    <input
                      className="st-input"
                      dir="ltr"
                      value={p.payMethods?.applePayPhone || ""}
                      onChange={(e) =>
                        set("payMethods", {
                          ...p.payMethods,
                          applePayPhone: e.target.value
                        })
                      }
                      placeholder="05xxxxxxxx"
                    />
                  </div>
                )}

                <div className="st-field">
                  <label className="st-label">شعار Apple Pay (صورة)</label>
                  <input className="st-input" type="file" accept="image/*" onChange={onPayLogo("applePayLogo")} />
                </div>
                {p.payMethods?.applePayLogo && (
                  <img className="st-logo-preview sm" src={p.payMethods.applePayLogo} alt="applepay" />
                )}
              </div>

              <div className="st-fields">
                <label className="st-check">
                  <input
                    type="checkbox"
                    checked={p.payMethods?.mastercard}
                    onChange={(e) =>
                      set("payMethods", { ...p.payMethods, mastercard: e.target.checked })
                    }
                  />
                  بطاقة Mastercard
                </label>

                <div className="st-field">
                  <label className="st-label">شعار Mastercard (صورة)</label>
                  <input className="st-input" type="file" accept="image/*" onChange={onPayLogo("mastercardLogo")} />
                </div>
                {p.payMethods?.mastercardLogo && (
                  <img className="st-logo-preview sm" src={p.payMethods.mastercardLogo} alt="mastercard" />
                )}
              </div>
            </div>
          </section>

          <section className="st-card">
            <h2 className="st-card-title">تغيير الرقم السري</h2>
            <div className="st-fields">
              <div className="st-field">
                <label className="st-label">كلمة المرور الجديدة</label>
                <input
                  className="st-input"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>

              <div className="st-field">
                <label className="st-label">تأكيد كلمة المرور</label>
                <input
                  className="st-input"
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                />
              </div>

              {pwMsg && <div className="st-hint">{pwMsg}</div>}

              <button className="st-btn st-btn-ghost" onClick={savePassword} disabled={pwBusy}>
                {pwBusy ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
              </button>
            </div>
          </section>

          {(!p.role || p.role === "owner") && (
            <section className="st-card">
              <h2 className="st-card-title">👥 إدارة الموظفين</h2>

              <div className="st-fields">
                <div className="st-hint">
                  الموظفون يستطيعون إنشاء الفواتير ولوحة الكاشير فقط — لا يمكنهم تعديل الإعدادات أو الأصناف.
                </div>

                {staffList.length > 0 ? (
                  <div className="st-staff-list">
                    {staffList.map((s) => (
                      <div key={s.id} className="st-staff-item">
                        <span>👤 {s.username}</span>
                        <button className="st-btn st-btn-danger" onClick={() => deleteStaff(s.id)}>
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="st-hint">لا يوجد موظفون حتى الآن.</div>
                )}

                <div className="st-field">
                  <label className="st-label">اسم المستخدم (للموظف)</label>
                  <input
                    className="st-input"
                    value={staffUser}
                    onChange={(e) => setStaffUser(e.target.value)}
                    placeholder="مثال: cashier1"
                    autoComplete="off"
                  />
                </div>

                <div className="st-field">
                  <label className="st-label">كلمة المرور</label>
                  <input
                    className="st-input"
                    type="password"
                    value={staffPass}
                    onChange={(e) => setStaffPass(e.target.value)}
                    placeholder="4 أحرف على الأقل"
                    autoComplete="new-password"
                  />
                </div>

                {staffMsg && <div className="st-hint">{staffMsg}</div>}

                <button className="st-btn st-btn-primary" onClick={addStaffMember} disabled={staffBusy}>
                  {staffBusy ? "جارٍ الإضافة…" : "➕ إضافة موظف"}
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="st-save-bar">
          <div className={`st-save-msg${saveError ? " error" : ""}`}>
            {saved ? "✅ تم الحفظ" : saveError ? `❌ ${saveError}` : "احفظ التعديلات بعد الانتهاء"}
          </div>
          <button className="st-btn st-btn-primary" onClick={save} disabled={saving}>
            {saving ? "⏳ جارٍ الحفظ…" : "💾 حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  )
}