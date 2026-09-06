import { useState } from "react"

const plans = [
  {
    id: "free",
    name: "مجاني",
    price: { monthly: 0, yearly: 0 },
    description: "مثالي للبدء وتجربة الميزات الأساسية",
    features: [
      "فواتير غير محدودة",
      "كتالوج أصناف (حتى 20 صنف)",
      "عميل واحد نشط",
      "تقارير أساسية",
      "نسخ احتياطي محلي",
      "دعم المجتمع"
    ],
    limits: { invoices: "غير محدود", catalog: "20 صنف", clients: "1", staff: "0", api: "غير متاح" },
    cta: "ابدأ مجاناً",
    popular: false
  },
  {
    id: "pro",
    name: "احترافي",
    price: { monthly: 49, yearly: 39 },
    description: "للأعمال النامية التي تحتاج ميزات متقدمة",
    features: [
      "كل شيء في المجاني",
      "أصناف وعملاء غير محدودين",
      "حتى 5 موظفين",
      "تقارير متقدمة وتحليلات",
      "مزامنة سحابية (Supabase)",
      "API للوصول البرمجي",
      "قوالب فواتير مخصصة",
      "دعم أولوي بالبريد الإلكتروني"
    ],
    limits: { invoices: "غير محدود", catalog: "غير محدود", clients: "غير محدود", staff: "5", api: "متاح" },
    cta: "اشترك الآن",
    popular: true
  },
  {
    id: "business",
    name: "الأعمال",
    price: { monthly: 149, yearly: 119 },
    description: "للشركات والفرق الكبيرة",
    features: [
      "كل شيء في الاحترافي",
      "موظفين غير محدودين",
      "فروع ومستودعات متعددة",
      "تقارير مالية متقدمة",
      "تكامل ERP/محاسبة",
      "مدير حساب مخصص",
      "تدريب للفريق",
      "SLA مضمون 99.9%"
    ],
    limits: { invoices: "غير محدود", catalog: "غير محدود", clients: "غير محدود", staff: "غير محدود", api: "متاح + Webhooks" },
    cta: "تواصل مع المبيعات",
    popular: false
  }
]

const faq = [
  { q: "هل يمكنني تجربة الخطة الاحترافية مجاناً؟", a: "نعم، نقدم فترة تجريبية مجانية لمدة 14 يوماً للخطة الاحترافية دون الحاجة لبطاقة ائتمان." },
  { q: "ماذا يحدث بعد انتهاء الفترة التجريبية؟", a: "ستعود حساباتك تلقائياً للخطة المجانية. بياناتك تبقى محفوظة ويمكنك الترقية في أي وقت." },
  { q: "هل الأسعار تشمل ضريبة القيمة المضافة؟", a: "الأسعار المذكورة لا تشمل ضريبة القيمة المضافة (15%)، سيتم إضافتها على الفاتورة النهائية." },
  { q: "هل يمكنني تغيير خطتي لاحقاً؟", a: "نعم، يمكنك الترقية أو تخفيض الخطة في أي وقت. التغييرات تسري فوراً مع احتساب الفروقات." },
  { q: "ما طرق الدفع المقبولة؟", a: "نقبل بطاقات مدى، فيزا، ماستركارد، آبل باي، والتحويل البنكي للاشتراكات السنوية." },
  { q: "هل بياناتي آمنة؟", a: "نعم، نستخدم تشفير AES-256 للبيانات المخزنة، وTLS 1.3 للاتصالات، والنسخ الاحتياطي اليومي المشفر." }
]

