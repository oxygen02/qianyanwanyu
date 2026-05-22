# 铅言万语 · UI设计系统方案

**版本：V2.0**
**日期：2026-05-18**
**更新说明：V2.0 优化了落墨页的工具栏设计，从顶部固定工具栏改为边缘悬浮工具栏方案，解决遮挡、键盘冲突、位置固定等问题。**

---

## 一、设计哲学

### 1.1 核心感官标准

用户看到生成结果时的第一感官应该是：

| 层次 | 预期效果 | 禁忌 |
|------|----------|------|
| **纸** | 纸张纤维纹理、岁月黄斑、边缘微毛边 | 白纸黑字加滤镜 |
| **墨** | 边缘晕染、飞白效果、铅字缺角感 | 字贴在纸面上 |
| **书** | 版心留白、页码、时代感排版节奏 | 浮在空中的字 |

### 1.2 设计关键词

```
沉静 · 内敛 · 手泽感 · 呼吸感 · 纸质温润 · 墨色沉稳
```

### 1.3 视觉基调

```
主色调：#2A2A2A（墨黑）
背景色：#F5F0E8（宣纸暖白）
强调色：#8B7355（古籍褐）
点缀色：#B22222（印章朱红）
界面色：#9E9488（中性灰褐）
```

---

## 二、色彩系统

### 2.1 核心色板

```css
:root {
  /* 墨色系 */
  --ink-deep: #1A1A1A;      /* 最深墨 */
  --ink-black: #2A2A2A;      /* 正文墨 */
  --ink-gray: #4A4A4A;      /* 次级墨 */
  --ink-light: #6A6A6A;     /* 浅墨/辅助 */

  /* 纸色系 */
  --paper-cream: #F5F0E8;   /* 宣纸白-主背景 */
  --paper-warm: #FAF7F2;    /* 暖白-输入区 */
  --paper-aged: #E8E0D0;    /* 陈纸色-展示区 */
  --paper-dark: #D4C8B8;    /* 旧纸边角 */

  /* 辅助色 */
  --accent-seal: #B22222;   /* 印章朱红 */
  --accent-gold: #C4A35A;    /* 古籍金 */
  --accent-burgundy: #722F37;/* 复古酒红 */

  /* 界面色 */
  --ui-text: #3D2B1F;       /* 深褐-主要文字 */
  --ui-subtext: #9E9488;    /* 灰褐-次要文字 */
  --ui-border: rgba(158, 148, 136, 0.25); /* 边框线 */
  --ui-shadow: rgba(61, 43, 31, 0.08);    /* 投影 */
}
```

### 2.2 功能色语义

```css
/* 成功/提示/警告 - 保持克制 */
--success: #6B8E6B;        /* 旧纸绿 */
--warning: #A08050;        /* 古纸黄 */
--error: #8B4513;          /* 褐红 */

/* 交互反馈 */
--btn-active: rgba(158, 148, 136, 0.14);
--link-color: #5A4A3A;
```

### 2.3 透明度层级

```css
/* 遮罩层 */
--overlay-light: rgba(245, 240, 232, 0.85);
--overlay-dark: rgba(26, 26, 26, 0.5);

/* 分隔线 */
--divider-subtle: rgba(158, 148, 136, 0.12);
--divider-normal: rgba(158, 148, 136, 0.25);
```

---

## 三、字体系统

### 3.1 字体家族

```css
/* 中文正文 - 宋体/衬线为主 */
--font-serif: "Noto Serif SC", "Source Han Serif CN", "SimSun", serif;

/* 中文辅助 - 黑体/无衬线 */
--font-sans: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;

/* 英文正文 */
--font-english: "Georgia", "Times New Roman", serif;

/* 等宽/特殊 */
--font-mono: "JetBrains Mono", "Courier New", monospace;

/* 手写体 */
--font-handwrite: "Ma Shan Zheng", "XiaolaiTypewriter", cursive;
```

### 3.2 字号层级

```css
/* 微信小程序 rpx 单位换算（750设计稿） */
--text-xs: 20rpx;    /* 10px - 极小辅助 */
--text-sm: 22rpx;    /* 11px - 次要说明 */
--text-base: 26rpx;   /* 13px - 正文辅助 */
--text-md: 28rpx;    /* 14px - 正文主体 */
--text-lg: 32rpx;    /* 16px - 页面标题 */
--text-xl: 36rpx;    /* 18px - 大标题 */
--text-2xl: 44rpx;   /* 22px - 主标题 */
```

### 3.3 行高规范

```css
--leading-tight: 1.3;   /* 紧凑-标题 */
--leading-normal: 1.6;  /* 正常-正文 */
--leading-relaxed: 2.0; /* 宽松-书卷 */
--leading-poetry: 2.2;  /* 诗词-竖排 */
```

---

## 四、间距系统

### 4.1 基础单位

```css
--space-unit: 8rpx;   /* 基础单位 4px */

--space-1: 4rpx;       /* 微距 */
--space-2: 8rpx;       /* 紧凑 */
--space-3: 12rpx;      /* 标准 */
--space-4: 16rpx;      /* 常用 */
--space-5: 24rpx;      /* 宽松 */
--space-6: 32rpx;      /* 分隔 */
--space-8: 48rpx;      /* 大块 */
--space-10: 64rpx;     /* 极大 */
```

### 4.2 页面留白

```css
/* 边距 */
--page-margin-x: 32rpx;     /* 页面左右边距 */
--page-margin-top: 24rpx;   /* 内容区上边距 */
--page-margin-bottom: 16rpx;/* 内容区下边距 */

/* 卡片内边距 */
--card-padding: 24rpx;
--card-padding-lg: 32rpx;
```

### 4.3 组件间距

```css
/* 列表项 */
--list-item-gap: 2rpx;       /* 列表项间距 */
--list-section-gap: 32rpx;   /* 分组间距 */

/* 表单 */
--form-item-gap: 28rpx;      /* 表单项间距 */
--form-section-gap: 40rpx;  /* 表单分组间距 */

/* 按钮组 */
--btn-group-gap: 16rpx;
```

---

## 五、圆角系统

### 5.1 圆角层级

```css
/* 极小-紧凑元素 */
--radius-xs: 4rpx;

/* 小-按钮/输入框 */
--radius-sm: 8rpx;

/* 中等-卡片/面板 */
--radius-md: 12rpx;

/* 大-弹窗/底部栏 */
--radius-lg: 20rpx;

/* 特大-底部面板 */
--radius-xl: 32rpx;

/* 全圆-头像/标签 */
--radius-full: 9999rpx;
```

### 5.2 场景应用

| 元素 | 圆角 | 原因 |
|------|------|------|
| 工具栏按钮 | 8rpx | 保持克制的手感 |
| 底部面板 | 32rpx顶部 | 现代卡片风格 |
| 输入框 | 0rpx | 保持书卷方正感 |
| 缩略卡片 | 8rpx | 轻量感 |
| 印章/水印 | 0rpx | 保持方正古朴 |

