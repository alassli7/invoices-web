import SwiftUI

/// نظام تصميم موحّد — ألوان ومكوّنات تنطبق على جميع الواجهات
/// لتطابق واجهة تسجيل الدخول (تأثير ثلاثي الأبعاد وألوان خضراء).
enum AppTheme {
    static let dark = Color(red: 0.05, green: 0.14, blue: 0.12)
    static let brand = Color(red: 0.12, green: 0.43, blue: 0.33)
    static let brandLight = Color(red: 0.20, green: 0.55, blue: 0.42)
    static let gold = Color(red: 0.95, green: 0.78, blue: 0.25)

    
    static let gradient = LinearGradient(
        colors: [brand, brandLight],
        startPoint: .leading,
        endPoint: .trailing
    )
}

/// خلفية خضراء ناعمة للشاشات الأربع (مطابقة لخلفية الدخول لكن أفتح للنصوص).
struct AppBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [AppTheme.brandLight.opacity(0.18), AppTheme.brand.opacity(0.08)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(AppTheme.brand.opacity(0.08))
                .frame(width: 300, height: 300)
                .blur(radius: 40)
                .offset(x: 160, y: -220)
            Circle()
                .fill(AppTheme.gold.opacity(0.08))
                .frame(width: 260, height: 260)
                .blur(radius: 50)
                .offset(x: -150, y: 320)
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}

/// رأس زجاجي (ثلجي) موحّد لكل الواجهات — مطابق للوحة إعدادات النشاط.
struct AppGlassHeader: View {
    let title: String
    let subtitle: String
    let icon: String

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(AppTheme.gold)
                    .frame(width: 36)
                VStack(alignment: .trailing, spacing: 2) {
                    Text(title)
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(.white.opacity(0.85))
                }
                Spacer()
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .trailing)
            .background(
                LinearGradient(colors: [AppTheme.brand, AppTheme.brandLight],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .overlay(alignment: .topLeading) {
                Circle().fill(.white.opacity(0.18))
                    .frame(width: 120, height: 120).offset(x: -30, y: -50)
            }
            .clipShape(RoundedRectangle(cornerRadius: 22))
            .shadow(color: AppTheme.brand.opacity(0.35), radius: 18, y: 8)
        }
    }
}

/// غلاف الشاشة: يستخدم نفسه في كل التبويبات.
struct AppScreen<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        ZStack {
            AppBackground()
            content
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}

/// بطاقة موحّدة (بيضاء، ظل ثلاثي الأبعاد).
struct AppCard<Content: View>: View {
    var padding: CGFloat = 16
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .trailing)
            .background(.white, in: RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.10), radius: 12, y: 6)
    }
}

/// حقل إدخال ثلاثي الأبعاد بأيقونة — مطابق لحقول تسجيل الدخول.
struct AppField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var isSecure = false
    var keyboard: UIKeyboardType = .default

    @State private var show = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 17))
                .foregroundStyle(AppTheme.brand)
                .frame(width: 24)
            Group {
                if isSecure && !show {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .frame(maxWidth: .infinity, alignment: .trailing)
            .environment(\.layoutDirection, .rightToLeft)
            if isSecure {
                Button {
                    show.toggle()
                } label: {
                    Image(systemName: show ? "eye.slash.fill" : "eye.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(
            LinearGradient(colors: [Color(.systemGray6), Color(.systemGray5)],
                           startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 14)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(AppTheme.brand.opacity(0.25), lineWidth: 1.2)
        )
        .shadow(color: .white.opacity(0.6), radius: 0, y: 1)
        .shadow(color: .black.opacity(0.06), radius: 4, y: 3)
    }
}

/// زر رئيسي أخضر بتدرّج — مطابق لزر الدخول.
struct AppPrimaryButton: View {
    var title: String
    var icon: String = "checkmark"
    var disabled = false
    var busy = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(AppTheme.gradient)
                HStack(spacing: 8) {
                    if busy {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: icon)
                        Text(title).font(.headline)
                    }
                }
                .foregroundStyle(.white)
            }
            .frame(height: 52)
        }
        .buttonStyle(.plain)
        .disabled(disabled || busy)
        .opacity(disabled || busy ? 0.5 : 1)
    }
}

/// عنوان قسم بأسلوب مطابق للدخول.
struct AppSectionTitle: View {
    let text: String
    var body: some View {
        HStack(spacing: 8) {
            Text(text).font(.headline).foregroundStyle(AppTheme.dark)
            Rectangle().fill(AppTheme.gradient).frame(height: 3)
        }
    }
}

/// شارة/بلّة ملوّنة.
struct AppPill: View {
    let text: String
    let color: Color
    var body: some View {
        Text(text)
            .font(.caption.bold())
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(color.opacity(0.14), in: Capsule())
            .foregroundStyle(color)
    }
}