export default function PricingPage({ onBack, onSelectPlan, onGetStarted, onLogin }) {
  const [billingCycle, setBillingCycle] = useState("yearly")

  const getPrice = (plan) => (billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly)
  const getPeriod = () => (billingCycle === "yearly" ? "سنة" : "شهر")

  const limitLabels = { "الفواتير": "invoices", "الأصناف": "catalog", "العملاء": "clients", "الموظفين": "staff", "API": "api" }

  return (
    <div className="pp-root" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&display=swap');

        .pp-root {
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
        .pp-root * { box-sizing: border-box; }
        .pp-container { max-width: 1120px; margin: 0 auto; padding: 0 28px; }
        @media (max-width: 640px) { .pp-container { padding: 0 20px; } }
        button { font-family: inherit; cursor: pointer; border: none; }

        .pp-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; }
        .pp-back { display: flex; align-items: center; gap: 8px; background: transparent; color: var(--pine-deep); font-weight: 600; font-size: 0.92rem; padding: 8px 4px; }
        .pp-back svg { transform: scaleX(-1); }
        .pp-mark { font-family: 'Aref Ruqaa', serif; font-weight: 700; font-size: 1.4rem; color: var(--pine-deep); }

        .pp-hero { padding: 20px 0 52px; text-align: center; }
        .pp-hero h1 { font-size: clamp(1.9rem, 3.6vw, 2.5rem); font-weight: 700; margin: 0 0 14px; }
        .pp-hero-sub { color: #3d4a41; font-size: 1.02rem; max-width: 52ch; margin: 0 auto; }

        .pp-toggle-wrap { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-top: 28px; }
        .pp-toggle { position: relative; display: inline-flex; background: var(--paper-white); border: 1px solid var(--line); border-radius: 999px; padding: 4px; }
        .pp-toggle-indicator { position: absolute; top: 4px; bottom: 4px; inset-inline-start: 4px; width: calc(50% - 4px); background: var(--pine); border-radius: 999px; transition: inset-inline-start 0.25s ease; }
        .pp-ind-yearly { inset-inline-start: 50%; }
        .pp-toggle button { position: relative; z-index: 1; padding: 9px 22px; border-radius: 999px; background: transparent; font-weight: 600; font-size: 0.92rem; color: var(--ink); transition: color 0.2s ease; }
        .pp-toggle button.active { color: var(--paper-white); }
        .pp-save-tag { background: rgba(185,138,52,0.14); color: var(--gold); padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }

        .pp-cards-section { padding: 0 0 76px; }
        .pp-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; }
        @media (max-width: 960px) { .pp-cards-grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; } }

        .pp-card { height: 100%; display: flex; flex-direction: column; background: var(--paper-white); border: 1px solid var(--line); border-radius: 3px; padding: 28px 24px; position: relative; }
        .pp-popular { border-color: var(--pine); box-shadow: 0 18px 40px -22px rgba(22,53,39,0.4); }
        @media (min-width: 961px) { .pp-popular { margin-top: -14px; padding-top: 34px; } }

        .pp-stamp {
          position: absolute; top: -18px; left: -16px; width: 84px; height: 84px; border-radius: 50%;
          border: 2.5px solid var(--stamp); display: flex; align-items: center; justify-content: center;
          text-align: center; font-family: 'Aref Ruqaa', serif; font-weight: 700; font-size: 0.85rem; line-height: 1.15;
          color: var(--stamp); background: rgba(249,249,242,0.95); z-index: 2;
          opacity: 0; animation: ppPressIn 0.6s cubic-bezier(.2,.7,.3,1) 0.2s forwards;
        }
        .pp-stamp::before { content: ""; position: absolute; inset: 5px; border: 1px solid var(--stamp); border-radius: 50%; opacity: 0.5; }
        @keyframes ppPressIn {
          0% { opacity: 0; transform: scale(1.15) rotate(-16deg); }
          70% { opacity: 1; }
          100% { opacity: 1; transform: scale(1) rotate(-12deg); }
        }
        @media (prefers-reduced-motion: reduce) { .pp-stamp { opacity: 1; animation: none; transform: rotate(-12deg); } }

        .pp-plan-icon { width: 40px; height: 40px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; background: var(--paper); border: 1px solid var(--line); margin-bottom: 14px; }
        .pp-icon-accent { background: var(--pine); border-color: var(--pine); }
        .pp-card-head h2 { margin: 0 0 4px; font-size: 1.15rem; font-weight: 700; }
        .pp-plan-desc { margin: 0; font-size: 0.88rem; color: #5a6355; }

        .pp-price { margin: 22px 0 20px; padding-bottom: 20px; border-bottom: 1px dashed var(--line-soft); }
        .pp-price-free { font-family: 'Aref Ruqaa', serif; font-size: 1.8rem; font-weight: 700; color: var(--pine-deep); }
        .pp-price-row { display: flex; align-items: baseline; gap: 8px; }
        .pp-amount { font-size: 2.4rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink); }
        .pp-price-meta { display: flex; flex-direction: column; font-size: 0.8rem; color: #6b7568; line-height: 1.3; }
        .pp-yearly-note { margin: 8px 0 0; font-size: 0.82rem; color: #6b7568; font-variant-numeric: tabular-nums; }

        .pp-cta { width: 100%; padding: 13px; border-radius: 3px; font-weight: 600; font-size: 0.95rem; margin-bottom: 22px; transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
        .pp-cta-primary { background: var(--pine); color: var(--paper-white); }
        .pp-cta-primary:hover { background: var(--pine-deep); }
        .pp-cta-outline { background: transparent; border: 1px solid var(--line); color: var(--ink); }
        .pp-cta-outline:hover { border-color: var(--pine); color: var(--pine-deep); }

        .pp-features { list-style: none; padding: 0; margin: 0 0 22px; display: flex; flex-direction: column; gap: 10px; }
        .pp-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: #3d4a41; }
        .pp-features svg { flex-shrink: 0; margin-top: 2px; color: var(--pine); }

        .pp-limits { border-top: 1px solid var(--line-soft); padding-top: 14px; margin-top: auto; }
        .pp-limits h4 { margin: 0 0 8px; font-size: 0.78rem; font-weight: 600; color: #6b7568; }
        .pp-limit-row { display: flex; align-items: baseline; gap: 6px; padding: 5px 0; font-size: 0.85rem; }
        .pp-limit-label { color: #6b7568; flex-shrink: 0; }
        .pp-limit-dots { flex: 1; border-bottom: 1px dotted var(--line); margin-bottom: 4px; min-width: 12px; }
        .pp-limit-value { flex-shrink: 0; font-weight: 600; font-variant-numeric: tabular-nums; }

        .pp-section-header { max-width: 52ch; margin: 0 auto 36px; text-align: center; }
        .pp-section-header h2 { font-size: clamp(1.5rem, 2.6vw, 1.9rem); font-weight: 700; margin: 0 0 10px; }
        .pp-section-header p { color: #5a6355; font-size: 1rem; margin: 0; }

        .pp-faq-section { padding: 0 0 76px; }
        .pp-faq-ledger { border-top: 1.5px solid var(--ink); max-width: 760px; margin: 0 auto; }
        .pp-faq-item { border-bottom: 1px solid var(--line-soft); }
        .pp-faq-item summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 4px; cursor: pointer; font-weight: 600; font-size: 0.98rem; list-style: none; }
        .pp-faq-item summary::-webkit-details-marker { display: none; }
        .pp-faq-item p { margin: 0 4px 18px; color: #5a6355; font-size: 0.9rem; max-width: 64ch; }
        .pp-chevron { flex-shrink: 0; color: #6b7568; transition: transform 0.2s ease; }
        .pp-faq-item[open] .pp-chevron { transform: rotate(180deg); }

        .pp-cta-section { padding: 88px 0; background: var(--ink); }
        .pp-cta-inner { text-align: center; max-width: 46ch; margin: 0 auto; }
        .pp-cta-inner h2 { font-family: 'Aref Ruqaa', serif; font-size: clamp(1.8rem, 3.4vw, 2.4rem); color: var(--paper-white); margin: 0 0 14px; font-weight: 700; }
        .pp-cta-inner p { color: #b7bfad; margin: 0 0 28px; font-size: 1rem; }
        .pp-btn-gold { background: var(--gold); color: var(--ink); padding: 15px 30px; border-radius: 3px; font-weight: 600; font-size: 1.02rem; }
        .pp-btn-gold:hover { background: #a67a2c; }

        .pp-footer { padding: 26px 0 44px; text-align: center; }
        .pp-footer p { margin: 0; font-size: 0.85rem; color: #7a8172; }
      `}</style>

      <header className="pp-container pp-nav">
        <button className="pp-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          العودة للرئيسية
        </button>
        <div className="pp-mark">فواتيري</div>
      </header>

<main>
  <section className="pp-hero">
    <div className="pp-container">
      <h1>اختر الخطة المناسبة لعملك</h1>
      <p className="pp-hero-sub">
        كل الخطط تشمل فواتير غير محدودة، ومتوافقة مع هيئة الزكاة والضريبة والجمارك
      </p>

      <div className="pp-toggle-wrap">
        <div className="pp-toggle" role="radiogroup" aria-label="دورة الفوترة">
          <span
            className={`pp-toggle-indicator${
              billingCycle === "yearly" ? " pp-ind-yearly" : ""
            }`}
          />
          <button
            role="radio"
            aria-checked={billingCycle === "monthly"}
            className={billingCycle === "monthly" ? "active" : ""}
            onClick={() => setBillingCycle("monthly")}
          >
            شهرياً
          </button>
          <button
            role="radio"
            aria-checked={billingCycle === "yearly"}
            className={billingCycle === "yearly" ? "active" : ""}
            onClick={() => setBillingCycle("yearly")}
          >
            سنوياً
          </button>
        </div>
        <span className="pp-save-tag">وفر 20% مع الاشتراك السنوي</span>
      </div>
    </div>
  </section>

  <section className="pp-cards-section">
    <div className="pp-container pp-cards-grid">
      {plans.map((plan) => (
        <article
          key={plan.id}
          className={`pp-card${plan.popular ? " pp-popular" : ""}`}
        >
          {plan.popular && (
            <div className="pp-stamp">
              الخيار
              <br />
              الأفضل
            </div>
          )}

          <div className="pp-card-head">
            <div className={`pp-plan-icon${plan.popular ? " pp-icon-accent" : ""}`}>
              {plan.id === "free" && "🆓"}
              {plan.id === "pro" && "⚡"}
              {plan.id === "business" && "🏢"}
            </div>
            <h2>{plan.name}</h2>
            <p className="pp-plan-desc">{plan.description}</p>
          </div>

          <div className="pp-price">
            {getPrice(plan) === 0 ? (
              <span className="pp-price-free">مجاني</span>
            ) : (
              <div className="pp-price-row">
                <span className="pp-amount">{getPrice(plan)}</span>
                <div className="pp-price-meta">
                  <span>ر.س</span>
                  <span>/ {getPeriod()}</span>
                </div>
              </div>
            )}

            {getPrice(plan) > 0 && billingCycle === "yearly" && (
              <p className="pp-yearly-note">
                تُفوتر ر.س {getPrice(plan) * 12} سنوياً
              </p>
            )}
          </div>

          <button
            className={`pp-cta ${plan.popular ? "pp-cta-primary" : "pp-cta-outline"}`}
            onClick={() => {
              if (plan.id === "free") {
                onGetStarted?.()
              } else {
                onSelectPlan?.(plan.id)
              }
            }}
          >
            {plan.cta}
          </button>

          <ul className="pp-features">
            {plan.features.map((feature, idx) => (
              <li key={idx}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>

        <section className="pp-faq-section">
          <div className="pp-container">
            <div className="pp-section-header">
              <h2>الأسئلة الشائعة</h2>
              <p>كل ما تحتاج معرفته عن الاشتراكات</p>
            </div>
            <div className="pp-faq-ledger">
              {faq.map((item, i) => (
                <details className="pp-faq-item" key={i}>
                  <summary>
                    <span>{item.q}</span>
                    <svg className="pp-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pp-cta-section">
          <div className="pp-container pp-cta-inner">
            <h2>لا تزال متردداً؟</h2>
            <p>جرّب الخطة المجانية بلا وقت محدد، وارتقِ عند الحاجة</p>
            <div className="pp-cta-buttons" style={{display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap"}}>
              <button className="pp-btn-gold" onClick={onGetStarted}>ابدأ مجاناً الآن</button>
              <button className="pp-btn-gold" style={{background: "transparent", border: "2px solid var(--gold)", color: "var(--gold)"}} onClick={onLogin}>تسجيل الدخول</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="pp-footer">
        <div className="pp-container">
          <p>جميع الأسعار بالريال السعودي، ولا تشمل ضريبة القيمة المضافة (15٪).</p>
        </div>
      </footer>
    </div>
  )
}
