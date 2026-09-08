import SwiftUI
import SwiftData
import PhotosUI

struct SettingsView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var businessName = ""
    @State private var docType = "freelance"
    @State private var docNumber = ""
    @State private var freelanceLogo = ""
    @State private var companyLogo = ""
    @State private var bankName = ""
    @State private var accountName = ""
    @State private var accountNumber = ""
    @State private var iban = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var note = ""
    @State private var bankEnabled = false
    @State private var applePayEnabled = false
    @State private var applePayPhone = ""
    @State private var mastercardEnabled = false
    @State private var bankLogo = ""
    @State private var applePayLogo = ""
    @State private var mastercardLogo = ""
    @State private var taxNumber = ""
    @State private var vatRate = 0
    @State private var loading = true
    @State private var saved = false
    @State private var errorMsg: String?

    var body: some View {
        NavigationStack {
            AppScreen {
                ScrollView {
                    VStack(spacing: 20) {
                        if loading {
                            ProgressView("جارٍ التحميل…")
                                .padding(.top, 60)
                        } else {
                            AppGlassHeader(
                                title: "لوحة إعدادات النشاط",
                                subtitle: "هوية النشاط والشعارات وطرق الدفع",
                                icon: "gearshape.2.fill"
                            )
                            logosCard
                            identityCard
                            bankCard
                            taxCard
                            payCard
                            contactCard
                            errorCard
                            AppPrimaryButton(title: "حفظ البيانات", icon: "checkmark.circle.fill") {
                                Task { await save() }
                            }
                        }
                    }
                    .padding()
                }
                .refreshable { await load() }
            }
            .navigationTitle("إعدادات النشاط")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
            .alert("تم حفظ البيانات", isPresented: $saved) { Button("حسناً") {} }
        }
        .task { await load() }
    }

    private var identityCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "الهوية")
                AppField(icon: "building.2.fill", placeholder: "اسم النشاط", text: $businessName)
                docTypePicker
                AppField(icon: "number", placeholder: "رقم الوثيقة", text: $docNumber)
            }
        }
    }

    private var docTypePicker: some View {
        HStack(spacing: 12) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 17))
                .foregroundStyle(AppTheme.brand)
                .frame(width: 24)
            Picker("نوع الوثيقة", selection: $docType) {
                Text("وثيقة العمل الحر").tag("freelance")
                Text("رقم الشركة (CR)").tag("cr")
            }
            .pickerStyle(.menu)
            .tint(AppTheme.brand)
            Spacer()
        }
        .padding(14)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppTheme.brand.opacity(0.25), lineWidth: 1.2))
    }

    // قسم الشعارات: شعار الجهة/العمل الحر وشعار الشركة.
    private var logosCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "الشعارات")
                LogoPicker(
                    title: "شعار الجهة / العمل الحر (يسار الفاتورة)",
                    icon: "building.2.fill",
                    dataURL: $freelanceLogo
                )
                LogoPicker(
                    title: "شعار الشركة / المشروع (يمين الفاتورة)",
                    icon: "building.columns.fill",
                    dataURL: $companyLogo
                )
            }
        }
    }

    private var bankCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "بيانات البنك")
                AppField(icon: "banknote.fill", placeholder: "اسم البنك", text: $bankName)
                AppField(icon: "person.fill", placeholder: "اسم المستفيد", text: $accountName)
                AppField(icon: "number", placeholder: "رقم الحساب", text: $accountNumber)
                AppField(icon: "creditcard.fill", placeholder: "الآيبان (IBAN)", text: $iban)
            }
            
        }
    }

    private var taxCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "الضريبة (VAT)")
                AppField(icon: "flag.checkered", placeholder: "الرقم الضريبي (اختياري)", text: $taxNumber, keyboard: .asciiCapable)
                HStack(spacing: 12) {
                    Image(systemName: "percent")
                        .font(.system(size: 17))
                        .foregroundStyle(AppTheme.brand)
                        .frame(width: 24)
                    Picker("نسبة الضريبة", selection: $vatRate) {
                        Text("لا ضريبة").tag(0)
                        Text("15%").tag(15)
                        Text("5%").tag(5)
                    }
                    .pickerStyle(.menu)
                    .tint(AppTheme.brand)
                    Spacer()
                }
                .padding(14)
                .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppTheme.brand.opacity(0.25), lineWidth: 1.2))
                if !taxNumber.trimmingCharacters(in: .whitespaces).isEmpty && vatRate > 0 {
                    Text("سيتم تطبيق ضريبة \(vatRate)% تلقائياً على الفواتير الجديدة.")
                        .font(.footnote)
                        .foregroundStyle(AppTheme.brand)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
            }
        }
    }

    private var payCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 12) {
                AppSectionTitle(text: "طرق الدفع المتاحة")

                ToggleRow(title: "تحويل بنكي (\(bankName))", icon: "building.columns.fill", isOn: $bankEnabled)
                if bankEnabled {
                    LogoPicker(title: "شعار التحويل البنكي", icon: "banknote.fill", dataURL: $bankLogo)
                }

                ToggleRow(title: "Apple Pay", icon: "apple.logo", isOn: $applePayEnabled)
                if applePayEnabled {
                    AppField(icon: "iphone", placeholder: "رقم الجوال لـ Apple Pay", text: $applePayPhone, keyboard: .phonePad)
                    LogoPicker(title: "شعار Apple Pay", icon: "apple.logo", dataURL: $applePayLogo)
                }

                ToggleRow(title: "بطاقة Mastercard", icon: "creditcard", isOn: $mastercardEnabled)
                if mastercardEnabled {
                    LogoPicker(title: "شعار Mastercard", icon: "creditcard.fill", dataURL: $mastercardLogo)
                }
            }
        }
    }

    private var contactCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "التواصل وتنويه الضريبة")
                AppField(icon: "phone.fill", placeholder: "الجوال", text: $phone, keyboard: .phonePad)
                AppField(icon: "envelope.fill", placeholder: "البريد الإلكتروني", text: $email, keyboard: .emailAddress)
                AppField(icon: "text.quote", placeholder: "تنويه الضريبة", text: $note)
            }
            
        }
    }

    @ViewBuilder
    private var errorCard: some View {
        if let errorMsg {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                Text(errorMsg).font(.footnote)
            }
            .foregroundStyle(.red)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .trailing)
            .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        guard let bid = session.businessID else { return }
        do {
            guard let biz = try await session.client.getBusiness(id: bid) else { return }
            businessName = biz["businessName"] as? String ?? ""
            docType = biz["docType"] as? String ?? "freelance"
            docNumber = biz["docNumber"] as? String ?? ""
            bankName = biz["bankName"] as? String ?? ""
            accountName = biz["accountName"] as? String ?? ""
            accountNumber = biz["accountNumber"] as? String ?? ""
            iban = biz["iban"] as? String ?? ""
            phone = biz["phone"] as? String ?? ""
            email = biz["email"] as? String ?? ""
            note = biz["note"] as? String ?? ""
            freelanceLogo = biz["freelanceLogo"] as? String ?? ""
            companyLogo = biz["companyLogo"] as? String ?? ""
            if let pm = biz["payMethods"] as? [String: Any] {
                bankEnabled = pm["bank"] as? Bool ?? false
                applePayEnabled = pm["applePay"] as? Bool ?? false
                applePayPhone = pm["applePayPhone"] as? String ?? ""
                mastercardEnabled = pm["mastercard"] as? Bool ?? false
                bankLogo = pm["bankLogo"] as? String ?? ""
                applePayLogo = pm["applePayLogo"] as? String ?? ""
                mastercardLogo = pm["mastercardLogo"] as? String ?? ""
                taxNumber = pm["taxNumber"] as? String ?? ""
                vatRate = (pm["vatRate"] as? NSNumber)?.intValue ?? 0
            }
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func save() async {
        guard let bid = session.businessID else { return }
        let row: SupaClient.Row = [
            "id": bid,
            "businessName": businessName,
            "docType": docType,
            "docNumber": docNumber,
            "freelanceLogo": freelanceLogo,
            "companyLogo": companyLogo,
            "bankName": bankName,
            "accountName": accountName,
            "accountNumber": accountNumber,
            "iban": iban,
            "phone": phone,
            "email": email,
            "note": note,
            "payMethods": [
                "bank": bankEnabled,
                "bankLogo": bankEnabled ? bankLogo : "",
                "applePay": applePayEnabled,
                "applePayPhone": applePayEnabled ? applePayPhone : "",
                "applePayLogo": applePayEnabled ? applePayLogo : "",
                "mastercard": mastercardEnabled,
                "mastercardLogo": mastercardEnabled ? mastercardLogo : "",
                "taxNumber": taxNumber.trimmingCharacters(in: .whitespaces),
                "vatRate": vatRate
            ]
        ]
        do {
            try await session.client.upsertBusiness(row)
            saved = true
        } catch {
            errorMsg = errorMessage(error)
        }
    }
}

