# 识谱练习（music-theory-lab）

简洁版五线谱单音识谱练习，在手机浏览器中运行。看谱上的音符，在琴键上点出对应的键。

## 功能

- 单音练习：初级「常用音符」5 组（大字组、小字组、小字一组、小字二组、小字三组）；中级、高级分组已列出，标记为「即将推出」
- 结束方式：默认模式（每个音各考一次）/ 数量练习（做满 N 题）
- 设置：随机顺序、显示音符名称
- 整行五线谱：4/4 拍，随机四分 / 二分 / 全音符（只是装饰，答题只看音高），当前题蓝底高亮
- 判定：出题时不播放目标音；按下任意键播放该键的音；点错停在原题；第一次就点对才算对；💡 提示会高亮正确的键，这题记为错
- 结果页：正确率、星级、对错数、用时、错题集（记录误选的键）
- 练习记录：保存在浏览器本地，练习中心显示累计统计

## 开发

```bash
npm install
npm run dev        # 局域网可访问，手机和电脑连同一个 Wi-Fi 后打开终端里显示的地址
npm test           # 单元测试
npm run build      # 产物在 dist/
```

> Windows 上如果 `npm test` 报 `Cannot read properties of undefined (reading 'config')`，是盘符大小写不一致导致的：在 `D:\...`（大写盘符）路径下运行即可。

`public/audio/` 中的钢琴采样已提交到仓库；如需重新下载：`npm run fetch-samples`。

## 部署

推送到 `main` 后，`.github/workflows/deploy.yml` 会构建并发布到 GitHub Pages。首次使用需要在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。

发布后在手机浏览器打开，用「添加到桌面」即可像 App 一样使用（支持离线）。

## 目录

```
src/core/   纯逻辑（音符目录、谱表换算、分组、节奏、判定状态机、结果与历史），有单元测试
src/ui/     界面（VexFlow 谱面、键盘、音频、页面）
public/     采样、图标、manifest、service worker
openspec/   需求与设计文档
```

## 素材来源

- 钢琴采样：[Salamander Grand Piano](https://archive.org/details/SalamanderGrandPianoV3)，作者 Alexander Holm，[CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/)。使用的是 [Tone.js](https://github.com/Tonejs/audio) 转换的 MP3 版本，每八度取 4 个采样，其余音高通过变速得到。
- 五线谱排版：[VexFlow](https://github.com/vexflow/vexflow)（MIT），内置 Bravura 字体（SIL OFL）。

本项目参考了「口袋五线谱」的练习设计，但没有使用其任何代码或素材。
