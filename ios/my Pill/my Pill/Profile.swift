import Foundation
import SwiftData

struct PayMethods: Sendable {
    var bank: Bool = false
    var bankLogo: String? = nil
    var applePay: Bool = false
    var applePayPhone: String? = nil
    var applePayLogo: String? = nil
    var mastercard: Bool = false
    var mastercardLogo: String? = nil
}

extension PayMethods: Codable {
    nonisolated func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(bank, forKey: .bank)
        try c.encode(bankLogo, forKey: .bankLogo)
        try c.encode(applePay, forKey: .applePay)
        try c.encode(applePayPhone, forKey: .applePayPhone)
        try c.encode(applePayLogo, forKey: .applePayLogo)
        try c.encode(mastercard, forKey: .mastercard)
        try c.encode(mastercardLogo, forKey: .mastercardLogo)
    }

    nonisolated init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        bank = try c.decodeIfPresent(Bool.self, forKey: .bank) ?? false
        bankLogo = try c.decodeIfPresent(String.self, forKey: .bankLogo)
        applePay = try c.decodeIfPresent(Bool.self, forKey: .applePay) ?? false
        applePayPhone = try c.decodeIfPresent(String.self, forKey: .applePayPhone)
        applePayLogo = try c.decodeIfPresent(String.self, forKey: .applePayLogo)
        mastercard = try c.decodeIfPresent(Bool.self, forKey: .mastercard) ?? false
        mastercardLogo = try c.decodeIfPresent(String.self, forKey: .mastercardLogo)
    }

    private enum CodingKeys: String, CodingKey {
        case bank, bankLogo, applePay, applePayPhone, applePayLogo, mastercard, mastercardLogo
    }
}

@Model
final class Profile {
    var businessName: String
    var docType: String
    var docNumber: String
    var bankName: String
    var accountName: String
    var accountNumber: String
    var iban: String
    var phone: String
    var email: String
    var note: String
    var payMethodsData: Data

    init() {
        self.businessName = ""
        self.docType = "freelance"
        self.docNumber = ""
        self.bankName = "الراجحي أعمال"
        self.accountName = "عبدالله خليفه السعدون"
        self.accountNumber = ""
        self.iban = ""
        self.phone = ""
        self.email = ""
        self.note = ""
        self.payMethodsData = (try? JSONEncoder().encode(PayMethods())) ?? Data()
    }

    var payMethods: PayMethods {
        get { (try? JSONDecoder().decode(PayMethods.self, from: payMethodsData)) ?? PayMethods() }
        set { payMethodsData = (try? JSONEncoder().encode(newValue)) ?? Data() }
    }
}
