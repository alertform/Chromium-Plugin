// Background Script (Service Worker) for Chromium Plugin Framework

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  console.log('插件已安装/更新:', details.reason);
  
  // 创建右键菜单
  createContextMenus();
  
  // 设置默认存储
  initializeStorage();
});

// 创建右键菜单
function createContextMenus() {
  try {
    chrome.contextMenus.create({
      id: 'plugin-highlight',
      title: '高亮文本',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'plugin-extract',
      title: '提取数据',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'separator',
      type: 'separator',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'plugin-settings',
      title: '打开插件设置',
      contexts: ['page']
    });
  } catch (error) {
    console.error('创建右键菜单失败:', error);
  }
}

// 初始化存储
async function initializeStorage() {
  try {
    const defaultSettings = {
      enabled: true,
      autoRun: false,
      theme: 'light',
      notifications: true,
      debugMode: false
    };
    
    await chrome.storage.local.set({ settings: defaultSettings });
    console.log('默认设置已初始化');
  } catch (error) {
    console.error('初始化存储失败:', error);
  }
}

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('右键菜单点击:', info.menuItemId);
  
  switch (info.menuItemId) {
    case 'plugin-highlight':
      if (info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'highlightText',
          data: { text: info.selectionText }
        });
      }
      break;
      
    case 'plugin-extract':
      chrome.tabs.sendMessage(tab.id, {
        action: 'extractData'
      });
      break;
      
    case 'plugin-settings':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// 处理来自popup和content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);
  
  switch (message.action) {
    case 'test':
      sendResponse({ success: true, message: 'Background script is working' });
      break;
      
    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse({ success: true, data: result.settings });
      });
      return true; // 保持消息通道开放
      
    case 'updateSettings':
      chrome.storage.local.set({ settings: message.data }, () => {
        sendResponse({ success: true });
      });
      return true; // 保持消息通道开放
      
    default:
      sendResponse({ success: false, message: 'Unknown action' });
  }
});

// 处理标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('标签页更新:', tab.url);
  }
});

console.log('Background script loaded successfully');