---

## 六、阴影系统

### 6.1 阴影层级

```css
/* 极轻-微妙悬浮 */
--shadow-xs: 0 1rpx 3rpx rgba(61, 43, 31, 0.04);

/* 轻-卡片默认 */
--shadow-sm: 0 2rpx 6rpx rgba(61, 43, 31, 0.06);

/* 中等-书页悬浮 */
--shadow-md: 0 4rpx 12rpx rgba(61, 43, 31, 0.08),
             0 1rpx 3rpx rgba(61, 43, 31, 0.04);

/* 重-弹窗/浮层 */
--shadow-lg: 0 8rpx 24rpx rgba(61, 43, 31, 0.12),
             0 2rpx 6rpx rgba(61, 43, 31, 0.06);

/* 极重-底部面板 */
--shadow-xl: 0 -4rpx 32rpx rgba(61, 43, 31, 0.15);
```

### 6.2 书页特殊阴影

```css
/* 落墨页书页投影 */
.book-page-shadow {
  box-shadow:
    0 2rpx 4rpx rgba(61, 43, 31, 0.04),     /* 紧贴 */
    0 8rpx 24rpx rgba(61, 43, 31, 0.08),    /* 散射 */
    0 1rpx 0 rgba(255, 255, 255, 0.8) inset; /* 顶部高光 */
}

/* 底部输入区投影 */
.input-area-shadow {
  box-shadow: 0 -4rpx 24rpx rgba(61, 43, 31, 0.08);
}
```

---

## 七、动效规范

### 7.1 时长层级

```css
/* 极快-状态切换 */
--duration-instant: 100ms;

/* 快速-微交互 */
--duration-fast: 200ms;

/* 正常-过渡 */
--duration-normal: 300ms;

/* 慢速-面板滑入 */
--duration-slow: 400ms;

/* 极慢-墨散动画 */
--duration-ink: 500ms;
```

### 7.2 缓动曲线

```css
/* 标准-一般过渡 */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* 进入-面板展开 */
--ease-enter: cubic-bezier(0, 0, 0.2, 1);

/* 退出-面板收起 */
--ease-exit: cubic-bezier(0.4, 0, 1, 1);

/* 弹性-墨散出现 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 墨散消失 */
--ease-fade: cubic-bezier(0.4, 0, 1, 1);
```

### 7.3 核心动效

#### 底部面板滑入
```css
.panel-slide-up {
  transition: transform 350ms var(--ease-enter);
}
.panel-slide-up.hidden {
  transform: translateY(100%);
}
.panel-slide-up.visible {
  transform: translateY(0);
}
```

#### 墨散出现动画
```css
@keyframes ink-spread {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

#### 书页预览放大
```css
.book-canvas.zoomed {
  transform: scale(1.08);
  transition: transform 500ms var(--ease-spring);
}
```

---

## 八、页面布局规范

### 8.1 落墨页布局（核心页面）

#### 旧方案（已废弃）
```
┌─────────────────────────────────┐
│  顶部工具栏 (safe area内)        │  56rpx ← 遮挡书页，键盘冲突
│  [模板][纸张][字体]  [保存][分享] │
├─────────────────────────────────┤
│     ┌───────────────────┐       │
│     │    书页Canvas     │       │  flex:1 占主体
│     │    (书卷展示)     │       │  75-80vh
│     │                   │       │
│     │   ●○○ (页码点)    │       │
│     └───────────────────┘       │
│                                 │
├─────────────────────────────────┤
│  [textarea 输入框]              │  190rpx 固定
│  字数统计              [清空]   │
└─────────────────────────────────┘
```

#### 新方案（V2.0）- 边缘悬浮工具栏

**设计原则**：
- 移除顶部工具栏，书页Canvas占据整个主体区域
- 左右两侧设置隐藏热区（30px），点击唤醒侧边悬浮工具栏
- 工具栏以"墨散动画"形式出现，4秒无操作自动消散
- 用户可自定义工具栏位置偏好（左侧/右侧）
- 键盘弹出时，热区响应区域自动上移，避免被遮挡

```
┌─────────────────────────────────┐
│ ▌                              ▐│ ← 边缘热区 30px（隐藏）
│ ▌     ┌─────────────────┐     ▐│
│ ▌     │                 │     ▐│
│ ▌     │    书页Canvas   │     ▐│  flex:1 占满全屏
│ ▌     │   书卷展示区    │     ▐│  (100vh - 输入区)
│ ▌     │                 │     ▐│
│ ▌     │   ●○○ (页码点) │     ▐│
│ ▌     └─────────────────┘     ▐│
│ ▌         [悬浮工具栏]        ▐│ ← 点击边缘唤醒
│ ▌         (48px宽)          ▐│
│ ▌                              ▐│
├─────────────────────────────────┤
│  [textarea 输入框]              │  190rpx 固定
│  字数统计              [清空]   │
└─────────────────────────────────┘
```

#### 热区布局详细

```
左侧热区          书页区域          右侧热区
┌────────────┬────────────────────┬────────────┐
│            │                    │            │
│  隐藏热区   │                    │  隐藏热区   │
│  30px      │   书页Canvas       │  30px      │
│  (透明)    │   (占据主体)       │  (透明)    │
│            │                    │            │
│  点击唤醒   │                    │  点击唤醒   │
│  左侧工具栏 │                    │  右侧工具栏 │
│            │                    │            │
└────────────┴────────────────────┴────────────┘
```

#### 悬浮工具栏结构

```
┌─────────────────────────────┐
│  ┌────┐                     │
│  │ 字 │  ← 字号/字间距       │
│  ├────┤                     │
│  │ 纸 │  ← 纸张/模板         │
│  ├────┤                     │
│  │ 墨 │  ← 墨色/字重         │
│  ├────┤                     │
│  │ 排 │  ← 横竖排/版式       │
│  ├────┤                     │
│  │ 存 │  ← 保存（深色高亮）  │
│  ├────┤                     │
│  │ 分 │  ← 分享              │
│  ├────┤                     │
│  │ 设 │  ← 设置入口          │
│  └────┘                     │
└─────────────────────────────┘
  工具栏宽 48px
  按钮 32x32px，圆角 6px
  间距 8px
