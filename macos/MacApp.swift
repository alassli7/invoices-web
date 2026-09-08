import SwiftUI

@main
struct MacApp: App {
    var body: some Scene {
        WindowGroup {
            WebView(url: AppConfig.webAppURL)
                .frame(minWidth: 900, minHeight: 650)
                .navigationTitle("تطبيقي الشامل")
        }
        .windowResizability(.contentSize)
    }
}
