import UIKit
import WebKit

final class MainViewController: UIViewController {
    private var webView: WKWebView!
    private var bleBridge: BLEBridge!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(white: 0.93, alpha: 1.0)
        UIApplication.shared.isIdleTimerDisabled = true
        edgesForExtendedLayout = .all
        extendedLayoutIncludesOpaqueBars = true
        modalPresentationCapturesStatusBarAppearance = true
        viewRespectsSystemMinimumLayoutMargins = false

        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .default()

        let controller = WKUserContentController()
        configuration.userContentController = controller

        for scriptName in ["ios_fullscreen_fix", "native_bridge_ios"] {
            if let url = Bundle.main.url(forResource: scriptName, withExtension: "js"),
               let source = try? String(contentsOf: url, encoding: .utf8) {
                controller.addUserScript(
                    WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
                )
            }
        }

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(white: 0.93, alpha: 1.0)
        webView.scrollView.backgroundColor = UIColor(white: 0.93, alpha: 1.0)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.contentInset = .zero
        webView.scrollView.scrollIndicatorInsets = .zero
        webView.allowsBackForwardNavigationGestures = false
        webView.customUserAgent = "37TSR-DYNO-IOS/1.0"

        bleBridge = BLEBridge(webView: webView, presenter: self)
        controller.add(bleBridge, name: "iosBLE")

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        loadBundledWebApp()
    }

    private func loadBundledWebApp() {
        let candidates: [URL?] = [
            Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web"),
            Bundle.main.url(forResource: "index", withExtension: "html")
        ]
        guard let indexURL = candidates.compactMap({ $0 }).first else {
            webView.loadHTMLString(
                "<html><body style='font-family:-apple-system'><h2>37TSR Dyno</h2><p>Bundled UI missing.</p></body></html>",
                baseURL: nil
            )
            return
        }
        let access = indexURL.deletingLastPathComponent()
        webView.loadFileURL(indexURL, allowingReadAccessTo: access)
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "iosBLE")
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .allButUpsideDown }
}
