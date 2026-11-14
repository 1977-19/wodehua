import UIKit
import WebKit
import Photos
import ReplayKit
import ObjectiveC

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.backgroundColor = UIColor(red: 0.06, green: 0.10, blue: 0.31, alpha: 1)
        w.rootViewController = GameViewController()
        w.makeKeyAndVisible()
        window = w
        return true
    }

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return .landscape
    }
}

final class GameViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var web: WKWebView!

    override var prefersStatusBarHidden: Bool { return true }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { return .landscape }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .all }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.06, green: 0.10, blue: 0.31, alpha: 1)

        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        let uc = WKUserContentController()
        uc.add(self, name: "native")
        uc.addUserScript(WKUserScript(source: "window.__native = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        cfg.userContentController = uc
        GameViewController.unlockHighFrameRate(cfg.preferences)

        let wv = WKWebView(frame: view.bounds, configuration: cfg)
        wv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        wv.isOpaque = false
        wv.backgroundColor = .clear
        wv.scrollView.isScrollEnabled = false
        wv.scrollView.bounces = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.navigationDelegate = self
        if #available(iOS 16.4, *) { wv.isInspectable = true }
        view.addSubview(wv)
        web = wv

        if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
            wv.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }

    /// WKWebView normally holds requestAnimationFrame at 60 Hz even on 120 Hz screens. Lift that where the system allows it.
    static func unlockHighFrameRate(_ prefs: WKPreferences) {
        let featuresSel = NSSelectorFromString("_features")
        let setSel = NSSelectorFromString("_setEnabled:forFeature:")
        guard WKPreferences.responds(to: featuresSel), prefs.responds(to: setSel) else { return }
        guard let unmanaged = (WKPreferences.self as AnyObject).perform(featuresSel) else { return }
        guard let feats = unmanaged.takeUnretainedValue() as? [NSObject] else { return }
        guard let method = class_getInstanceMethod(WKPreferences.self, setSel) else { return }
        typealias SetFn = @convention(c) (AnyObject, Selector, Bool, AnyObject) -> Void
        let fn = unsafeBitCast(method_getImplementation(method), to: SetFn.self)
        let keySel = NSSelectorFromString("key")
        for f in feats {
            guard f.responds(to: keySel), let key = f.value(forKey: "key") as? String else { continue }
            if key == "PreferPageRenderingUpdatesNear60FPSEnabled" { fn(prefs, setSel, false, f) }
        }
    }

    // MARK: bridge

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let cmd = body["cmd"] as? String else { return }
        switch cmd {
        case "photo":
            if let s = body["data"] as? String { savePhoto(s) }
        case "recStart":
            startRecording()
        case "recStop":
            stopRecording()
        case "haptic":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        default:
            break
        }
    }

    private func js(_ what: String, _ ok: Bool, _ msg: String) {
        let script = "window.Native && Native.done('\(what)', \(ok ? "true" : "false"), '\(msg)')"
        DispatchQueue.main.async { self.web.evaluateJavaScript(script, completionHandler: nil) }
    }

    private func withAlbum(_ what: String, _ work: @escaping () -> Void) {
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            if status == .authorized || status == .limited { work() }
            else { self.js(what, false, "没有相册权限，请到系统设置里允许“添加照片”") }
        }
    }

    private func savePhoto(_ dataURL: String) {
        guard let comma = dataURL.firstIndex(of: ","),
              let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
              let image = UIImage(data: data) else {
            js("photo", false, "图片数据无效")
            return
        }
        withAlbum("photo") {
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }, completionHandler: { ok, _ in
                self.js("photo", ok, ok ? "" : "照片没有保存下来")
            })
        }
    }

    private func startRecording() {
        let recorder = RPScreenRecorder.shared()
        guard recorder.isAvailable else {
            js("recStart", false, "这台设备现在不能录屏")
            return
        }
        recorder.isMicrophoneEnabled = false
        recorder.startRecording { error in
            self.js("recStart", error == nil, error == nil ? "" : "没有得到录屏许可")
        }
    }

    private func stopRecording() {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("huazhong-\(Int(Date().timeIntervalSince1970)).mp4")
        RPScreenRecorder.shared().stopRecording(withOutput: url) { error in
            if error != nil {
                self.js("recStop", false, "录像没有保存下来")
                return
            }
            self.withAlbum("recStop") {
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
                }, completionHandler: { ok, _ in
                    try? FileManager.default.removeItem(at: url)
                    self.js("recStop", ok, ok ? "" : "录像没有保存下来")
                })
            }
        }
    }

    // MARK: links open in Safari

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url, let scheme = url.scheme, scheme.hasPrefix("http") {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }
}