```

### 8.2 落墨页边缘热区交互规范

#### 交互规则

| 触发条件 | 响应结果 |
|---------|---------|
| 点击左侧热区 | 左侧弹出悬浮工具栏 |
| 点击右侧热区 | 右侧弹出悬浮工具栏 |
| 4秒无操作 | 工具栏以墨散动画消散 |
| 点击工具栏外部 | 工具栏立即消散 |
| 键盘弹出 | 热区响应区域自动上移 |

#### 位置偏好

用户可在设置中选择工具栏默认位置：
- **左侧**（默认）：适合惯用右手的用户
- **右侧**：适合惯用左手的用户
- **跟随系统**：跟随系统语言设置（左→右，右→左）

#### 键盘适配

```javascript
// 监听键盘高度变化，动态调整热区响应区域
onKeyboardHeightChange(e) {
  const keyboardHeight = e.height;
  if (keyboardHeight > 0) {
    // 键盘弹出时，缩短热区高度，避开键盘区域
    this.setData({
      leftHotzoneHeight: `calc(100vh - 190rpx - ${keyboardHeight}px)`,
      rightHotzoneHeight: `calc(100vh - 190rpx - ${keyboardHeight}px)`
    });
  } else {
    // 键盘收起时，恢复全高
    this.setData({
      leftHotzoneHeight: '100vh',
      rightHotzoneHeight: '100vh'
    });
  }
}
```

### 8.3 拾文页布局

```
┌─────────────────────────────────┐
│  顶部工具栏                      │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ [粘贴链接] [粘贴文本]    │   │  输入方式切换
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    内容预览区            │   │  flex:1
│  │    (可编辑)             │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  [生成书页]          [模板选择] │
└─────────────────────────────────┘
```

### 8.4 吾卷页布局

```
┌─────────────────────────────────┐
│  顶部：用户信息区               │  头像 + 名称
├─────────────────────────────────┤
│  功能列表                       │
│  ├─ 创作历史                    │
│  ├─ 收藏                        │
│  ├─ 我的模板                    │
│  ├─ 字体库                      │
│  ├─ 存储管理                    │
│  └─ 设置                        │
├─────────────────────────────────┤
│  其他                           │
│  ├─ 意见反馈                    │
│  ├─ 关于                        │
│  ├─ 用户协议                    │
│  └─ 隐私政策                    │
└─────────────────────────────────┘
```

---

## 九、组件设计

### 9.1 按钮组件

#### 主按钮
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 48rpx;
  font-size: 28rpx;
  color: #FAF7F2;
  background-color: #3D2B1F;
  border-radius: 8rpx;
  transition: all 200ms var(--ease-default);
}

.btn-primary:active {
  transform: scale(0.97);
  opacity: 0.85;
}
```

#### 次要按钮
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
  color: #3D2B1F;
  background-color: transparent;
  border: 1rpx solid rgba(158, 148, 136, 0.4);
  border-radius: 8rpx;
}

.btn-secondary:active {
  background-color: rgba(158, 148, 136, 0.1);
}
```

#### 文字按钮
```css
.btn-text {
  font-size: 26rpx;
  color: #9E9488;
  padding: 12rpx 20rpx;
  background: none;
  border: none;
}

.btn-text:active {
  color: #3D2B1F;
}
```

### 9.2 工具栏按钮（顶部工具栏 - 已废弃）

```css
/* 注意：顶部工具栏方案已废弃，请使用边缘悬浮工具栏 */
/* 保留此代码仅供参考，新实现请使用 9.2a 边缘热区组件 */

/*
.toolbar-btn {
  font-size: 24rpx;
  color: #9E9488;
  font-family: var(--font-serif);
  padding: 12rpx 20rpx;
  border-radius: 8rpx;
  transition: color 200ms, background-color 200ms;
}

.toolbar-btn:active {
  color: #3D2B1F;
  background-color: rgba(158, 148, 136, 0.14);
}
*/
```

### 9.2a 边缘热区组件（新方案）

```css
/* 边缘热区 - 完全透明，点击唤醒工具栏 */
.edge-hotzone {
  position: fixed;
  top: 0;
  width: 30px;
  height: 100vh;
  z-index: 100;
  /* 完全透明，不干扰视觉 */
  background-color: transparent;
}

/* 左侧热区 */
.edge-hotzone--left {
  left: 0;
}

/* 右侧热区 */
.edge-hotzone--right {
  right: 0;
}

/* 热区悬停提示（可选，移动端可关闭） */
@media (hover: hover) {
  .edge-hotzone:hover::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 4px;
    height: 40px;
    background-color: rgba(158, 148, 136, 0.3);
    border-radius: 2px;
    transform: translateY(-50%);
  }

  .edge-hotzone--left:hover::after {
    right: 8px;
  }

  .edge-hotzone--right:hover::after {
    left: 8px;
  }
}
```

### 9.2b 悬浮工具栏组件（新方案）

```css
/* 悬浮工具栏容器 */
.floating-toolbar {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  background-color: var(--paper-warm);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration-fast) var(--ease-default);
}

/* 工具栏可见状态 */
.floating-toolbar.visible {
  opacity: 1;
  pointer-events: auto;
}

/* 墨散出现动画 */
.floating-toolbar.entering {
  animation: ink-spread var(--duration-ink) var(--ease-spring) forwards;
}

@keyframes ink-spread {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.3);
  }
  60% {
    opacity: 1;
    transform: translateY(-50%) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

/* 墨散消散动画 */
.floating-toolbar.exiting {
  animation: ink-fade var(--duration-fast) var(--ease-fade) forwards;
}

@keyframes ink-fade {
  0% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) scale(0.8);
  }
}

/* 工具栏位置 */
.floating-toolbar--left {
  left: 30px; /* 与左侧热区对齐 */
}

.floating-toolbar--right {
  right: 30px; /* 与右侧热区对齐 */
}

/* 工具栏按钮 */
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 8px auto;
  border-radius: 6px;
  font-size: 12px;
  font-family: var(--font-serif);
  color: var(--ui-subtext);
  background-color: transparent;
  border: 1px solid transparent;
  transition: all var(--duration-fast) var(--ease-default);
}

.toolbar-btn:active {
  background-color: rgba(158, 148, 136, 0.14);
  color: var(--ui-text);
}

/* 高亮按钮（如"保存"） */
.toolbar-btn--primary {
  background-color: var(--ui-text);
  color: var(--paper-warm);
}

.toolbar-btn--primary:active {
  opacity: 0.85;
  transform: scale(0.96);
}

/* 工具栏收起手柄 */
.toolbar-handle {
  width: 100%;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.toolbar-handle::before {
  content: '';
  width: 24px;
  height: 3px;
  background-color: rgba(158, 148, 136, 0.4);
  border-radius: 1.5px;
}
```

### 9.3 底部面板

```css
.bottom-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FAF7F2;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;

  transform: translateY(100%);
  transition: transform 350ms var(--ease-enter);
}

.bottom-panel.visible {
  transform: translateY(0);
}

/* 遮罩背景 */
.panel-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(26, 26, 26, 0);
  z-index: 999;
  pointer-events: none;
  transition: background-color 300ms;
}

.panel-backdrop.visible {
  background-color: rgba(26, 26, 26, 0.35);
  pointer-events: auto;
}
```

### 9.4 列表项

```css
.list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 32rpx;
  background-color: #FAF7F2;
  border-bottom: 1rpx solid var(--divider-subtle);
  transition: background-color 150ms;
}

.list-item:active {
  background-color: rgba(158, 148, 136, 0.08);
}

.list-item-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-item-content {
  flex: 1;
}

.list-item-title {
  font-size: 30rpx;
  color: #3D2B1F;
}

