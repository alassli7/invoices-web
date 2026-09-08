import SwiftUI

/// شاشة «نسيت كلمة المرور» — توجيه وتعليمات.
/// لا توجد آلية استعادة بالبريد في هذه النسخة؛ بعد التحقق تُظهر طريقة التواصل.
struct ForgotPasswordView: View {
    @Environment(\.dismiss) private var dismiss

    private let brand = Color(red: 0.12, green: 0.43, blue: 0.33)

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "key.questionmark")
                    .font(.system(size: 64))
                    .foregroundStyle(brand)
                    .symbolRenderingMode(.hierarchical)

                Text("نسيت كلمة المرور")
                    .font(.title.bold())

                VStack(alignment: .trailing, spacing: 12) {
                    infoRow(icon: "person.crop.circle.badge.exclamationmark",
                            text: "كلمة المرور محفوظة بشكل آمن لكل حساب داخل النظام.")
                    infoRow(icon: "envelope.badge.shield.half.filled",
                            text: "لا يوجد نظام استعادة عبر البريد في النسخة الحالية.")
                    infoRow(icon: "exclamationmark.triangle.fill",
                            text: "لإعادة تعيين كلمة المرور، تواصل مع دعم النظام وأرفق اسم المستخدم.")
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 8)

                Button {
                    dismiss()
                } label: {
                    Text("رجوع إلى الدخول")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(brand)

                Spacer()
            }
            .padding(24)
            .navigationTitle("نسيت كلمة المرور")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("إغلاق") { dismiss() }
                }
            }
        }
    }

    private func infoRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(brand)
                .frame(width: 24)
            Text(text)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .multilineTextAlignment(.trailing)
        }
    }
}
