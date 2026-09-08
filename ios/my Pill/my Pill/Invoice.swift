import Foundation
import SwiftData

struct InvoiceItem: Codable, Identifiable {
    var id = UUID()
    var desc: String
    var qty: Double
    var price: Double
    var cancelled: Bool = false

    var total: Double { cancelled ? 0 : qty * price }
}

@Model
final class Invoice {
    var number: String
    var clientName: String
    var clientPhone: String
    var clientEmail: String
    var date: Date
    var statusRaw: String
    var itemsData: Data

    init(
        number: String,
        clientName: String = "",
        clientPhone: String = "",
        clientEmail: String = "",
        date: Date = Date(),
        status: String = "unpaid",
        items: [InvoiceItem] = []
    ) {
        self.number = number
        self.clientName = clientName
        self.clientPhone = clientPhone
        self.clientEmail = clientEmail
        self.date = date
        self.statusRaw = status
        self.itemsData = (try? JSONEncoder().encode(items)) ?? Data()
    }

    var items: [InvoiceItem] {
        get { (try? JSONDecoder().decode([InvoiceItem].self, from: itemsData)) ?? [] }
        set { itemsData = (try? JSONEncoder().encode(newValue)) ?? Data() }
    }

    var status: String {
        get { statusRaw }
        set { statusRaw = newValue }
    }

    var subtotal: Double { items.reduce(0) { $0 + $1.total } }

    var isPaid: Bool { status == "paid" }
    var isRefunded: Bool { status == "refunded" }

    var statusLabel: String {
        isPaid ? "مدفوعة" : (isRefunded ? "مُلغاة" : "مستحقة")
    }
}