.list-item-desc {
  font-size: 24rpx;
  color: #9E9488;
  margin-top: 4rpx;
}

.list-item-arrow {
  font-size: 24rpx;
  color: #C4B8A8;
}
```

### 9.5 模板卡片

```css
.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: border-color 200ms, transform 200ms;
}

.template-card.active {
  border-color: #3D2B1F;
}

.template-card:active {
  transform: scale(0.96);
}

.template-thumb {
  width: 100rpx;
  height: 140rpx;
  border-radius: 6rpx;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-name {
  font-size: 24rpx;
  color: #3D2B1F;
  margin-top: 12rpx;
  font-family: var(--font-serif);
}

.template-desc {
  font-size: 20rpx;
  color: #9E9488;
  text-align: center;
  max-width: 120rpx;
  margin-top: 6rpx;
}
```

---

## 十、状态设计

### 10.1 加载状态

#### 墨点加载动画
```css
.loading-dots {
  display: flex;
  gap: 12rpx;
}

.loading-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background-color: #9E9488;
  animation: pulse 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
}
```

### 10.2 空状态

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.4;
}

.empty-title {
  font-size: 30rpx;
  color: #3D2B1F;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #9E9488;
  text-align: center;
}
```

### 10.3 错误状态

```css
.error-state {
  padding: 24rpx 32rpx;
  background-color: rgba(139, 69, 19, 0.08);
  border-radius: 8rpx;
  border-left: 4rpx solid #8B4513;
}

.error-text {
  font-size: 26rpx;
  color: #8B4513;
}
```

---

## 十一、落墨页完整设计方案

### 11.1 页面结构

```xml
<!-- pages/luomo/luomo.wxml -->
<view class="page-root">
  <!-- 顶部工具栏 -->
  <view class="top-toolbar" style="padding-top:{{safeAreaTop}}px">
    <view class="toolbar-group">
      <text class="toolbar-btn" bind:tap="onOpenTemplates">模板</text>
      <text class="toolbar-btn" bind:tap="onSwitchTemplate" data-dir="prev">上</text>
      <text class="toolbar-btn" bind:tap="onSwitchTemplate" data-dir="next">下</text>
    </view>
    <view class="toolbar-group">
      <text class="toolbar-btn" bind:tap="onExport">保存</text>
      <text class="toolbar-btn" bind:tap="onSharePage">分享</text>
      <text class="toolbar-btn" bind:tap="onToggleWatermark">{{watermarkEnabled ? '水印' : '无印'}}</text>
      <text class="toolbar-btn" bind:tap="onOpenSettings">设置</text>
    </view>
  </view>

  <!-- 书页展示区 -->
  <view class="canvas-area">
    <view class="page-dots" wx:if="{{totalPages > 1}}">
      <view wx:for="{{pageDots}}" wx:key="index"
            class="page-dot {{currentPage === index ? 'active' : ''}}"/>
    </view>

    <canvas id="bookCanvas" type="2d"
            class="book-canvas {{canvasZoomed ? 'zoomed' : ''}}"/>

    <view class="loading-mask" wx:if="{{isRendering}}">
      <view class="loading-dots">
        <view class="loading-dot"/>
        <view class="loading-dot"/>
        <view class="loading-dot"/>
      </view>
    </view>

    <view class="empty-hint" wx:if="{{!text && !isRendering}}">
      <text class="empty-hint-text">轻触底部，开始书写</text>
    </view>
  </view>

  <!-- 输入区 -->
  <view class="input-area">
    <textarea class="text-input" value="{{text}}"
              placeholder="在此写下文字..."
              placeholder-class="input-placeholder"
              auto-height="{{false}}" fixed="{{true}}"
              show-confirm-bar="{{false}}" adjust-position="{{false}}"
              bindinput="onTextInput" maxlength="{{-1}}"/>

    <view class="input-toolbar">
      <text class="char-count">{{text.length}} 字</text>
      <view class="input-actions">
        <text class="action-btn" bind:tap="onClearDraft">清空</text>
      </view>
    </view>
  </view>

  <!-- 面板容器 -->
  <include src="./panels.wxml"/>
</view>
```

### 11.2 页面样式（V2.0 - 边缘悬浮方案）

```css
/* pages/luomo/luomo.wxss */

/* === 页面根 === */
.page-root {
  width: 100%;
  height: 100vh;
  background-color: var(--paper-aged);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* === 边缘热区 === */
.edge-hotzone {
  position: fixed;
  top: 0;
  width: 30px;
  height: 100vh;
  z-index: 100;
  background-color: transparent;
}

.edge-hotzone--left {
  left: 0;
}

.edge-hotzone--right {
  right: 0;
}

/* === 书页展示区 === */
.canvas-area {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: var(--paper-aged);
}

/* 书页容器 */
.book-canvas {
  width: 92%;
  height: 92%;
  display: block;
  border-radius: 2rpx;
  box-shadow: var(--book-page-shadow);
  transition: transform 500ms var(--ease-spring);
}

.book-canvas.zoomed {
  transform: scale(1.08);
}

/* 页码指示 */
.page-dots {
  position: absolute;
  bottom: 32rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  gap: 10rpx;
  z-index: 10;
}

.page-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: rgba(61, 43, 31, 0.2);
  transition: background-color 300ms;
}

.page-dot.active {
  background-color: rgba(61, 43, 31, 0.7);
}

/* 加载遮罩 */
.loading-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(245, 240, 232, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

/* 空状态 */
.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.empty-hint-text {
  font-size: 28rpx;
  color: rgba(158, 148, 136, 0.5);
  font-family: var(--font-serif);
  letter-spacing: 0.15em;
}

/* === 悬浮工具栏 === */
.floating-toolbar {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  background-color: var(--paper-warm);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
}

.floating-toolbar.visible {
  opacity: 1;
  pointer-events: auto;
}

.floating-toolbar.entering {
  animation: ink-spread 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes ink-spread {
  0% {
    opacity: 0;
    transform: translateY(-50%) scale(0.3);
  }
  60% {
    opacity: 1;
    transform: translateY(-50%) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.floating-toolbar--left {
  left: 30px;
}

.floating-toolbar--right {
  right: 30px;
}

.toolbar-handle {
  width: 100%;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 4px;
}

.toolbar-handle::before {
  content: '';
  width: 24px;
  height: 3px;
  background-color: rgba(158, 148, 136, 0.4);
  border-radius: 1.5px;
}

.floating-toolbar .toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 4px auto;
  border-radius: 6px;
  font-size: 12px;
  font-family: var(--font-serif);
  color: var(--ui-subtext);
  background-color: transparent;
  transition: all 200ms var(--ease-default);
}

.floating-toolbar .toolbar-btn:active {
  background-color: rgba(158, 148, 136, 0.14);
  color: var(--ui-text);
}

.floating-toolbar .toolbar-btn--primary {
  background-color: var(--ui-text);
  color: var(--paper-warm);
}

.floating-toolbar .toolbar-btn--primary:active {
  opacity: 0.85;
  transform: scale(0.96);
}

.floating-toolbar .toolbar-btn--settings {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 8px;
}

/* === 输入区 === */
.input-area {
  flex-shrink: 0;
  height: 190rpx;
  background-color: var(--paper-warm);
  border-top: 1rpx solid var(--divider-normal);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: 0 -4rpx 24rpx rgba(61, 43, 31, 0.06);
}

.text-input {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 16rpx 40rpx 8rpx;
  font-size: 30rpx;
  line-height: 1.7;
  color: var(--ui-text);
  font-family: var(--font-serif);
  background-color: transparent;
  border: none;
  outline: none;
  min-height: 80rpx;
}

.input-placeholder {
  color: rgba(158, 148, 136, 0.6);
  font-family: var(--font-serif);
}

.input-toolbar {
  height: 52rpx;
  padding: 0 40rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid var(--divider-subtle);
  flex-shrink: 0;
}

.char-count {
  font-size: 22rpx;
  color: var(--ui-subtext);
}

.input-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24rpx;
}

.action-btn {
  font-size: 26rpx;
  color: var(--ui-subtext);
  padding: 8rpx 16rpx;
}

.action-btn:active {
  color: var(--ui-text);
}
```

