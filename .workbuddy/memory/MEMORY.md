# MEMORY.md - 铅言万语项目长期记忆

## 项目基本信息

- **项目名称**：铅言万语（QianYan WanYu）
- **类型**：微信小程序（个人主体）
- **Slogan**：为文字造一页纸，写一本书，让阅读回到阅读
- **核心命题**：把键盘输入的文字，转化成视觉上"印在真实书页上"的效果（不是"贴在纸上"）
- **路径**：/Users/ouyangguoqing/Documents/trae_projects/qianyanwanyu

## 技术栈

- 原生微信小程序（不用uni-app）
- Canvas 2D API（`<canvas type="2d">`），离屏双缓冲
- 微信云开发（云函数+云数据库+云存储）
- 字体通过云存储CDN按需加载

## 代码现状（2026-05-18）

- engine/paper.js / ink-effect.js / renderer.js / typesetter.js：基础引擎框架已建立
- pages/luomo（落墨）/ shiwen（拾文）/ wujuan（吾卷）：基础页面已建立
- utils/constants.js：10套模板参数完整（可直接使用）
- app.json：Tab命名落墨/拾文/吾卷，颜色#F5F0E8，配置正确
- fonts_full/：已有72个字体文件（本地调试用）

## 关键技术决策

- **印刷质感实现**：必须用 globalCompositeOperation:'multiply' 叠加字迹，不能用普通 fillText
- **纸张纹理**：离屏Canvas生成纹理，multiply叠加（不能putImageData直接写入覆盖底色）
- **布局比例**：canvas占75-80vh（主体），输入区折叠在底部
- **工具栏**：边缘热区30px触碰唤醒，墨散动画（cubic-bezier弹性），4秒自动消散

## 用户偏好

- 中文沟通，结构化表达，简洁输出
- 不要emoji（代码和文档都要清除）
- 颜色简约，重视排版美观
- 代码质量严格：防抖、空加载状态、错误处理、定时器清理均需到位
- 极简优先：页面打开就是书页，功能隐藏在边缘
- 决策果断，倾向一次性提出多个任务

## 已确认的产品决策

- 个人主体，无支付功能，完全免费
- 横排为主（8套），竖排为辅（2套，置末尾）
- Tab命名：落墨（文字成书）/ 拾文（文章转书）/ 吾卷（个人中心）
- 默认模板：现代散文（轻型纸·Noto Serif·行距2.0·无框）
- 水印：必须（铅言万语+创作时间），可选（纸张名/字体名/自定义）
- 自定义模板上限：5个

## 核心设计原则（7大视觉范式）

1. 纸张质感层：底色+纤维纹理+老化+污渍
2. 油墨印刷层：multiply模式字迹渲染+渗透效果+墨迹变化
3. 排版布局层：横排默认+专业版心参数（天头地脚订口切口）
4. 装饰元素层：印章+边框+分隔线
5. 光影立体层：书页投影+内部光照渐变
6. 风格模板层：10套预设
7. 交互体验层：边缘唤醒+墨散动画+导出分享

## 代码质量分析（2026-05-18）

### P1 严重问题（7项）

| # | 问题 | 状态 | 文件 | 说明 |
|---|------|------|------|------|
| #4 | 模块级变量未声明 | 待处理 | luomo.js:11-19 | _draftSaveTimer等（实际上已用let声明） |
| #11 | 每次翻页都完整重新排版 | 已修复 | renderer.js | 添加glyph缓存，key=text+layout |
| #14 | 高DPR离屏Canvas内存风险 | 待处理 | paper.js | DPR=3时可能创建多个全尺寸Canvas |
| #17 | Logo文件不存在但每次渲染都尝试加载 | 已修复 | ink-effect.js | 移除2秒setTimeout超时 |
| #25 | 纸张纹理生成非常耗时 | 待处理 | paper.js | 约200-500ms |
| #26 | 纸张纹理未做缓存 | 已修复 | renderer.js | 添加纸张纹理缓存，key=paperConfig |
| #36 | luomo.js职责过多(1453行) | 规划中 | luomo.js | 需拆分为多个模块 |

**已修复的P1问题：**
1. Logo加载超时：移除setTimeout，onerror立即返回
2. 纸张纹理缓存：添加_paperTextureCache，命中后直接putImageData
3. 排版结果缓存：添加_glyphCache，避免重复typesetAllPages
4. 模板切换时清理缓存：在onSelectTemplate/onSwitchTemplate中调用clearRenderCache()

### P2 建议问题（11项）

- #5: parseColor函数在ink-effect.js和paper.js重复实现
- #6: getTempFileURL在font-loader.js和image-loader.js重复实现
- #10: ~15个onXxxStep函数结构相同可抽象
- #12: estimatePageCount和renderAllPages重复排版（已通过缓存缓解）
- #13: 离屏Canvas未显式释放
- #15: drawInkBlock每页最多3500+次fillText调用
- #16: _loadLogoImage的setTimeout未清理（已修复）
- #21: shiwen.js字体检查bug（检查不存在的font.file）
- #22: JSON.parse(JSON.stringify())反模式
- #24: settings双值模式增加复杂度
- #28: _doRender渲染请求未去重

### 架构建议

1. **拆分luomo.js**：PageController + SettingsPanel + FontManager + CursorManager + KeyboardAdapter
2. **抽取公共函数**：parseColor、getTempFileURL、_getDateStr
3. **性能优化**：纸张纹理缓存、排版结果缓存、增量渲染
4. **内存管理**：离屏Canvas显式释放、清理废弃定时器

### 相关文件路径

- 主渲染引擎：miniprogram/engine/
- 主页面：miniprogram/pages/luomo/luomo.js
- 工具函数：miniprogram/utils/
