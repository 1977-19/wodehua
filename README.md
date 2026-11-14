# 画中漫步

走进梵高的小镇，穿过金色的画框，去往八个名画世界：梵高小镇、露天美术馆（蒙娜丽莎、大卫等）、莫奈睡莲池、北斋神奈川、蒙克峡湾、修拉大碗岛、千里江山、雾海之巅。

## 安装到 iPhone / iPad

到本仓库的 **Releases → latest** 下载 `HuaZhongManBu.ipa`（未签名），用 AltStore、Sideloadly 或 TrollStore 安装。
每次推送到 `main`，GitHub Actions 会自动重新编译并更新这个 IPA。

App 里可以：横屏锁定、120Hz、拍照和录像直接存进相册、联网查看原画。

## 网页版

直接打开 `index.html`（单文件，无依赖，WebGL2）。

## 操作

- 左手拖动移动，右手拖动转视角，双指缩放
- 右下角「跑」「车」切换奔跑和自行车；同伴会坐在后座
- 相机按钮：拍照 / 录像 / 查看原画
- 河、运河、海和雾都可以直接走进去

## 开发

源码在 `src/`，修改后运行 `node build.js` 生成 `index.html`。iOS 外壳在 `ios/`。