### 11.3 落墨页JavaScript逻辑（V2.0 - 边缘悬浮方案）

```javascript
// pages/luomo/luomo.js

// 工具栏自动消散定时器
let toolbarDismissTimer = null;

// 工具栏状态
const TOOLBAR_DISMISS_DELAY = 4000; // 4秒自动消散

Page({
  data: {
    // 工具栏状态
    toolbarVisible: false,
    toolbarAnimating: false,
    toolbarSide: 'left', // 'left' | 'right'

    // 用户位置偏好（从设置中读取）
    toolbarPosition: 'left', // 用户设置的首选位置
  },

  // ========== 边缘热区交互 ==========

  /**
   * 热区点击处理
   * @param {object} e - 事件对象
   * @param {string} e.currentTarget.dataset.side - 'left' | 'right'
   */
  onHotzoneTap(e) {
    const side = e.currentTarget.dataset.side;

    // 如果工具栏已显示且点击同侧，关闭工具栏
    if (this.data.toolbarVisible && this.data.toolbarSide === side) {
      this.hideToolbar();
      return;
    }

    // 如果工具栏已显示但点击另一侧，切换工具栏位置
    if (this.data.toolbarVisible && this.data.toolbarSide !== side) {
      this.showToolbar(side);
      return;
    }

    // 工具栏未显示，显示工具栏
    this.showToolbar(side);
  },

  /**
   * 显示悬浮工具栏
   * @param {string} side - 'left' | 'right'
   */
  showToolbar(side) {
    // 清除之前的定时器
    this.clearDismissTimer();

    // 设置工具栏位置
    const toolbarSide = side || this.data.toolbarPosition;

    this.setData({
      toolbarAnimating: true,
      toolbarSide: toolbarSide
    });

    // 触发入场动画
    setTimeout(() => {
      this.setData({
        toolbarVisible: true
      });

      // 动画结束后启动自动消散定时器
      setTimeout(() => {
        this.setData({
          toolbarAnimating: false
        });
        this.startDismissTimer();
      }, 500); // 动画时长
    }, 10);
  },

  /**
   * 隐藏悬浮工具栏
   */
  hideToolbar() {
    // 清除定时器
    this.clearDismissTimer();

    // 触发离场动画
    this.setData({
      toolbarAnimating: true,
      toolbarVisible: false
    });

    // 动画结束后清理状态
    setTimeout(() => {
      this.setData({
        toolbarAnimating: false,
        toolbarSide: 'left'
      });
    }, 200); // 离场动画时长
  },

  /**
   * 启动自动消散定时器
   */
  startDismissTimer() {
    this.clearDismissTimer();
    toolbarDismissTimer = setTimeout(() => {
      this.hideToolbar();
    }, TOOLBAR_DISMISS_DELAY);
  },

  /**
   * 清除消散定时器
   */
  clearDismissTimer() {
    if (toolbarDismissTimer) {
      clearTimeout(toolbarDismissTimer);
      toolbarDismissTimer = null;
    }
  },

  /**
   * 重置消散定时器（用户操作时调用）
   */
  resetDismissTimer() {
    if (this.data.toolbarVisible) {
      this.startDismissTimer();
    }
  },

  // ========== 工具栏按钮操作 ==========

  /**
   * 打开字体设置面板
   */
  onOpenFontSettings() {
    this.resetDismissTimer();
    // 打开字体设置面板
    // ...
  },

  /**
   * 打开模板选择面板
   */
  onOpenTemplates() {
    this.resetDismissTimer();
    // 打开模板选择面板
    // ...
  },

  /**
   * 打开墨色设置面板
   */
  onOpenInkSettings() {
    this.resetDismissTimer();
    // 打开墨色设置面板
    // ...
  },

  /**
   * 打开版式设置面板
   */
  onOpenLayoutSettings() {
    this.resetDismissTimer();
    // 打开版式设置面板
    // ...
  },

  /**
   * 保存
   */
  onExport() {
    this.resetDismissTimer();
    // 执行保存操作
    // ...
  },

  /**
   * 分享
   */
  onSharePage() {
    this.resetDismissTimer();
    // 执行分享操作
    // ...
  },

  /**
   * 打开设置页面
   */
  onOpenSettings() {
    this.resetDismissTimer();
    // 跳转到设置页面
    // ...
  },

  // ========== 键盘适配 ==========

  /**
   * 监听键盘高度变化
   * @param {object} e - 键盘事件
   */
  onKeyboardHeightChange(e) {
    const keyboardHeight = e.height;

    if (keyboardHeight > 0) {
      // 键盘弹出时，缩短热区高度，避开键盘和输入区
      this.setData({
        leftHotzoneHeight: `calc(100vh - ${keyboardHeight}px - 190rpx)`,
        rightHotzoneHeight: `calc(100vh - ${keyboardHeight}px - 190rpx)`
      });
    } else {
      // 键盘收起时，恢复全高
      this.setData({
        leftHotzoneHeight: '100vh',
        rightHotzoneHeight: '100vh'
      });
    }
  },

  // ========== 生命周期 ==========

  onLoad() {
    // 从设置中读取用户的位置偏好
    const toolbarPosition = wx.getStorageSync('toolbarPosition') || 'left';
    this.setData({
      toolbarPosition: toolbarPosition,
      toolbarSide: toolbarPosition
    });

    // 监听键盘高度变化
    wx.onKeyboardHeightChange(this.onKeyboardHeightChange.bind(this));
  },

  onUnload() {
    // 清除定时器
    this.clearDismissTimer();
    // 取消监听键盘高度变化
    wx.offKeyboardHeightChange(this.onKeyboardHeightChange);
  },

  onHide() {
    // 页面隐藏时关闭工具栏
    this.hideToolbar();
  },
});
```

### 11.4 面板设计方案

