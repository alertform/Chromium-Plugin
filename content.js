// Content Script for Chromium Plugin Framework

// 插件状态管理
const PluginState = {
  initialized: false,
  settings: null,
  elements: new Map(),
  observers: new Map()
};

// 初始化插件
async function initializePlugin() {
  if (PluginState.initialized) return;
  
  try {
    // 获取插件设置
    const settings = await getPluginSettings();
    PluginState.settings = settings;
    
    // 创建插件UI
    createPluginUI();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 设置观察器
    setupObservers();
    
    PluginState.initialized = true;
    console.log('Content script 初始化完成');
    
    // 通知background script初始化完成
    sendMessageToBackground({
      action: 'contentScriptReady',
      data: { url: window.location.href, title: document.title }
    });
    
  } catch (error) {
    console.error('Content script 初始化失败:', error);
  }
}

// 获取插件设置
async function getPluginSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        // 使用默认设置
        resolve({
          enabled: true,
          autoRun: false,
          theme: 'light',
          notifications: true
        });
      }
    });
  });
}

// 创建插件UI
function createPluginUI() {
  // 创建主容器
  const container = document.createElement('div');
  container.id = 'chromium-plugin-container';
  container.className = 'plugin-container';
  
  // 创建工具栏
  const toolbar = createToolbar();
  container.appendChild(toolbar);
  
  // 创建侧边栏
  const sidebar = createSidebar();
  container.appendChild(sidebar);
  
  // 创建浮动按钮
  const floatingButton = createFloatingButton();
  container.appendChild(floatingButton);
  
  document.body.appendChild(container);
  PluginState.elements.set('container', container);
}

