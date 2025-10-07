// Options JavaScript for Chromium Plugin Framework

class OptionsManager {
    constructor() {
        this.settings = {};
        this.defaultSettings = {
            // 常规设置
            enablePlugin: true,
            autoStart: false,
            showNotifications: true,
            dataCollection: false,
            
            // 功能设置
            enableHighlight: true,
            enableExtract: true,
            enableScreenshot: true,
            enableAnalyze: true,
            enableContextMenu: true,
            
            // 外观设置
            theme: 'light',
            toolbarPosition: 'top-right',
            toolbarOpacity: 0.9,
            enableAnimations: true,
            
            // 隐私设置
            storageType: 'local',
            dataRetention: 30,
            
            // 高级设置
            debugMode: false,
            performanceMonitoring: false,
            autoUpdate: true
        };
        
        this.init();
    }

    async init() {
        try {
            // 加载设置
            await this.loadSettings();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            console.log('Options 初始化完成');
        } catch (error) {
            console.error('Options 初始化失败:', error);
            this.showNotification('初始化失败', 'error');
        }
    }

    // 加载设置
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            this.settings = { ...this.defaultSettings, ...(result.settings || {}) };
        } catch (error) {
            console.error('加载设置失败:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    // 保存设置
    async saveSettings() {
        try {
            await chrome.storage.sync.set({ settings: this.settings });
            this.showNotification('设置已保存', 'success');
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showNotification('保存失败', 'error');
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航标签页
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // 设置控件
        this.setupSettingControls();

        // 底部按钮
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            window.close();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.showConfirmDialog('重置设置', '确定要重置所有设置为默认值吗？', () => {
                this.resetSettings();
            });
        });

        // 模态框事件
        this.setupModalEvents();

        // 自动保存
        this.setupAutoSave();
    }

    // 设置控件事件
    setupSettingControls() {
        // 切换开关
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const settingName = e.target.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.settings[settingName] = e.target.checked;
                this.updateSetting(settingName, e.target.checked);
            });
        });

        // 选择框
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                const settingName = e.target.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.settings[settingName] = e.target.value;
                this.updateSetting(settingName, e.target.value);
            });
        });

        // 范围滑块
        document.querySelectorAll('input[type="range"]').forEach(range => {
            range.addEventListener('input', (e) => {
                const settingName = e.target.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                const value = parseFloat(e.target.value);
                this.settings[settingName] = value;
                
                // 更新显示值
                const valueDisplay = e.target.parentNode.querySelector('.range-value');
                if (valueDisplay) {
                    valueDisplay.textContent = Math.round(value * 100) + '%';
                }
                
                this.updateSetting(settingName, value);
            });
        });

        // 特殊按钮
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.showConfirmDialog('清除数据', '确定要清除所有插件数据吗？此操作不可撤销！', () => {
                this.clearData();
            });
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-data-input').click();
        });

        document.getElementById('import-data-input').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        document.getElementById('reset-settings-btn').addEventListener('click', () => {
            this.showConfirmDialog('重置设置', '确定要重置所有设置为默认值吗？', () => {
                this.resetSettings();
            });
        });
    }

    // 设置模态框事件
    setupModalEvents() {
        const modal = document.getElementById('confirm-dialog');
        const closeBtn = document.getElementById('confirm-close');
        const cancelBtn = document.getElementById('confirm-cancel');
        const okBtn = document.getElementById('confirm-ok');

        closeBtn.addEventListener('click', () => {
            this.hideConfirmDialog();
        });

        cancelBtn.addEventListener('click', () => {
            this.hideConfirmDialog();
        });

        okBtn.addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
                this.confirmCallback = null;
            }
            this.hideConfirmDialog();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideConfirmDialog();
            }
        });
    }

    // 设置自动保存
    setupAutoSave() {
        // 每30秒自动保存一次
        setInterval(() => {
            this.saveSettings();
        }, 30000);

        // 页面卸载时保存
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    // 初始化UI
    initializeUI() {
        // 设置所有控件的值
        Object.keys(this.settings).forEach(settingName => {
            const element = document.getElementById(settingName.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = this.settings[settingName];
                } else if (element.type === 'range') {
                    element.value = this.settings[settingName];
                    const valueDisplay = element.parentNode.querySelector('.range-value');
                    if (valueDisplay) {
                        valueDisplay.textContent = Math.round(this.settings[settingName] * 100) + '%';
                    }
                } else {
                    element.value = this.settings[settingName];
                }
            }
        });
    }

    // 更新设置
    updateSetting(settingName, value) {
        this.settings[settingName] = value;
        
        // 发送设置更新到background script
        chrome.runtime.sendMessage({
            action: 'updateSettings',
            data: { [settingName]: value }
        }).catch(() => {
            // 忽略发送失败的错误
        });

        // 特殊设置的处理
        this.handleSpecialSettings(settingName, value);
    }

    // 处理特殊设置
    handleSpecialSettings(settingName, value) {
        switch (settingName) {
            case 'enablePlugin':
                this.togglePlugin(value);
                break;
            case 'theme':
                this.applyTheme(value);
                break;
            case 'toolbarPosition':
                this.updateToolbarPosition(value);
                break;
            case 'toolbarOpacity':
                this.updateToolbarOpacity(value);
                break;
            case 'enableContextMenu':
                this.toggleContextMenu(value);
                break;
        }
    }

    // 切换插件状态
    togglePlugin(enabled) {
        chrome.runtime.sendMessage({
            action: 'togglePlugin',
            data: { enabled }
        }).catch(() => {
            // 忽略发送失败的错误
        });
    }

    // 应用主题
    applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        
        // 发送主题更新到content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateTheme',
                    data: { theme }
                }).catch(() => {
                    // 忽略发送失败的错误
                });
            }
        });
    }

    // 更新工具栏位置
    updateToolbarPosition(position) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateToolbarPosition',
                    data: { position }
                }).catch(() => {
                    // 忽略发送失败的错误
                });
            }
        });
    }

    // 更新工具栏透明度
    updateToolbarOpacity(opacity) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateToolbarOpacity',
                    data: { opacity }
                }).catch(() => {
                    // 忽略发送失败的错误
                });
            }
        });
    }

    // 切换右键菜单
    toggleContextMenu(enabled) {
        chrome.runtime.sendMessage({
            action: 'toggleContextMenu',
            data: { enabled }
        }).catch(() => {
            // 忽略发送失败的错误
        });
    }

    // 清除数据
    async clearData() {
        try {
            await chrome.storage.local.clear();
            await chrome.storage.sync.clear();
            this.showNotification('数据已清除', 'success');
        } catch (error) {
            console.error('清除数据失败:', error);
            this.showNotification('清除数据失败', 'error');
        }
    }

    // 导出数据
    exportData() {
        try {
            const data = {
                settings: this.settings,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `chromium-plugin-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('数据已导出', 'success');
        } catch (error) {
            console.error('导出数据失败:', error);
            this.showNotification('导出失败', 'error');
        }
    }

    // 导入数据
    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.settings) {
                this.settings = { ...this.defaultSettings, ...data.settings };
                this.initializeUI();
                await this.saveSettings();
                this.showNotification('数据已导入', 'success');
            } else {
                throw new Error('无效的数据格式');
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            this.showNotification('导入失败: ' + error.message, 'error');
        }
    }

    // 重置设置
    async resetSettings() {
        try {
            this.settings = { ...this.defaultSettings };
            this.initializeUI();
            await this.saveSettings();
            this.showNotification('设置已重置', 'success');
        } catch (error) {
            console.error('重置设置失败:', error);
            this.showNotification('重置失败', 'error');
        }
    }

    // 显示确认对话框
    showConfirmDialog(title, message, callback) {
        const modal = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        this.confirmCallback = callback;
        
        modal.classList.add('show');
    }

    // 隐藏确认对话框
    hideConfirmDialog() {
        const modal = document.getElementById('confirm-dialog');
        modal.classList.remove('show');
        this.confirmCallback = null;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const textEl = notification.querySelector('.notification-text');
        const iconEl = notification.querySelector('.notification-icon');

        textEl.textContent = message;
        notification.className = `notification ${type} show`;

        // 设置图标
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        iconEl.textContent = icons[type] || icons.info;

        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