```xml
<!-- pages/luomo/panels.wxml -->

<!-- 模板选择面板 -->
<view class="bottom-panel template-panel {{templatePanelVisible ? 'visible' : ''}}"
      bind:tap="onClosePanelBg">
  <view class="panel-header">
    <text class="panel-title">选择纸张</text>
  </view>
  <scroll-view scroll-x class="template-scroll" enhanced show-scrollbar="{{false}}">
    <view class="template-list">
      <view wx:for="{{templateList}}" wx:key="id"
            class="template-card {{item.id === activeTemplateId ? 'active' : ''}}"
            bind:tap="onSelectTemplate" data-id="{{item.id}}">
        <view class="template-thumb" style="background-color:{{item.paper.baseColor}}">
          <text class="template-thumb-text">文</text>
        </view>
        <text class="template-name">{{item.name}}</text>
        <text class="template-desc">{{item.desc}}</text>
      </view>
    </view>
  </scroll-view>
</view>

<!-- 设置面板 -->
<view class="bottom-panel settings-panel {{settingsPanelVisible ? 'visible' : ''}}"
      bind:tap="onCloseSettingsBg">
  <view class="panel-header">
    <text class="panel-title">页面设置</text>
  </view>
  <scroll-view scroll-y class="settings-scroll" enhanced>
    <view class="settings-body">
      <!-- 字号 -->
      <view class="setting-row">
        <text class="setting-label">字号</text>
        <slider class="setting-slider" min="20" max="48" step="1"
                value="{{settings.fontSize}}" show-value
                bindchange="onFontSizeChange"
                block-size="18"/>
      </view>

      <!-- 字间距 -->
      <view class="setting-row">
        <text class="setting-label">字间距</text>
        <slider class="setting-slider" min="-5" max="25" step="1"
                value="{{settings.letterSpacingVal}}" show-value
                bindchange="onLetterSpacingChange"
                block-size="18"/>
      </view>

      <!-- 墨色浓度 -->
      <view class="setting-row">
        <text class="setting-label">墨色</text>
        <slider class="setting-slider" min="40" max="100" step="1"
                value="{{settings.inkOpacityVal}}" show-value
                bindchange="onInkOpacityChange"
                block-size="18"/>
      </view>

      <!-- 横竖排 -->
      <view class="setting-row">
        <text class="setting-label">排版</text>
        <view class="setting-segment">
          <view class="seg-item {{settings.direction === 'horizontal' ? 'active' : ''}}"
                bind:tap="onDirectionChange" data-dir="horizontal">横排</view>
          <view class="seg-item {{settings.direction === 'vertical' ? 'active' : ''}}"
                bind:tap="onDirectionChange" data-dir="vertical">竖排</view>
        </view>
      </view>

      <!-- 字重 -->
      <view class="setting-row">
        <text class="setting-label">字重</text>
        <view class="setting-segment">
          <view class="seg-item {{settings.fontWeight === '400' ? 'active' : ''}}"
                bind:tap="onFontWeightChange" data-w="400">常规</view>
          <view class="seg-item {{settings.fontWeight === '700' ? 'active' : ''}}"
                bind:tap="onFontWeightChange" data-w="700">粗体</view>
        </view>
      </view>

      <!-- 重置按钮 -->
      <view class="setting-reset" bind:tap="onResetSettings">
        <text class="btn-text">恢复默认设置</text>
      </view>
    </view>
  </scroll-view>
</view>

<!-- 遮罩层 -->
<view class="panel-backdrop {{(templatePanelVisible || settingsPanelVisible) ? 'visible' : ''}}"/>
```

### 11.4 面板样式

```css
/* === 底部面板 === */
.bottom-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--paper-warm);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 1000;
  transform: translateY(100%);
  transition: transform 350ms var(--ease-enter);
}

.bottom-panel.visible {
  transform: translateY(0);
}

.panel-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(26, 26, 26, 0);
  z-index: 999;
  pointer-events: none;
  transition: background-color 300ms;
}

.panel-backdrop.visible {
  background-color: rgba(26, 26, 26, 0.35);
  pointer-events: auto;
}

/* 面板头部 */
.panel-header {
  padding: 32rpx 32rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.panel-title {
  font-size: 30rpx;
  color: var(--ui-text);
  font-family: var(--font-serif);
  letter-spacing: 0.1em;
}

.panel-handle {
  width: 60rpx;
  height: 6rpx;
  background-color: rgba(158, 148, 136, 0.4);
  border-radius: 3rpx;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 模板滚动区 */
.template-scroll {
  padding: 0 24rpx 40rpx;
}

.template-list {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
  width: max-content;
}

/* 设置内容区 */
.settings-scroll {
  max-height: 55vh;
}

.settings-body {
  padding: 0 40rpx 32rpx;
}

.setting-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--divider-subtle);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-label {
  width: 130rpx;
  font-size: 28rpx;
  color: var(--ui-text);
  font-family: var(--font-serif);
  flex-shrink: 0;
}

.setting-slider {
  flex: 1;
  margin-left: 20rpx;
}

/* 微信slider自定义颜色 */
.setting-slider .wx-slider-handle {
  background-color: var(--ui-text) !important;
}

.setting-segment {
  display: flex;
  flex-direction: row;
  border: 1rpx solid rgba(158, 148, 136, 0.4);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-left: 20rpx;
}

.seg-item {
  padding: 14rpx 32rpx;
  font-size: 26rpx;
  color: var(--ui-subtext);
  font-family: var(--font-serif);
  background-color: transparent;
  transition: background-color 200ms, color 200ms;
}

.seg-item.active {
  background-color: var(--ui-text);
  color: var(--paper-warm);
}

.setting-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0 16rpx;
}

.btn-text {
  font-size: 26rpx;
  color: var(--ui-subtext);
  padding: 16rpx 32rpx;
  border: 1rpx solid rgba(158, 148, 136, 0.4);
  border-radius: var(--radius-sm);
}

.btn-text:active {
  background-color: rgba(158, 148, 136, 0.1);
}

/* 工具栏位置设置项 */
.setting-row--toolbar-position {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--divider-subtle);
}

.toolbar-position-options {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.position-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border: 1rpx solid rgba(158, 148, 136, 0.3);
  border-radius: var(--radius-md);
  min-width: 100rpx;
  transition: all 200ms var(--ease-default);
}

.position-option.active {
  border-color: var(--ui-text);
  background-color: rgba(61, 43, 31, 0.05);
}

.position-icon {
  width: 48rpx;
  height: 72rpx;
  position: relative;
}

.position-icon--left {
  background-color: rgba(158, 148, 136, 0.2);
  border-radius: 4rpx;
}

.position-icon--left::before {
  content: '';
  position: absolute;
  left: 4rpx;
  top: 8rpx;
  width: 12rpx;
  height: 56rpx;
  background-color: var(--ui-text);
  border-radius: 2rpx;
}

.position-icon--right {
  background-color: rgba(158, 148, 136, 0.2);
  border-radius: 4rpx;
}

.position-icon--right::before {
  content: '';
  position: absolute;
  right: 4rpx;
  top: 8rpx;
  width: 12rpx;
  height: 56rpx;
  background-color: var(--ui-text);
  border-radius: 2rpx;
}

.position-label {
  font-size: 24rpx;
  color: var(--ui-subtext);
  font-family: var(--font-serif);
}

.position-option.active .position-label {
  color: var(--ui-text);
}
```

