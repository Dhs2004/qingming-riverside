# 入画 · 清明上河图

走入虹桥与汴河街市，在温暖的手绘画境中第一视角漫游。

**[点击在线游玩 →](https://dhs2004.github.io/qingming-riverside/)** · 无需登录、无需安装

![虹桥街市实机画面](docs/riverside.jpg)

## 画境

以故宫博物院藏张择端《清明上河图》为参考，重构虹桥附近一段连续街区：两岸街市、舟船、船埠与可以进入的茶肆。

- 342 位绘制人物、13 类角色、30 组市井活动，25 位行人沿街行走。
- 12 只动物、5 艘舟船，以及茶具、陶器、布匹、果蔬、点心和摊铺细物。
- 春柳、水面倒影、纸灯、蒸汽与温暖的手绘光色。
- 自由漫游、循卷游览、地图定位、茶肆落座、原画对照与留影下载。
- 桌面键鼠和触屏操作，环境声可自行开启。

这是基于原画的空间与美术创作。人物及动物使用前、后、侧面的绘制平面；空间背面、尺度、春日色彩与动作包含创作补足，并非历史实景扫描。

## 操作

| 操作 | 桌面 |
| --- | --- |
| 行走 | W / A / S / D；上、下方向键 |
| 环顾 | 拖动画面；左、右方向键 |
| 快走 | Shift |
| 端详近处细节 | E |
| 暂停 / 关闭窗口 | Esc |

触屏使用左下方向盘行走，在画面右侧拖动环顾。也可以点击「循卷游览」，跟随路线慢慢看。

## 本地运行

安装 Python 3 后，在仓库目录运行：

```sh
python3 -m http.server 18742 --bind 127.0.0.1 --directory dist
```

打开 <http://127.0.0.1:18742/>。如果已安装 Node.js，也可以运行 `npm run dev`。无需 `npm install`、构建步骤或 API 密钥；请通过 HTTP 访问，直接双击 HTML 会受到浏览器模块限制。

使用支持 WebGL 2 的现代浏览器。场景细节较多，首次进入会生成绘制素材，载入时间与流畅度取决于设备性能。

## 检查与发布

```sh
npm run check
npm run check:world
```

检查覆盖 JavaScript 语法、场景几何、碰撞、行人路线，以及四处地标和两间茶肆的可达性。

推送到 `main` 后，GitHub Actions 会运行检查，将 `dist/` 发布到 GitHub Pages。工作流也支持手动运行。Pull Request 会运行检查。所有运行素材均在仓库内，无需后端服务。

## 目录

- `dist/`：可直接托管的网站，包含所有程序与素材。
- `dist/world.js`：桥、街市、建筑、舟船与碰撞。
- `dist/people.js`、`townsfolk.js`、`tableaux.js`、`animals.js`：绘制人物与动物。
- `dist/crowd-*.js`：市井分组、行人路线与脚下阴影。
- `dist/main.js`：第一视角、操作、声音、导览、对照与留影。
- `tools/check-world.mjs`：场景检查。
- `research/`：参考说明与纹理制作脚本；脚本所需的原始大图不随仓库附带。

完整模块说明见 [README.txt](README.txt)。

## 参考与第三方素材

原画出处、公共领域扫描与艺术重构说明见 [参考页面](https://dhs2004.github.io/qingming-riverside/sources.html) 和 [参考笔记](research/reference-notes.txt)。Three.js r169 随项目提供，其 MIT 许可保留于 [THREE-LICENSE.txt](dist/assets/THREE-LICENSE.txt)。