// 创建工具栏
function createToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'plugin-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-content">
      <span class="plugin-title">Chromium Plugin</span>
      <div class="toolbar-actions">
        <button id="plugin-action-btn" class="action-btn">执行操作</button>
        <button id="plugin-settings-btn" class="action-btn">设置</button>
        <button id="plugin-toggle-btn" class="action-btn toggle">隐藏</button>
      </div>
    </div>
  `;
  
  // 添加事件监听器
  toolbar.querySelector('#plugin-action-btn').addEventListener('click', handleActionClick);
  toolbar.querySelector('#plugin-settings-btn').addEventListener('click', handleSettingsClick);
  toolbar.querySelector('#plugin-toggle-btn').addEventListener('click', handleToggleClick);
  
  return toolbar;
}

// 创建侧边栏
function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.className = 'plugin-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>插件功能</h3>
      <button id="sidebar-close" class="close-btn">&times;</button>
    </div>
    <div class="sidebar-content">
      <div class="feature-section">
        <h4>页面操作</h4>
        <button class="feature-btn" data-action="highlight">高亮文本</button>
        <button class="feature-btn" data-action="extract">提取数据</button>
        <button class="feature-btn" data-action="screenshot">截图</button>
      </div>
      <div class="feature-section">
        <h4>页面信息</h4>
        <div id="page-info" class="info-display">
          <p><strong>URL:</strong> <span id="current-url"></span></p>
          <p><strong>标题:</strong> <span id="current-title"></span></p>
          <p><strong>元素数:</strong> <span id="element-count"></span></p>
        </div>
      </div>
      <div class="feature-section">
        <h4>插件状态</h4>
        <div class="status-indicators">
          <div class="status-item">
            <span class="status-label">状态:</span>
            <span id="plugin-status" class="status-value active">运行中</span>
          </div>
          <div class="status-item">
            <span class="status-label">版本:</span>
            <span class="status-value">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 更新页面信息
  updatePageInfo();
  
  // 添加事件监听器
  sidebar.querySelector('#sidebar-close').addEventListener('click', () => {
    sidebar.style.display = 'none';
  });
  
  sidebar.querySelectorAll('.feature-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      handleFeatureAction(action);
    });
  });
  
  return sidebar;
}

// 创建浮动按钮
function createFloatingButton() {
  const button = document.createElement('div');
  button.className = 'plugin-floating-btn';
  button.innerHTML = '⚙️';
  button.title = '打开插件面板';
  
  button.addEventListener('click', () => {
    const sidebar = document.querySelector('.plugin-sidebar');
    if (sidebar) {
      sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  return button;
}

// 设置事件监听器
function setupEventListeners() {
  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
  });
  
  // 监听页面变化
  window.addEventListener('beforeunload', () => {
    cleanup();
  });
  
  // 监听键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      togglePlugin();
    }
  });
}

// 处理消息
function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'pluginAction1':
      handlePluginAction1(message.data);
      sendResponse({ success: true });
      break;
      
    case 'specialHandling':
      handleSpecialHandling(message.data);
      sendResponse({ success: true });
      break;
      
    case 'updateSettings':
      updateSettings(message.data);
      sendResponse({ success: true });
      break;
      
    case 'performAction':
      performAction(message.data).then(result => {
        sendResponse({ success: true, data: result });
      });
      return true; // 保持消息通道开放
      
    case 'fillForm':
      handleFillForm(message.data, sendResponse);
      return true; // 保持消息通道开放
      
    default:
      sendResponse({ success: false, error: '未知操作' });
  }
}

// 处理插件操作1
function handlePluginAction1(data) {
  console.log('执行插件操作1:', data);
  
  // 高亮页面中的特定文本
  const textToHighlight = '重要';
  highlightText(textToHighlight);
  
  // 显示通知
  showNotification('插件操作1已执行', 'success');
}

// 处理特殊网站处理
function handleSpecialHandling(data) {
  console.log('特殊网站处理:', data);
  
  // 根据网站类型执行不同的处理逻辑
  if (data.site === 'example.com') {
    // 示例网站的特殊处理
    addCustomStyles();
    modifyPageElements();
  }
}

// 更新设置
function updateSettings(newSettings) {
  PluginState.settings = { ...PluginState.settings, ...newSettings };
  
  // 应用新设置
  applySettings();
}

// 应用设置
function applySettings() {
  const settings = PluginState.settings;
  if (!settings) return;
  
  // 应用主题
  document.body.classList.toggle('plugin-dark-theme', settings.theme === 'dark');
  
  // 应用其他设置
  const container = PluginState.elements.get('container');
  if (container) {
    container.style.display = settings.enabled ? 'block' : 'none';
  }
}

// 设置观察器
function setupObservers() {
  // 观察DOM变化
  const domObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        handleDOMChanges(mutation);
      }
    });
  });
  
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  PluginState.observers.set('dom', domObserver);
  
  // 观察页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausePlugin();
    } else {
      resumePlugin();
    }
  });
}

// 处理DOM变化
function handleDOMChanges(mutation) {
  // 可以在这里添加DOM变化时的处理逻辑
  console.log('DOM发生变化:', mutation);
  
  // 更新页面信息
  updatePageInfo();
}

// 更新页面信息
function updatePageInfo() {
  const urlSpan = document.getElementById('current-url');
  const titleSpan = document.getElementById('current-title');
  const countSpan = document.getElementById('element-count');
  
  if (urlSpan) urlSpan.textContent = window.location.href;
  if (titleSpan) titleSpan.textContent = document.title;
  if (countSpan) countSpan.textContent = document.querySelectorAll('*').length;
}

// 事件处理函数
function handleActionClick() {
  console.log('执行主要操作');
  
  // 执行一些有用的操作
  const result = {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    elements: document.querySelectorAll('*').length
  };
  
  // 发送结果到background script
  sendMessageToBackground({
    action: 'actionCompleted',
    data: result
  });
  
  showNotification('操作已执行', 'success');
}

function handleSettingsClick() {
  chrome.runtime.openOptionsPage();
}

function handleToggleClick() {
  togglePlugin();
}

function handleFeatureAction(action) {
  switch (action) {
    case 'highlight':
      highlightText(prompt('请输入要高亮的文本:'));
      break;
    case 'extract':
      extractPageData();
      break;
    case 'screenshot':
      takeScreenshot();
      break;
  }
}

// 处理表单填充
function handleFillForm(data, sendResponse) {
  try {
    const text = data.text;
    if (!text) {
      sendResponse({ success: false, error: '没有提供要填充的文本' });
      return;
    }
    
    // 尝试自动填充到各种表单字段
    const filledFields = autoFillForm(text);
    
    if (filledFields.length > 0) {
      showNotification(`已填充 ${filledFields.length} 个表单字段`, 'success');
      sendResponse({ success: true, data: { filledFields } });
    } else {
      showNotification('未找到可填充的表单字段', 'info');
      sendResponse({ success: false, error: '未找到可填充的表单字段' });
    }
  } catch (error) {
    console.error('表单填充失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 自动填充表单
function autoFillForm(text) {
  const filledFields = [];
  
  // 查找所有输入框
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
  
  inputs.forEach(input => {
    const name = input.name ? input.name.toLowerCase() : '';
    const id = input.id ? input.id.toLowerCase() : '';
    const placeholder = input.placeholder ? input.placeholder.toLowerCase() : '';
    const label = getLabelForInput(input);
    
    // 根据字段类型和内容匹配
    if (shouldFillField(name, id, placeholder, label, text)) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filledFields.push({
        field: input.name || input.id || 'unknown',
        value: text,
        type: input.type
      });
    }
  });
  
  return filledFields;
}

// 判断是否应该填充字段
function shouldFillField(name, id, placeholder, label, text) {
  const fieldText = `${name} ${id} ${placeholder} ${label}`.toLowerCase();
  
  // 根据文本内容判断字段类型
  if (isName(text) && (fieldText.includes('name') || fieldText.includes('姓名') || fieldText.includes('名字'))) {
    return true;
  }
  
  if (isPhone(text) && (fieldText.includes('phone') || fieldText.includes('tel') || fieldText.includes('电话') || fieldText.includes('手机'))) {
    return true;
  }
  
  if (isEmail(text) && (fieldText.includes('email') || fieldText.includes('邮箱') || fieldText.includes('邮件'))) {
    return true;
  }
  
  if (isIdCard(text) && (fieldText.includes('id') || fieldText.includes('身份证') || fieldText.includes('证件'))) {
    return true;
  }
  
  if (isDate(text) && (fieldText.includes('date') || fieldText.includes('birth') || fieldText.includes('日期') || fieldText.includes('出生'))) {
    return true;
  }
  
  if (isAddress(text) && (fieldText.includes('address') || fieldText.includes('city') || fieldText.includes('地址') || fieldText.includes('城市'))) {
    return true;
  }
  
  return false;
}

// 获取输入框的标签
function getLabelForInput(input) {
  // 尝试通过for属性找到标签
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent;
  }
  
  // 尝试找到父级标签
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent;
  
  // 尝试找到前面的标签元素
  const prevElement = input.previousElementSibling;
  if (prevElement && prevElement.tagName === 'LABEL') {
    return prevElement.textContent;
  }
  
  return '';
}

// 文本类型判断函数
function isName(text) {
  return /^[\u4e00-\u9fa5]{2,4}$/.test(text) || /^[a-zA-Z\s]{2,20}$/.test(text);
}

function isPhone(text) {
  return /^1[3-9]\d{9}$/.test(text) || /^\d{11}$/.test(text);
}

function isEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function isIdCard(text) {
  return /^\d{17}[\dXx]$/.test(text);
}

function isDate(text) {
  return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text) || /^\d{4}年\d{1,2}月\d{1,2}日$/.test(text);
}

function isAddress(text) {
  return text.length > 5 && (text.includes('市') || text.includes('省') || text.includes('区') || text.includes('县'));
}

// 工具函数
function highlightText(text) {
  if (!text) return;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    if (node.textContent.includes(text)) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const parent = textNode.parentNode;
    const highlighted = document.createElement('span');
    highlighted.className = 'plugin-highlight';
    highlighted.textContent = textNode.textContent;
    parent.replaceChild(highlighted, textNode);
  });
  
  showNotification(`已高亮 "${text}"`, 'info');
}

function extractPageData() {
  const data = {
    title: document.title,
    url: window.location.href,
    text: document.body.innerText.substring(0, 1000),
    images: Array.from(document.images).map(img => img.src),
    links: Array.from(document.links).map(link => link.href),
    forms: Array.from(document.forms).map(form => ({
      action: form.action,
      method: form.method,
      inputs: Array.from(form.elements).map(input => input.name)
    }))
  };
  
  console.log('提取的页面数据:', data);
  showNotification('页面数据已提取', 'success');
  
  // 发送数据到background script
  sendMessageToBackground({
    action: 'dataExtracted',
    data: data
  });
}

function takeScreenshot() {
  // 使用chrome.tabs.captureVisibleTab API
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      showNotification('截图失败: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    
    showNotification('截图已保存', 'success');
  });
}

function togglePlugin() {
  const container = PluginState.elements.get('container');
  if (container) {
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
    
    const toggleBtn = document.getElementById('plugin-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = isVisible ? '显示' : '隐藏';
    }
  }
}

function pausePlugin() {
  console.log('插件已暂停');
  // 暂停插件活动
}

function resumePlugin() {
  console.log('插件已恢复');
  // 恢复插件活动
}

function cleanup() {
  // 清理观察器
  PluginState.observers.forEach(observer => observer.disconnect());
  PluginState.observers.clear();
  
  // 清理元素
  PluginState.elements.clear();
  
  console.log('Content script 已清理');
}

function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `plugin-notification ${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 自动移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function sendMessageToBackground(message) {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('发送消息失败:', chrome.runtime.lastError);
    }
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePlugin);
} else {
  initializePlugin();
}