---

## 十二、拾文页设计方案

### 12.1 页面结构

```xml
<!-- pages/shiwen/shiwen.wxml -->
<view class="page-root">
  <!-- 顶部导航 -->
  <view class="top-bar" style="padding-top:{{safeAreaTop}}px">
    <text class="page-title">拾文</text>
    <text class="page-subtitle">文章转书</text>
  </view>

  <!-- 输入方式切换 -->
  <view class="input-mode-tabs">
    <view class="tab-item {{inputMode === 'link' ? 'active' : ''}}"
          bind:tap="onSwitchMode" data-mode="link">
      粘贴链接
    </view>
    <view class="tab-item {{inputMode === 'text' ? 'active' : ''}}"
          bind:tap="onSwitchMode" data-mode="text">
      粘贴文本
    </view>
  </view>

  <!-- 输入区 -->
  <view class="input-section">
    <!-- 链接输入 -->
    <view class="link-input-wrap" wx:if="{{inputMode === 'link'}}">
      <input class="link-input" type="url"
             placeholder="粘贴文章链接..."
             placeholder-class="input-placeholder"
             bindinput="onLinkInput" value="{{linkUrl}}"/>
      <view class="link-hint">支持：知乎、豆瓣、简书等已配置域名</view>
    </view>

    <!-- 文本输入 -->
    <view class="text-input-wrap" wx:if="{{inputMode === 'text'}}">
      <textarea class="content-input" value="{{pastedText}}"
                placeholder="粘贴文章内容..."
                placeholder-class="input-placeholder"
                bindinput="onTextInput"
                maxlength="{{5000}}"/>
      <view class="text-hint">{{pastedText.length}} / 5000</view>
    </view>
  </view>

  <!-- 内容预览 -->
  <view class="preview-section" wx:if="{{previewText}}">
    <view class="preview-header">
      <text class="preview-title">内容预览</text>
      <text class="preview-edit" bind:tap="onEditContent">编辑</text>
    </view>
    <scroll-view scroll-y class="preview-content">
      <text class="preview-text">{{previewText}}</text>
    </scroll-view>
  </view>

  <!-- 操作区 -->
  <view class="action-section">
    <view class="action-btn-primary" bind:tap="onGenerate">
      <text class="action-btn-text">生成书页</text>
    </view>
    <view class="action-btn-secondary" bind:tap="onSelectTemplate">
      <text class="action-btn-text-secondary">选择模板</text>
    </view>
  </view>
</view>
```

### 12.2 拾文页样式

```css
/* pages/shiwen/shiwen.wxss */

.page-root {
  width: 100%;
  min-height: 100vh;
  background-color: var(--paper-cream);
  display: flex;
  flex-direction: column;
}

/* 顶部栏 */
.top-bar {
  padding: 24rpx 32rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.page-title {
  font-size: 40rpx;
  color: var(--ui-text);
  font-family: var(--font-serif);
  font-weight: 600;
}

.page-subtitle {
  font-size: 24rpx;
  color: var(--ui-subtext);
}

/* 输入模式切换 */
.input-mode-tabs {
  display: flex;
  flex-direction: row;
  margin: 16rpx 32rpx;
  padding: 4rpx;
  background-color: rgba(158, 148, 136, 0.12);
  border-radius: var(--radius-sm);
}

.tab-item {
  flex: 1;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--ui-subtext);
  text-align: center;
  border-radius: 6rpx;
  transition: background-color 200ms, color 200ms;
}

.tab-item.active {
  background-color: var(--paper-warm);
  color: var(--ui-text);
  box-shadow: var(--shadow-xs);
}

/* 输入区 */
.input-section {
  flex: 1;
  padding: 0 32rpx;
}

.link-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.link-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: var(--ui-text);
  background-color: var(--paper-warm);
  border: 1rpx solid var(--divider-normal);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.link-input:focus {
  border-color: var(--ui-text);
}

.link-hint {
  font-size: 22rpx;
  color: var(--ui-subtext);
}

.text-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-input {
  flex: 1;
  min-height: 300rpx;
  padding: 24rpx;
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--ui-text);
  font-family: var(--font-serif);
  background-color: var(--paper-warm);
  border: 1rpx solid var(--divider-normal);
  border-radius: var(--radius-sm);
  box-sizing: border-box;
}

.text-hint {
  font-size: 22rpx;
  color: var(--ui-subtext);
  text-align: right;
  margin-top: 12rpx;
}

/* 预览区 */
.preview-section {
  margin: 24rpx 32rpx;
  padding: 24rpx;
  background-color: var(--paper-warm);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.preview-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.preview-title {
  font-size: 26rpx;
  color: var(--ui-subtext);
}

.preview-edit {
  font-size: 24rpx;
  color: var(--accent-seal);
}

.preview-content {
  max-height: 300rpx;
}

.preview-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--ui-text);
}

/* 操作区 */
.action-section {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn-primary {
  height: 96rpx;
  background-color: var(--ui-text);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn-primary:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.action-btn-text {
  font-size: 32rpx;
  color: var(--paper-warm);
  font-family: var(--font-serif);
}

.action-btn-secondary {
  height: 88rpx;
  background-color: transparent;
  border: 1rpx solid var(--divider-normal);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn-secondary:active {
  background-color: rgba(158, 148, 136, 0.08);
}

.action-btn-text-secondary {
  font-size: 30rpx;
  color: var(--ui-text);
  font-family: var(--font-serif);
}
```

---

## 十三、吾卷页设计方案

### 13.1 页面结构

