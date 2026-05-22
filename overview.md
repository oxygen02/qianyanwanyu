# 2026-05-18 落墨页 UI 优化与墨迹渲染增强

## 已完成

### 1. 命名与唤醒机制优化
- 左边缘热区 "设置" → "字体设置"，右边缘 "模板" → "模板设置"
- 悬浮工具栏按钮标签同步
- 空状态提示语更明确："点按左边缘唤出字体设置，右边缘唤出模板设置"
- 设置面板标题改为"排版设置"，新增副标题"左栏调字迹，右栏调纸张"
- 边缘热区渐变和指示条增强，提高可发现性

### 2. 版心位置四向独立控制
- 将模糊的单一"边距"拆分为：留白上/下/左/右四个独立 slider（50~150%）
- 用户可精确控制第一个字出现在纸张的什么位置
- 替换 data 模型中的 marginScale 为 marginTopVal/BottomVal/LeftVal/RightVal

### 3. 墨迹真实感大幅强化
- 7层渲染各层 opacity 全面提升，避免墨迹发灰变淡
- 主体实墨层最低不透明度从 0.56 提升到 0.70（以 opacity=0.80 为例）
- 新增第3.5层"边缘浸润"：极微模糊让字迹边缘不锐利，模拟墨水被纤维吸收
- 套印重影、飞白破损、高光层参数全面加大
- drawInkChar 同步增强

### 4. 水印位置统一
- 所有模板默认水印位置改为 bottomRight
- "铅言万语 + 时间"默认出现在纸张右下角

## 修改文件
- miniprogram/pages/luomo/luomo.wxml
- miniprogram/pages/luomo/luomo.wxss
- miniprogram/pages/luomo/luomo.js
- miniprogram/engine/ink-effect.js
- miniprogram/utils/constants.js

## 后续待验证
- 真机编译测试墨迹效果是否肉眼可见
- 字体加载是否正常（截图中文字像系统黑体，疑似字体未加载）
- 四向留白调整的交互流畅度
