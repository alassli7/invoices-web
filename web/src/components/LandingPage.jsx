import { useEffect, useState } from "react"

export default function LandingPage({ onGetStarted, onLogin, onPricing }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const features = [
    {
      icon: "📄",
      title: "فواتير احترافية",
      desc: "إنشاء فواتير متوافقة مع هيئة الزكاة والضريبة والجمارك، مع دعم ضريبة القيمة المضافة"
    },
    {
      icon: "📦",
      title: "إدارة الأصناف والكتالوج",
      desc: "حفظ الخدمات والمنتجات مع الأسعار، وتصنيفها حسب نوع النشاط"
    },
    {
      icon: "👥",
      title: "نظام الموظفين",
      desc: "إضافة حتى 5 موظفين بحسابات فرعية مرتبطة بالحساب الرئيسي"
    },
    {
      icon: "📊",
      title: "لوحة تحكم وتقارير",
      desc: "متابعة المبيعات، الفواتير المدفوعة والمستحقة، وإحصائيات النشاط"
    },
    {
      icon: "💳",
      title: "طرق دفع متعددة",
      desc: "تحويل بنكي، آبل باي، مدى وماستركارد، مع رمز QR للدفع السريع"
    },
    {
      icon: "🌐",
      title: "مشاركة فورية",
      desc: "إرسال الفاتورة عبر واتساب أو رابط مباشر، بعرض مناسب للجوال والطباعة"
    },
    {
      icon: "🎨",
      title: "تخصيص كامل",
      desc: "شعارك، بيانات بنكك، ملاحظاتك، وتصنيف نشاطك على كل فاتورة"
    },
    {
      icon: "☁️",
      title: "سحابي أو محلي",
      desc: "مزامنة سحابية عبر Supabase، أو عمل محلي في المتصفح بدون إنترنت"
    }
  ]

  const businessTypes = [
    { value: "service", label: "خدمات الكمبيوتر والبرمجة", icon: "💻" },
    { value: "restaurant", label: "مطاعم ومقاهي", icon: "🍽️" },
    { value: "cafeteria", label: "كافيهات وحلويات", icon: "☕" },
    { value: "supermarket", label: "سوبر ماركت وتجزئة", icon: "🛒" },
    { value: "paint_shop", label: "محلات الأصباغ والدهانات", icon: "🎨" },
    { value: "freelance", label: "عمل حر واستشارات", icon: "📝" }
  ]

  const steps = [
    { n: "01", title: "سجّل حسابك", desc: "أدخل اسم نشاطك، رقمه، وتصنيفه" },
    { n: "02", title: "أضف أصنافك", desc: "من كتالوج جاهز أو أصناف خاصة بك" },
    { n: "03", title: "أصدر فاتورتك", desc: "أضف العميل والأصناف، ثم أرسلها أو اطبعها" }
  ]

  return (
    <div className={`ld-root${mounted ? " ld-mounted" : ""}`} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .ld-root {
          --ink: #1b2a20;
          --paper: #eef0e5;
          --paper-white: #f9f9f2;
          --pine: #1f4d3a;
          --pine-deep: #163527;
          --stamp: #9c3b29;
          --gold: #b98a34;
          --line: #cdc9b2;
          --line-soft: #dedbc7;

          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background: var(--paper);
          color: var(--ink);
          direction: rtl;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        .ld-root * { box-sizing: border-box; }
        .ld-container { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
        @media (max-width: 640px) { .ld-container { padding: 0 20px; } }

        button { font-family: inherit; cursor: pointer; border: none; }
        a { color: inherit; text-decoration: none; }

        .ld-mark {
          font-family: 'Aref Ruqaa', serif;
          font-weight: 700;
          font-size: 1.7rem;
          color: var(--pine-deep);
          letter-spacing: 0.5px;
        }

        /* ---------- header ---------- */
        .ld-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 0;
        }
        .ld-nav-actions { display: flex; gap: 10px; align-items: center; }
        .btn {
          padding: 11px 22px;
          border-radius: 3px;
          font-size: 0.95rem;
          font-weight: 600;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .btn-ghost {
          background: transparent;
          color: var(--pine-deep);
          border: 1px solid var(--line);
        }
        .btn-ghost:hover { background: var(--paper-white); }
        .btn-primary {
          background: var(--pine);
          color: var(--paper-white);
        }
        .btn-primary:hover { background: var(--pine-deep); }
        .btn-primary:active, .btn-ghost:active { transform: scale(0.97); }
        .btn-large { padding: 15px 30px; font-size: 1.02rem; }
        .btn-gold { background: var(--gold); color: var(--ink); }
        .btn-gold:hover { background: #a67a2c; }

        /* ---------- hero ---------- */
        .ld-hero {
          display: grid;
          grid-template-columns: 1fr 0.95fr;
          gap: 56px;
          align-items: center;
          padding: 56px 0 84px;
        }
        @media (max-width: 900px) {
          .ld-hero { grid-template-columns: 1fr; gap: 44px; padding: 24px 0 56px; }
        }
        .ld-hero h1 {
          font-size: clamp(2rem, 4vw, 2.7rem);
          line-height: 1.28;
          font-weight: 700;
          margin: 0 0 18px;
          max-width: 15ch;
        }
        .ld-hero-sub {
          font-size: 1.08rem;
          color: #3d4a41;
          max-width: 46ch;
          margin: 0 0 30px;
        }
        .ld-hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .ld-hero-note {
          font-size: 0.86rem;
          color: #6b7568;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ld-hero-note span:not(:last-child)::after { content: "·"; margin-inline-start: 8px; color: var(--line); }

        /* invoice mockup */
        .ld-invoice-wrap {
          position: relative;
          opacity: 0;
          transform: scale(1.08) rotate(-3deg);
        }
        .ld-mounted .ld-invoice-wrap {
          animation: pressIn 0.65s cubic-bezier(.2,.7,.3,1) 0.15s forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .ld-invoice-wrap { opacity: 1; transform: none; animation: none; }
        }
        @keyframes pressIn {
          0% { opacity: 0; transform: scale(1.1) rotate(-4deg); }
          70% { opacity: 1; }
          100% { opacity: 1; transform: scale(1) rotate(-1.2deg); }
        }
        .ld-invoice {
          background: var(--paper-white);
          border: 1px solid var(--line);
          border-radius: 2px;
          padding: 26px 26px 20px;
          box-shadow: 0 18px 40px -20px rgba(22, 53, 39, 0.35);
          position: relative;
        }
        .ld-invoice::after {
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
        .ld-inv-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
        .ld-inv-badge {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--pine-deep);
          background: #e2e8dd;
          padding: 4px 10px;
          border-radius: 2px;
        }
        .ld-inv-num { font-size: 0.78rem; color: #7a8172; font-variant-numeric: tabular-nums; }
        .ld-inv-row { display: flex; justify-content: space-between; font-size: 0.88rem; padding: 3px 0; color: #4a5245; }
        .ld-inv-row strong { color: var(--ink); font-weight: 600; }
        .ld-inv-hr { border: none; border-top: 1px dashed var(--line-soft); margin: 12px 0; }
        .ld-inv-item { display: flex; justify-content: space-between; font-size: 0.87rem; padding: 5px 0; }
        .ld-inv-item span:last-child { font-variant-numeric: tabular-nums; color: #4a5245; }
        .ld-inv-total { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.95rem; padding-top: 4px; }
        .ld-inv-total strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; color: var(--pine-deep); }

        .ld-stamp {
          position: absolute;
          top: -18px;
          left: -22px;
          width: 92px;
          height: 92px;
          border-radius: 50%;
          border: 2.5px solid var(--stamp);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--stamp);
          font-family: 'Aref Ruqaa', serif;
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1.15;
          transform: rotate(-14deg);
          background: rgba(249,249,242,0.9);
        }
        .ld-stamp::before {
          content: "";
          position: absolute;
          inset: 6px;
          border: 1px solid var(--stamp);
          border-radius: 50%;
          opacity: 0.55;
        }

        /* ---------- section shell ---------- */
        .ld-section { padding: 72px 0; }
        .ld-section-header { max-width: 52ch; margin-bottom: 40px; }
        .ld-section-header h2 {
          font-size: clamp(1.5rem, 2.6vw, 1.9rem);
          font-weight: 700;
          margin: 0 0 10px;
        }
        .ld-section-header p { color: #5a6355; font-size: 1rem; margin: 0; }

        /* ---------- features as ledger ---------- */
        .ld-ledger { border-top: 1.5px solid var(--ink); }
        .ld-ledger-head {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 18px;
          padding: 10px 4px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #6b7568;
          border-bottom: 1px solid var(--line);
        }
        .ld-ledger-row {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 18px;
          padding: 20px 4px;
          border-bottom: 1px solid var(--line-soft);
          align-items: start;
        }
        .ld-ledger-row:nth-child(even) { background: rgba(255,255,255,0.4); }
        .ld-ledger-num {
          font-variant-numeric: tabular-nums;
          color: var(--gold);
          font-weight: 700;
          font-size: 0.95rem;
          padding-top: 2px;
        }
        .ld-ledger-body { display: flex; gap: 14px; }
        .ld-ledger-icon {
          width: 40px; height: 40px;
          border-radius: 3px;
          background: var(--paper-white);
          border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .ld-ledger-text h3 { margin: 0 0 4px; font-size: 1.02rem; font-weight: 600; }
        .ld-ledger-text p { margin: 0; color: #5a6355; font-size: 0.92rem; max-width: 56ch; }

        /* ---------- business types ---------- */
        .ld-types-section { background: var(--pine-deep); color: var(--paper-white); }
        .ld-types-section .ld-section-header p { color: #b9c7bb; }
        .ld-types-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .ld-type-tag {
          display: flex;
          align-items: center;
          gap: 9px;
          background: transparent;
          border: 1px solid rgba(249,249,242,0.28);
          border-radius: 999px;
          padding: 10px 18px;
          color: var(--paper-white);
          font-size: 0.92rem;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ld-type-tag:hover { border-color: var(--gold); background: rgba(249,249,242,0.06); }
        .ld-type-icon { font-size: 1rem; }

        /* ---------- how it works ---------- */
        .ld-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          position: relative;
        }
        @media (max-width: 760px) {
          .ld-steps { grid-template-columns: 1fr; gap: 28px; }
          .ld-step:not(:last-child)::after { display: none; }
        }
        .ld-step {
          position: relative;
          padding: 0 22px;
        }
        .ld-step:first-child { padding-inline-start: 0; }
        .ld-step:last-child { padding-inline-end: 0; }
        .ld-step:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 20px;
          inset-inline-start: 0;
          transform: translateX(50%);
          width: 100%;
          border-top: 1px dashed var(--line);
        }
        .ld-step-num {
          font-family: 'Aref Ruqaa', serif;
          font-size: 2.1rem;
          font-weight: 700;
          color: var(--gold);
          position: relative;
          z-index: 1;
          background: var(--paper);
          display: inline-block;
          padding-inline-end: 14px;
        }
        .ld-step h3 { margin: 14px 0 6px; font-size: 1.05rem; font-weight: 600; }
        .ld-step p { margin: 0; color: #5a6355; font-size: 0.92rem; }

        /* ---------- CTA ---------- */
        .ld-cta-section { padding: 88px 0; background: var(--ink); }
        .ld-cta-inner { text-align: center; max-width: 46ch; margin: 0 auto; }
        .ld-cta-inner h2 {
          font-family: 'Aref Ruqaa', serif;
          font-size: clamp(1.8rem, 3.4vw, 2.4rem);
          color: var(--paper-white);
          margin: 0 0 14px;
          font-weight: 700;
        }
        .ld-cta-inner p { color: #b7bfad; margin: 0 0 28px; font-size: 1rem; }

        /* ---------- footer ---------- */
        .ld-footer { border-top: 1px solid var(--line); padding: 52px 0 28px; }
        .ld-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 32px;
          margin-bottom: 36px;
        }
        @media (max-width: 760px) { .ld-footer-grid { grid-template-columns: 1fr 1fr; } }
        .ld-footer-brand p { color: #6b7568; font-size: 0.88rem; margin-top: 10px; max-width: 30ch; }
        .ld-footer-links h4 { font-size: 0.85rem; margin: 0 0 12px; color: #6b7568; font-weight: 600; }
        .ld-footer-links a, .ld-footer-links p {
          display: block;
          font-size: 0.9rem;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .ld-footer-links a:hover { color: var(--pine); }
        .ld-footer-bottom {
          border-top: 1px solid var(--line-soft);
          padding-top: 20px;
          font-size: 0.82rem;
          color: #7a8172;
        }
      `}</style>

      <header className="ld-container">
        <nav className="ld-nav">
          <div className="ld-mark">فواتيري</div>
          <div className="ld-nav-actions">
            <button className="btn btn-ghost" onClick={onPricing}>الأسعار</button>
            <button className="btn btn-ghost" onClick={onLogin}>دخول</button>
            <button className="btn btn-primary" onClick={onGetStarted}>ابدأ مجاناً</button>
          </div>
        </nav>

        <section className="ld-hero">
          <div>
            <h1>نظام فواتير متكامل للأعمال السعودية</h1>
            <p className="ld-hero-sub">
              أصدر فواتير متوافقة مع هيئة الزكاة والضريبة والجمارك، وتابع مبيعاتك وموظفينك من مكان واحد.
            </p>
            <div className="ld-hero-actions">
              <button className="btn btn-primary btn-large" onClick={onGetStarted}>ابدأ الآن مجاناً</button>
              <button className="btn btn-ghost btn-large" onClick={onLogin}>لدي حساب بالفعل</button>
            </div>
            <div className="ld-hero-note">
              <span>بدون بطاقة ائتمان</span>
              <span>إعداد في دقيقة واحدة</span>
              <span>متوافق مع ضريبة القيمة المضافة</span>
            </div>
          </div>

          <div className="ld-invoice-wrap">
            <div className="ld-stamp">معتمد<br />زاتكا</div>
            <div className="ld-invoice">
              <div className="ld-inv-top">
                <span className="ld-inv-badge">فاتورة ضريبية</span>
                <span className="ld-inv-num">INV-2026-0042</span>
              </div>
              <div className="ld-inv-row"><span>العميل</span><strong>شركة التقانة الحديثة</strong></div>
              <div className="ld-inv-row"><span>التاريخ</span><strong>2026/09/01</strong></div>
              <hr className="ld-inv-hr" />
              <div className="ld-inv-item"><span>برمجة تطبيق جوال</span><span>15,000 ر.س</span></div>
              <div className="ld-inv-item"><span>تصميم واجهة مستخدم</span><span>5,000 ر.س</span></div>
              <div className="ld-inv-item"><span>استضافة ونطاق (سنوي)</span><span>800 ر.س</span></div>
              <hr className="ld-inv-hr" />
              <div className="ld-inv-total"><span>الإجمالي شامل الضريبة</span><strong>23,520 ر.س</strong></div>
            </div>
          </div>
        </section>
      </header>

      <section className="ld-section" id="features">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2>كل ما تحتاجه، في فاتورة واحدة</h2>
            <p>ثماني ميزات أساسية بنيت لطريقة عمل الأنشطة الصغيرة والمتوسطة في السعودية</p>
          </div>
          <div className="ld-ledger">
            <div className="ld-ledger-head">
              <span>رقم</span>
              <span>الميزة</span>
            </div>
            {features.map((f, i) => (
              <div className="ld-ledger-row" key={i}>
                <div className="ld-ledger-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="ld-ledger-body">
                  <div className="ld-ledger-icon">{f.icon}</div>
                  <div className="ld-ledger-text">
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-section ld-types-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2>مصمم لنوع نشاطك</h2>
            <p>اختر تصنيف نشاطك واحصل على كتالوج أصناف جاهز يمكنك تعديله</p>
          </div>
          <div className="ld-types-grid">
            {businessTypes.map((t) => (
              <button key={t.value} className="ld-type-tag">
                <span className="ld-type-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-section">
        <div className="ld-container">
          <div className="ld-section-header">
            <h2>ثلاث خطوات وتصدر فاتورتك الأولى</h2>
            <p>لا حاجة لإعدادات معقدة أو خبرة محاسبية</p>
          </div>
          <div className="ld-steps">
            {steps.map((s) => (
              <div className="ld-step" key={s.n}>
                <span className="ld-step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-cta-section">
        <div className="ld-container ld-cta-inner">
          <h2>جاهز تصدر فاتورتك الأولى؟</h2>
          <p>انضم إلى الأعمال التي تدير فواتيرها بكفاءة مع فواتيري</p>
          <button className="btn btn-gold btn-large" onClick={onGetStarted}>إنشاء حساب مجاني</button>
        </div>
      </section>

      <footer className="ld-footer">
        <div className="ld-container">
          <div className="ld-footer-grid">
            <div className="ld-footer-brand">
              <div className="ld-mark">فواتيري</div>
              <p>نظام فواتير سعودي بسيط وقوي للأعمال الصغيرة والمتوسطة</p>
            </div>
            <div className="ld-footer-links">
              <h4>روابط سريعة</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onPricing(); }}>الأسعار</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onLogin(); }}>تسجيل الدخول</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }}>إنشاء حساب</a>
              <a href="#features">المميزات</a>
            </div>
            <div className="ld-footer-links">
              <h4>الدعم</h4>
              <a href="#">الأسئلة الشائعة</a>
              <a href="#">تواصل معنا</a>
              <a href="#">الشروط والأحكام</a>
            </div>
            <div className="ld-footer-links">
              <h4>التوافق</h4>
              <p>هيئة الزكاة والضريبة والجمارك</p>
              <p>ضريبة القيمة المضافة 15٪</p>
              <p>الفاتورة الإلكترونية</p>
            </div>
          </div>
          <div className="ld-footer-bottom">
            جميع الحقوق محفوظة © {new Date().getFullYear()} فواتيري
          </div>
        </div>
      </footer>
    </div>
  )
}