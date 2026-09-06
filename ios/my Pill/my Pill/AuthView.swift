import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var isRegister = false
    @State private var username = ""
    @State private var password = ""
    @State private var businessName = ""
    @State private var docType = "freelance"
    @State private var docNumber = ""
    @State private var busy = false
    @State private var errorMsg = ""
    @State private var showReset = false
    @State private var showPassword = false

    private let dark = Color(red: 0.05, green: 0.14, blue: 0.12)
    private let brand = Color(red: 0.12, green: 0.43, blue: 0.33)
    private let brandLight = Color(red: 0.20, green: 0.55, blue: 0.42)
    private let gold = Color(red: 0.95, green: 0.78, blue: 0.25)

    var body: some View {
        ZStack {
            background

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    Spacer(minLength: 20)
                    header
                    card
                    if isRegister { registerExtra }
                    submitButton
                    footerLink
                }
                .padding(.horizontal, 26)
                .padding(.bottom, 30)
                .frame(maxWidth: .infinity)
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .sheet(isPresented: $showReset) {
            ForgotPasswordView()
        }
    }

    private var background: some View {
        ZStack {
            LinearGradient(
                colors: [dark, brand, brandLight],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(gold.opacity(0.12))
                .frame(width: 300, height: 300)
                .blur(radius: 40)
                .offset(x: -150, y: -250)
            Circle()
                .fill(brandLight.opacity(0.3))
                .frame(width: 260, height: 260)
                .blur(radius: 50)
                .offset(x: 150, y: 300)
        }
    }

    private var header: some View {
        VStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 26)
                    .fill(.white.opacity(0.14))
                    .frame(width: 96, height: 96)
                Image(systemName: "doc.text.fill")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundStyle(gold)
            }

            Text("فواتيري")
                .font(.system(size: 34, weight: .heavy))
                .foregroundStyle(.white)

            HStack(spacing: 6) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(gold)
                Text("إصدار الفواتير باحترافية وسرعة")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
    }

    // MARK: بطاقة الدخول

    private var card: some View {
        VStack(spacing: 18) {
            segmentedControl

            VStack(spacing: 14) {
                inputField(icon: "person.fill", placeholder: "اسم المستخدم", text: $username)

                HStack(spacing: 12) {
                    inputField(icon: isRegister ? "lock.square" : "lock.fill",
                               placeholder: "كلمة المرور", text: $password, isSecure: !showPassword)
                    eyeButton
                }

                if isRegister {
                    inputField(icon: "building.2.fill", placeholder: "اسم النشاط", text: $businessName)
                    docPicker
                }
            }

            if !isRegister {
                HStack {
                    Spacer()
                    Button {
                        showReset = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "questionmark.circle.fill")
                            Text("نسيت كلمة المرور؟")
                        }
                        .font(.footnote.bold())
                        .foregroundStyle(brand)
                    }
                }
            }

            if !errorMsg.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(errorMsg)
                        .font(.footnote)
                }
                .foregroundStyle(.red)
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(20)
        .background(.white, in: RoundedRectangle(cornerRadius: 24))
        .shadow(color: .black.opacity(0.25), radius: 24, y: 12)
    }

    private var segmentedControl: some View {
        HStack(spacing: 4) {
            segment(title: "دخول", icon: "person.badge.key.fill", isOn: !isRegister) {
                withAnimation(.easeInOut(duration: 0.2)) { isRegister = false; errorMsg = "" }
            }
            segment(title: "نشاط جديد", icon: "plus.circle.fill", isOn: isRegister) {
                withAnimation(.easeInOut(duration: 0.2)) { isRegister = true; errorMsg = "" }
            }
        }
        .padding(5)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
    }

    private func segment(title: String, icon: String, isOn: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                Text(title)
                    .font(.footnote.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 9)
            .background(isOn ? AnyShapeStyle(Color.white) : AnyShapeStyle(Color.clear))
            .clipShape(RoundedRectangle(cornerRadius: 11))
            .shadow(color: isOn ? .black.opacity(0.08) : .clear, radius: 4, y: 2)
            .foregroundStyle(isOn ? brand : .secondary)
        }
        .buttonStyle(.plain)
    }

    // MARK: حقول الإدخال

    private func inputField(icon: String, placeholder: String, text: Binding<String>, isSecure: Bool = false) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 17))
                .foregroundStyle(brand)
                .frame(width: 22)
            Group {
                if isSecure {
                    SecureField(placeholder, text: text)
                } else {
                    TextField(placeholder, text: text)
                }
            }
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }
        .padding(14)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.gray.opacity(0.15), lineWidth: 1))
    }

    private var eyeButton: some View {
        Button {
            showPassword.toggle()
        } label: {
            Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                .foregroundStyle(.secondary)
                .frame(width: 20)
        }
        .buttonStyle(.plain)
        .padding(8)
    }

    private var docPicker: some View {
        HStack(spacing: 12) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 17))
                .foregroundStyle(brand)
                .frame(width: 22)
            Picker("نوع الوثيقة", selection: $docType) {
                Text("وثيقة العمل الحر").tag("freelance")
                Text("رقم الشركة (CR)").tag("cr")
            }
            .tint(brand)
            .pickerStyle(.menu)
            Spacer()
        }
        .padding(14)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.gray.opacity(0.15), lineWidth: 1))
    }

    private var registerExtra: some View {
        VStack(alignment: .trailing, spacing: 8) {
            inputField(icon: "number", placeholder: "رقم الوثيقة", text: $docNumber)
                .padding(.top, 2)
        }
    }

    // MARK: زر الإرسال

    private var submitButton: some View {
        Button {
            Task { await submit() }
        } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(LinearGradient(colors: [brand, brandLight],
                                         startPoint: .leading, endPoint: .trailing))
                HStack(spacing: 10) {
                    Group {
                        if busy {
                            ProgressView().tint(.white)
                        } else {
                            Image(systemName: isRegister ? "arrow.right.circle.fill" : "key.fill")
                            Text(isRegister ? "إنشاء النشاط" : "دخول")
                                .font(.headline)
                        }
                    }
                    .foregroundStyle(.white)
                }
            }
            .frame(height: 56)
        }
        .buttonStyle(.plain)
        .disabled(busy || username.isEmpty || password.isEmpty ||
                  (isRegister && businessName.isEmpty))
        .opacity((busy || username.isEmpty || password.isEmpty ||
                  (isRegister && businessName.isEmpty)) ? 0.5 : 1)
    }

    private var footerLink: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.2)) { isRegister.toggle(); errorMsg = "" }
        } label: {
            HStack(spacing: 6) {
                Text(isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟")
                    .foregroundStyle(.white.opacity(0.8))
                Text(isRegister ? "دخول" : "أنشئ نشاطاً مجاناً")
                    .fontWeight(.bold)
                    .foregroundStyle(gold)
            }
            .font(.subheadline)
        }
        .buttonStyle(.plain)
    }

    // MARK: منطق الدخول

    private func submit() async {
        busy = true
        errorMsg = ""
        defer { busy = false }
        do {
            let id: String
            if isRegister {
                id = try await session.client.register(
                    username: username,
                    password: password,
                    businessName: businessName,
                    docType: docType,
                    docNumber: docNumber
                )
            } else if let logged = try await session.client.login(
                username: username, password: password
            ) {
                id = logged
            } else {
                errorMsg = "اسم المستخدم أو كلمة المرور غير صحيحة"
                return
            }
            session.businessID = id
        } catch {
            errorMsg = errorMessage(error)
        }
    }
}