/// صف تبديل بأيقونة على يسار العنوان (RTL).
struct ToggleRow: View {
    let title: String
    let icon: String
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 17))
                .foregroundStyle(AppTheme.brand)
                .frame(width: 24)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(AppTheme.dark)
            Spacer()
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(AppTheme.brand)
        }
        .padding(10)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
    }
}

/// منتقي شعار من معرض الصور — يحوّل الصورة إلى سلسلة Base64 data URL (كما في الويب).
struct LogoPicker: View {
    let title: String
    let icon: String
    @Binding var dataURL: String

    @State private var item: PhotosPickerItem?

    var body: some View {
        VStack(alignment: .trailing, spacing: 8) {
            HStack(spacing: 10) {
                PhotosPicker(selection: $item, matching: .images) {
                    Label("اختيار صورة", systemImage: "photo.badge.plus")
                        .font(.subheadline.bold())
                        .foregroundStyle(AppTheme.brand)
                }
                Spacer()
                Text(title)
                    .font(.footnote)
                    .foregroundStyle(AppTheme.dark)
                Image(systemName: icon)
                    .foregroundStyle(AppTheme.brand)
                    .frame(width: 22)
            }
            .padding(10)
            .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))

            if let img = decodedImage {
                HStack(spacing: 10) {
                    Image(uiImage: img)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(AppTheme.brand.opacity(0.3), lineWidth: 1))
                    Spacer()
                    Button(role: .destructive) {
                        dataURL = ""
                    } label: {
                        Image(systemName: "trash")
                    }
                    .buttonStyle(.bordered)
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
        .onChange(of: item) { _, newItem in
            guard let newItem else { return }
            Task {
                if let data = try? await newItem.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    dataURL = Self.dataURL(for: image)
                }
                item = nil
            }
        }
    }

    private var decodedImage: UIImage? {
        guard let data = Data(base64Encoded: dataURLBase64) else { return nil }
        return UIImage(data: data)
    }
    private var dataURLBase64: String {
        guard let comma = dataURL.firstIndex(of: ",") else {
            return dataURL.replacingOccurrences(of: "data:image/png;base64,", with: "")
        }
        return String(dataURL[dataURL.index(after: comma)...])
    }

    static func dataURL(for image: UIImage) -> String {
        let resized = image.jpegData(compressionQuality: 0.7)
            ?? (image.pngData())
        guard let data = resized else { return "" }
        return "data:image/jpeg;base64,\(data.base64EncodedString())"
    }
}
