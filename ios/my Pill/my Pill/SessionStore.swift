import Foundation
import SwiftUI
import Combine

/// يستخرج نصاً مقروءاً من خطأ.
func errorMessage(_ error: Error) -> String {
    if let supa = error as? SupaError {
        return supa.errorDescription ?? "خطأ"
    }
    return error.localizedDescription
}

/// يحفظ جلسة النشاط الحالية (id) — مساوٍ لـ localStorage في تطبيق الويب.
@MainActor
final class SessionStore: ObservableObject {
    @Published var businessID: String? {
        didSet { UserDefaults.standard.set(businessID, forKey: "sessionID") }
    }

    let client = SupaClient()

    init() {
        self.businessID = UserDefaults.standard.string(forKey: "sessionID")
    }

    func logout() {
        businessID = nil
    }

    var isLoggedIn: Bool { businessID != nil }
}
