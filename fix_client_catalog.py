from pathlib import Path
import re

css_path = Path("web/src/index.css")

if not css_path.exists():
    raise SystemExit(f"❌ الملف غير موجود: {css_path}")

css = css_path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. نسخة احتياطية
# ---------------------------------------------------------

backup = css_path.with_suffix(".css.before-client-fix")
backup.write_text(css, encoding="utf-8")

print(f"✅ تم إنشاء نسخة احتياطية: {backup}")

# ---------------------------------------------------------
# 2. إصلاح تخطيط fa-shell
# ---------------------------------------------------------

old_shell = """        .fa-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 290px 1fr;
        }"""

new_shell = """        .fa-shell {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 290px;
          direction: rtl;
        }"""

if old_shell in css:
    css = css.replace(old_shell, new_shell)
    print("✅ تم تصحيح اتجاه fa-shell")
else:
    # محاولة بديلة إذا كان التنسيق مختلفاً
    pattern = re.compile(
        r'(\.fa-shell\s*\{\s*'
        r'min-height:\s*100vh;\s*'
        r'display:\s*grid;\s*'
        r'grid-template-columns:\s*)290px\s+1fr(\s*;)',
        re.MULTILINE
    )

    css, count = pattern.subn(
        r'\g<1>1fr 290px\2\n          direction: rtl;',
        css,
        count=1
    )

    if count:
        print("✅ تم تصحيح اتجاه fa-shell بالطريقة البديلة")
    else:
        print("ℹ️ لم يتم العثور على fa-shell المطلوب تعديله")

# ---------------------------------------------------------
# 3. إضافة CSS خاص بصفحة العميل
# ---------------------------------------------------------

marker = "/* =========================================================\n   صفحة كتالوج العميل العامة"

# منع التكرار
if marker in css:
    print("ℹ️ CSS الخاص بصفحة العميل موجود مسبقاً، سيتم استبداله")

    start = css.find(marker)

    if start >= 0:
        # نحذف القسم السابق حتى نهاية الملف
        # لأن هذا القسم أُضيف في آخر الملف بواسطة السكربت
        css = css[:start].rstrip() + "\n\n"

client_css = r"""
/* =========================================================
   صفحة كتالوج العميل العامة
   مستقلة تماماً عن لوحة التحكم والقائمة الجانبية
   ========================================================= */

.client-catalog-page {
  width: 100%;
  min-width: 0;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: var(--bg);
  direction: rtl;
  box-sizing: border-box;
}

.client-catalog-page *,
.client-catalog-page *::before,
.client-catalog-page *::after {
  box-sizing: border-box;
}

.client-catalog-header {
  width: 100%;
  margin: 0;
  padding: 2.5rem 0;
  background: #ffffff;
  border-bottom: 1px solid var(--line);
  text-align: center;
}

.client-catalog-header .container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.client-catalog-header h1 {
  margin: 0;
  color: var(--primary);
  font-size: 2rem;
  font-weight: 800;
}

.client-catalog-subtitle {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 1rem;
}

.client-catalog-main {
  width: 100%;
  min-width: 0;
  padding: 2rem 0 4rem;
}

.client-catalog-main .container {
  width: 100%;
  max-width: 1200px;
  min-width: 0;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.services-grid {
  width: 100%;
  min-width: 0;

  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(220px, 1fr)
  );

  gap: 1.25rem;
}

.service-card {
  width: 100%;
  min-width: 0;
  max-width: 100%;

  background: #ffffff;
  border: 1px solid var(--line);
  border-left: 5px solid var(--primary);

  border-radius: 14px;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.09);
}

.service-thumb {
  width: 100%;
  height: 210px;
  min-height: 210px;

  background: #eef1f4;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
}

.service-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-placeholder {
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--muted);
  font-size: 1rem;
  font-weight: 700;

  background: #eef1f4;
}

.service-info {
  width: 100%;
  min-width: 0;
  padding: 1rem 1rem 0.5rem;
}

.service-name {
  margin: 0 0 0.4rem;

  color: var(--text);
  font-size: 1.05rem;
  font-weight: 800;

  overflow-wrap: anywhere;
  word-break: break-word;
}

.service-price {
  margin: 0;

  color: var(--primary);
  font-size: 0.95rem;
  font-weight: 700;

  overflow-wrap: anywhere;
}

.service-actions {
  width: 100%;
  min-width: 0;
  padding: 0.75rem 1rem 1rem;
}

.btn-details {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  min-height: 42px;
  padding: 0.65rem 1rem;

  background: var(--primary);
  color: #ffffff;

  border-radius: 8px;

  text-decoration: none;
  font-weight: 700;

  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.btn-details:hover {
  background: var(--primary-2);
  transform: translateY(-1px);
}

.empty-state {
  width: 100%;
  max-width: 600px;

  margin: 3rem auto;
  padding: 2rem;

  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 14px;

  text-align: center;
}

.empty-state h3 {
  margin-bottom: 0.6rem;
  color: var(--text);
}

.empty-state p {
  color: var(--muted);
  line-height: 1.8;
}

.client-catalog-footer {
  width: 100%;
  padding: 1.5rem 0;

  background: #ffffff;
  border-top: 1px solid var(--line);

  color: var(--muted);
  text-align: center;
}

.client-catalog-footer .container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.client-catalog-footer p {
  margin: 0 0 0.7rem;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* =========================================================
   الهاتف
   ========================================================= */

@media (max-width: 768px) {

  .client-catalog-header {
    padding: 1.8rem 0;
  }

  .client-catalog-header .container,
  .client-catalog-main .container,
  .client-catalog-footer .container {
    padding-left: 0.8rem;
    padding-right: 0.8rem;
  }

  .client-catalog-header h1 {
    font-size: 1.6rem;
  }

  .client-catalog-main {
    padding-top: 1.2rem;
  }

  .services-grid {
    grid-template-columns: repeat(
      2,
      minmax(0, 1fr)
    );

    gap: 0.75rem;
  }

  .service-thumb {
    height: 150px;
    min-height: 150px;
  }

  .service-info {
    padding: 0.75rem 0.7rem 0.3rem;
  }

  .service-name {
    font-size: 0.9rem;
  }

  .service-price {
    font-size: 0.82rem;
  }

  .service-actions {
    padding: 0.5rem 0.7rem 0.7rem;
  }

  .btn-details {
    min-height: 38px;
    padding: 0.5rem 0.6rem;
    font-size: 0.82rem;
  }
}

@media (max-width: 480px) {

  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-thumb {
    height: 190px;
    min-height: 190px;
  }

  .service-name {
    font-size: 1rem;
  }

  .service-price {
    font-size: 0.9rem;
  }
}
"""

css = css.rstrip() + "\n" + client_css

# ---------------------------------------------------------
# 4. حفظ
# ---------------------------------------------------------

css_path.write_text(css, encoding="utf-8")

print("✅ تم تعديل web/src/index.css")
print()
print("الآن نفّذ:")
print("  cd web")
print("  npm run build")
print()
print("إذا نجح البناء، شغّل التطبيق واختبر صفحة العميل.")
