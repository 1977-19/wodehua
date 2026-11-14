package com.huazhong.manbu;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Display;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/** Full-screen landscape shell around the game page, with photo and film saving to the gallery. */
public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> fileCb;
    private File recFile;
    private FileOutputStream recOut;
    private String recMime = "video/mp4";

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        try {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            // ask for the panel's fastest refresh rate (90 / 120 / 144 Hz)
            Display d = getWindowManager().getDefaultDisplay();
            Display.Mode best = d.getMode();
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() == best.getPhysicalWidth() && m.getPhysicalHeight() == best.getPhysicalHeight() && m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            lp.preferredDisplayModeId = best.getModeId();
            w.setAttributes(lp);
        } catch (Throwable ignored) { }

        web = new WebView(this);
        setContentView(web);
        hideBars();
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        web.setBackgroundColor(0xFF0F1A50);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(), "AndroidNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("http".equals(u.getScheme()) || "https".equals(u.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Throwable ignored) { }
                    return true;
                }
                return false;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "audio/*", "video/*" });
                try {
                    startActivityForResult(Intent.createChooser(i, "选择音乐"), 7);
                } catch (Throwable t) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 7 && fileCb != null) {
            Uri[] res = (resultCode == RESULT_OK && data != null && data.getData() != null) ? new Uri[] { data.getData() } : null;
            fileCb.onReceiveValue(res);
            fileCb = null;
        }
    }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); hideBars(); }

    @Override
    public void onBackPressed() { web.evaluateJavascript("window.UI&&UI.closeAll()", null); }

    private void done(final String what, final boolean ok, final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() { web.evaluateJavascript("window.Native&&Native.done('" + what + "'," + ok + ",'" + msg + "')", null); }
        });
    }

    private final class Bridge {
        @JavascriptInterface
        public void savePhoto(final String dataUrl) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    boolean ok = false;
                    try {
                        byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
                        ContentValues cv = new ContentValues();
                        cv.put(MediaStore.Images.Media.DISPLAY_NAME, "huazhong-" + System.currentTimeMillis() + ".jpg");
                        cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                        cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/HuaZhongManBu");
                        Uri u = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                        OutputStream os = getContentResolver().openOutputStream(u);
                        os.write(bytes);
                        os.close();
                        ok = true;
                    } catch (Throwable ignored) { }
                    done("photo", ok, ok ? "" : "照片没有保存下来");
                }
            }).start();
        }

        @JavascriptInterface
        public void recBegin(String mime) {
            try {
                recMime = mime;
                recFile = new File(getCacheDir(), "rec-" + System.currentTimeMillis());
                recOut = new FileOutputStream(recFile);
            } catch (Throwable t) { recOut = null; }
        }

        @JavascriptInterface
        public void recChunk(String b64) {
            try { if (recOut != null) recOut.write(Base64.decode(b64, Base64.DEFAULT)); } catch (Throwable ignored) { }
        }

        @JavascriptInterface
        public void recEnd() {
            boolean ok = false;
            try {
                if (recOut != null) recOut.close();
                recOut = null;
                boolean mp4 = recMime != null && recMime.contains("mp4");
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Video.Media.DISPLAY_NAME, "huazhong-" + System.currentTimeMillis() + (mp4 ? ".mp4" : ".webm"));
                cv.put(MediaStore.Video.Media.MIME_TYPE, mp4 ? "video/mp4" : "video/webm");
                cv.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/HuaZhongManBu");
                Uri u = getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, cv);
                OutputStream os = getContentResolver().openOutputStream(u);
                InputStream in = new FileInputStream(recFile);
                byte[] buf = new byte[1 << 16];
                int n;
                while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                in.close();
                os.close();
                recFile.delete();
                ok = true;
            } catch (Throwable ignored) { }
            done("recStop", ok, ok ? "" : "录像没有保存下来");
        }

        @JavascriptInterface
        public void haptic() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() { web.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP); }
            });
        }
    }
}
