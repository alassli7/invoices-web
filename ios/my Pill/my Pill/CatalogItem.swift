import Foundation
import SwiftData

@Model
final class CatalogItem {
    var desc: String
    var price: Double
    var qty: Double

    init(desc: String, price: Double, qty: Double = 1) {
        self.desc = desc
        self.price = price
        self.qty = qty
    }
}
