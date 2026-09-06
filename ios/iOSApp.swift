import SwiftUI

@main
struct iOSApp: App {
    var body: some Scene {
        WindowGroup {
            WebView(url: AppConfig.webAppURL)
                .ignoresSafeArea()
        }
    }
}