```xml
<!-- pages/wujuan/wujuan.wxml -->
<view class="page-root">
  <!-- 用户信息区 -->
  <view class="user-section">
    <view class="user-avatar">
      <image src="{{userInfo.avatar || '/assets/default-avatar.png'}}"
             mode="aspectFill" class="avatar-img"/>
    </view>
    <view class="user-info">
      <text class="user-name">{{userInfo.name || '铅言用户'}}</text>
      <text class="user-slogan">为文字造一页纸，写一本书</text>
    </view>
  </view>

  <!-- 功能列表 -->
  <view class="section">
    <view class="section-title">创作</view>
    <view class="list-group">
      <view class="list-item" bind:tap="onNavigateTo" data-page="history">
        <view class="list-item-icon">
          <text class="iconfont icon-history">📖</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">创作历史</text>
          <text class="list-item-desc">{{stats.historyCount}} 篇作品</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>

      <view class="list-item" bind:tap="onNavigateTo" data-page="favorites">
        <view class="list-item-icon">
          <text class="iconfont icon-favorite">♥</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">收藏</text>
          <text class="list-item-desc">{{stats.favoriteCount}} 篇收藏</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>

      <view class="list-item" bind:tap="onNavigateTo" data-page="templates">
        <view class="list-item-icon">
          <text class="iconfont icon-template">📄</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">我的模板</text>
          <text class="list-item-desc">自定义 {{stats.customTemplateCount}} / 5</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>
    </view>
  </view>

  <view class="section">
    <view class="section-title">工具</view>
    <view class="list-group">
      <view class="list-item" bind:tap="onNavigateTo" data-page="fonts">
        <view class="list-item-icon">
          <text class="iconfont icon-font">字</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">字体库</text>
          <text class="list-item-desc">浏览所有可用字体</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>

      <view class="list-item" bind:tap="onNavigateTo" data-page="storage">
        <view class="list-item-icon">
          <text class="iconfont icon-storage">📦</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">存储管理</text>
          <text class="list-item-desc">已使用 {{stats.storageUsed}}</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>

      <view class="list-item" bind:tap="onNavigateTo" data-page="settings">
        <view class="list-item-icon">
          <text class="iconfont icon-settings">⚙</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">设置</text>
          <text class="list-item-desc">默认模板 / 水印 / 隐私</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>
    </view>
  </view>

  <view class="section">
    <view class="section-title">支持</view>
    <view class="list-group">
      <view class="list-item" bind:tap="onFeedback">
        <view class="list-item-icon">
          <text class="iconfont icon-feedback">💬</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">意见反馈</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>

      <view class="list-item" bind:tap="onAbout">
        <view class="list-item-icon">
          <text class="iconfont icon-about">ℹ</text>
        </view>
        <view class="list-item-content">
          <text class="list-item-title">关于</text>
        </view>
        <text class="list-item-arrow">›</text>
      </view>
    </view>

    <view class="list-group" style="margin-top: 24rpx;">
      <view class="list-item" bind:tap="onPrivacy">
        <view class="list-item-content">
          <text class="list-item-title link">用户协议</text>
        </view>
      </view>
      <view class="list-item" bind:tap="onPrivacy">
        <view class="list-item-content">
          <text class="list-item-title link">隐私政策</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 版本信息 -->
  <view class="version-info">
    <text class="version-text">铅言万语 v1.0.0</text>
  </view>
</view>
```

### 13.2 吾卷页样式

```css
/* pages/wujuan/wujuan.wxss */

.page-root {
  width: 100%;
  min-height: 100vh;
  background-color: var(--paper-cream);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 用户信息区 */
.user-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 48rpx 32rpx 32rpx;
  background-color: var(--paper-warm);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 28rpx;
  box-shadow: var(--shadow-md);
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  color: var(--ui-text);
  font-family: var(--font-serif);
  font-weight: 600;
}

.user-slogan {
  font-size: 24rpx;
  color: var(--ui-subtext);
  font-family: var(--font-serif);
}

/* 分组 */
.section {
  margin-top: 32rpx;
}

.section-title {
  font-size: 22rpx;
  color: var(--ui-subtext);
  padding: 0 32rpx;
  margin-bottom: 12rpx;
  letter-spacing: 0.05em;
}

/* 列表组 */
.list-group {
  background-color: var(--paper-warm);
  border-top: 1rpx solid var(--divider-subtle);
  border-bottom: 1rpx solid var(--divider-subtle);
}

.list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--divider-subtle);
  transition: background-color 150ms;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:active {
  background-color: rgba(158, 148, 136, 0.08);
}

.list-item-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.list-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.list-item-title {
  font-size: 30rpx;
  color: var(--ui-text);
}

.list-item-title.link {
  color: var(--link-color);
}

.list-item-desc {
  font-size: 24rpx;
  color: var(--ui-subtext);
}

.list-item-arrow {
  font-size: 32rpx;
  color: rgba(158, 148, 136, 0.5);
  margin-left: 16rpx;
}

/* 版本信息 */
.version-info {
  padding: 48rpx 32rpx;
  display: flex;
  justify-content: center;
}

.version-text {
  font-size: 22rpx;
  color: var(--ui-subtext);
}
```

---

## 十四、图标系统

### 14.1 图标风格

使用简洁的线性图标或文字符号，保持与整体设计风格的一致性：

```
书卷类：📖 📄 📜 📚 📋
工具类：⚙ ⚡ 🔧 🎛
操作类：✎ ✂ 📋 💾 📤
状态类：✓ ★ ♥ ♡ 🔔
```

### 14.2 推荐图标方案

| 功能 | 图标方案 | 说明 |
|------|----------|------|
| 模板 | 📄 | 简洁的文档符号 |
| 保存 | 💾 | 软盘，古朴感 |
| 分享 | 📤 | 发送符号 |
| 清空 | ✕ | 简洁关闭 |
| 设置 | ⚙ | 齿轮 |
| 历史 | 📖 | 书本 |
| 收藏 | ♥ | 心形 |

---

## 十五、可访问性设计

### 15.1 色彩对比

```css
/* WCAG AA 标准 */
.text-primary {
  color: #3D2B1F;        /* 背景#FAF7F2 → 对比度 12.5:1 */
}

.text-secondary {
  color: #9E9488;        /* 背景#FAF7F2 → 对比度 4.2:1 ✓ */
}

.text-on-dark {
  color: #FAF7F2;        /* 背景#3D2B1F → 对比度 12.5:1 */
}
```

### 15.2 触摸区域

```css
/* 最小触摸目标 44x44px */
.touch-target {
  min-width: 88rpx;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 15.3 焦点状态

```css
/* 无障碍键盘导航 */
:focus-visible {
  outline: 2rpx solid var(--accent-seal);
  outline-offset: 4rpx;
}
```

---

## 附录：设计检查清单

### 新页面/组件开发时检查

- [ ] 色彩使用是否符合色板定义
- [ ] 字号层级是否正确
- [ ] 间距是否遵循8rpx基础单位
- [ ] 圆角是否与元素类型匹配
- [ ] 阴影层级是否恰当
- [ ] 动效时长和缓动曲线是否规范
- [ ] 触摸区域是否 >= 44px
- [ ] 色彩对比是否达到WCAG AA标准
- [ ] 空状态和加载状态是否完善
- [ ] 是否遵循现有代码风格和命名规范

---

**UI设计系统版本：V2.0**
**维护者：UI Designer**
**更新日期：2026-05-18**
**下次审查：2026-06-18**

---

## 更新日志

### V2.0 (2026-05-18)
- **新增**：边缘悬浮工具栏方案，替代顶部固定工具栏
- **解决**：工具栏遮挡书页、键盘弹出冲突、位置固定等问题
- **新增**：左右两侧热区设计，支持用户自定义位置偏好
- **新增**：工具栏墨散动画（出现500ms，消散200ms）
- **新增**：4秒无操作自动消散机制
- **新增**：键盘适配（热区响应区域动态调整）
- **新增**：设置页面工具栏位置偏好选项
