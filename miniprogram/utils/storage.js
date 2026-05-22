// utils/storage.js
// 本地存储管理

const KEYS = {
  DRAFT: 'luomo_draft',              // 落墨草稿
  HISTORY: 'history_list',           // 历史记录（导出过的）
  ACTIVE_TEMPLATE: 'active_template', // 当前选中模板ID
  CUSTOM_TEMPLATES: 'custom_templates', // 自定义模板（最多5个）
  SETTINGS: 'user_settings',         // 用户设置
  HAS_VISITED: 'luomo_has_visited'   // 是否已访问过落墨页
}

// 最大历史记录数
const MAX_HISTORY = 50
// 最大自定义模板数
const MAX_CUSTOM_TEMPLATES = 5

/**
 * 保存草稿（每次输入后防抖调用）
 * @param {string} text
 */
function saveDraft(text) {
  try {
    wx.setStorageSync(KEYS.DRAFT, {
      text,
      updatedAt: Date.now()
    })
  } catch (e) {
    console.error('[storage] 保存草稿失败', e)
  }
}

/**
 * 读取草稿
 * @returns {{ text: string, updatedAt: number } | null}
 */
function loadDraft() {
  try {
    return wx.getStorageSync(KEYS.DRAFT) || null
  } catch (e) {
    return null
  }
}

/**
 * 清除草稿
 */
function clearDraft() {
  try {
    wx.removeStorageSync(KEYS.DRAFT)
  } catch (e) {
    // ignore
  }
}

/**
 * 保存激活模板ID
 * @param {string} templateId
 */
function saveActiveTemplate(templateId) {
  try {
    wx.setStorageSync(KEYS.ACTIVE_TEMPLATE, templateId)
  } catch (e) {
    console.error('[storage] 保存模板失败', e)
  }
}

/**
 * 读取激活模板ID
 * @returns {string}
 */
function loadActiveTemplate() {
  try {
    return wx.getStorageSync(KEYS.ACTIVE_TEMPLATE) || 'modern-prose'
  } catch (e) {
    return 'modern-prose'
  }
}

/**
 * 添加历史记录
 * @param {{ id: string, text: string, templateId: string, exportedAt: number, thumbnailPath: string }} record
 */
function addHistory(record) {
  try {
    let list = wx.getStorageSync(KEYS.HISTORY) || []
    // 去重（相同id更新）
    list = list.filter(item => item.id !== record.id)
    list.unshift(record)
    // 限制数量
    if (list.length > MAX_HISTORY) {
      list = list.slice(0, MAX_HISTORY)
    }
    wx.setStorageSync(KEYS.HISTORY, list)
  } catch (e) {
    console.error('[storage] 添加历史失败', e)
  }
}

/**
 * 读取历史记录列表
 * @returns {Array}
 */
function loadHistory() {
  try {
    return wx.getStorageSync(KEYS.HISTORY) || []
  } catch (e) {
    return []
  }
}

/**
 * 删除历史记录
 * @param {string} id
 */
function deleteHistory(id) {
  try {
    let list = wx.getStorageSync(KEYS.HISTORY) || []
    list = list.filter(item => item.id !== id)
    wx.setStorageSync(KEYS.HISTORY, list)
  } catch (e) {
    console.error('[storage] 删除历史失败', e)
  }
}

/**
 * 读取自定义模板
 * @returns {Array}
 */
function loadCustomTemplates() {
  try {
    return wx.getStorageSync(KEYS.CUSTOM_TEMPLATES) || []
  } catch (e) {
    return []
  }
}

/**
 * 保存自定义模板
 * @param {Array} templates
 * @returns {boolean} 是否成功（超出5个上限时返回false）
 */
function saveCustomTemplates(templates) {
  if (templates.length > MAX_CUSTOM_TEMPLATES) {
    return false
  }
  try {
    wx.setStorageSync(KEYS.CUSTOM_TEMPLATES, templates)
    return true
  } catch (e) {
    console.error('[storage] 保存自定义模板失败', e)
    return false
  }
}

/**
 * 读取用户设置
 * @returns {object}
 */
function loadSettings() {
  try {
    return wx.getStorageSync(KEYS.SETTINGS) || {
      watermarkEnabled: true,
      exportQuality: 'high'
    }
  } catch (e) {
    return { watermarkEnabled: true, exportQuality: 'high' }
  }
}

/**
 * 保存用户设置
 * @param {object} settings
 */
function saveSettings(settings) {
  try {
    wx.setStorageSync(KEYS.SETTINGS, settings)
  } catch (e) {
    console.error('[storage] 保存设置失败', e)
  }
}

/**
 * 检查是否为首次访问
 */
function hasVisited() {
  try {
    return wx.getStorageSync(KEYS.HAS_VISITED) || false
  } catch (e) {
    return false
  }
}

/**
 * 标记已访问
 */
function markVisited() {
  try {
    wx.setStorageSync(KEYS.HAS_VISITED, true)
  } catch (e) {
    // ignore
  }
}

module.exports = {
  saveDraft,
  loadDraft,
  clearDraft,
  saveActiveTemplate,
  loadActiveTemplate,
  addHistory,
  loadHistory,
  deleteHistory,
  loadCustomTemplates,
  saveCustomTemplates,
  loadSettings,
  saveSettings,
  hasVisited,
  markVisited,
  MAX_CUSTOM_TEMPLATES
}
