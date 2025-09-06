// Popup JavaScript for Chromium Plugin Framework

// 显示状态消息
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// 测试函数
function testFunction(action) {
    showStatus(`正在执行: ${action}`, 'info');
    
    try {
        // 获取当前标签页
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                // 向content script发送消息
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: action,
                    data: { timestamp: Date.now() }
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        showStatus(`错误: ${chrome.runtime.lastError.message}`, 'error');
                    } else {
                        showStatus(`${action} 执行成功`, 'success');
                    }
                });
            } else {
                showStatus('无法获取当前标签页', 'error');
            }
        });
    } catch (error) {
        showStatus(`错误: ${error.message}`, 'error');
    }
}

// 打开设置
function openSettings() {
    try {
        chrome.runtime.openOptionsPage();
        showStatus('设置页面已打开', 'success');
    } catch (error) {
        showStatus(`打开设置失败: ${error.message}`, 'error');
    }
}

// 测试通知
function testNotification() {
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '插件测试',
            message: '通知功能正常工作！'
        });
        showStatus('通知已发送', 'success');
    } catch (error) {
        showStatus(`通知失败: ${error.message}`, 'error');
    }
}

// 选择PDF文件 (方法1: 使用隐藏的输入框)
function selectPDFFile() {
    try {
        console.log('尝试选择PDF文件...');
        const fileInput = document.getElementById('pdfFile');
        
        if (!fileInput) {
            showStatus('文件输入框未找到', 'error');
            return;
        }
        
        console.log('文件输入框找到:', fileInput);
        
        // 清除之前的选择
        fileInput.value = '';
        
        // 触发点击事件
        fileInput.click();
        
        showStatus('正在打开文件选择对话框...', 'info');
        
    } catch (error) {
        console.error('选择文件失败:', error);
        showStatus('选择文件失败: ' + error.message, 'error');
    }
}

// 选择PDF文件 (方法2: 动态创建输入框)
function selectPDFFileDynamic() {
    try {
        console.log('使用动态方法选择PDF文件...');
        
        // 创建文件输入框
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf';
        fileInput.style.display = 'none';
        
        // 设置文件选择处理
        fileInput.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                console.log('动态方法选择的文件:', file.name, file.type, file.size);
                handlePDFFile(file);
            }
        };
        
        // 添加到页面并触发点击
        document.body.appendChild(fileInput);
        fileInput.click();
        
        // 清理
        setTimeout(() => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }, 1000);
        
        showStatus('正在打开文件选择对话框 (动态方法)...', 'info');
        
    } catch (error) {
        console.error('动态选择文件失败:', error);
        showStatus('动态选择文件失败: ' + error.message, 'error');
    }
}

// 处理PDF文件
function handlePDFFile(file) {
    if (file.type !== 'application/pdf') {
        showStatus('请选择PDF文件', 'error');
        return;
    }
    
    showStatus('正在解析PDF文件...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        parsePDF(e.target.result);
    };
    reader.onerror = function(error) {
        console.error('文件读取失败:', error);
        showStatus('文件读取失败', 'error');
    };
    reader.readAsArrayBuffer(file);
}

// 处理PDF文件上传
function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('选择的文件:', file.name, file.type, file.size);
    
    if (file.type !== 'application/pdf') {
        showStatus('请选择PDF文件', 'error');
        return;
    }
    
    showStatus('正在解析PDF文件...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        parsePDF(e.target.result);
    };
    reader.onerror = function(error) {
        console.error('文件读取失败:', error);
        showStatus('文件读取失败', 'error');
    };
    reader.readAsArrayBuffer(file);
}

// 解析PDF文件
async function parsePDF(arrayBuffer) {
    try {
        // 加载PDF解析库
        if (typeof PDFParser === 'undefined') {
            await loadPDFLibrary();
        }
        
        const pdfData = await PDFParser.parsePDF(arrayBuffer);
        const resumeInfo = ResumeExtractor.extractResumeInfo(pdfData.text);
        
        displayResumeInfo(resumeInfo);
        showStatus('PDF解析完成', 'success');
        
    } catch (error) {
        console.error('PDF解析错误:', error);
        showStatus(`PDF解析失败: ${error.message}`, 'error');
    }
}

// 加载PDF解析库
function loadPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof PDFParser !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('libs/pdf.min.js');
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 显示简历信息
function displayResumeInfo(info) {
    const resumeInfoDiv = document.getElementById('resumeInfo');
    const extractedInfoDiv = document.getElementById('extractedInfo');
    
    let html = '<div style="font-size: 12px; line-height: 1.4;">';
    
    const fields = [
        { key: 'name', label: '姓名', icon: '👤' },
        { key: 'age', label: '年龄', icon: '🎂' },
        { key: 'idCard', label: '身份证号', icon: '🆔' },
        { key: 'birthDate', label: '出生日期', icon: '📅' },
        { key: 'gender', label: '性别', icon: '⚥' },
        { key: 'nationality', label: '民族', icon: '🏛️' },
        { key: 'city', label: '现居住城市', icon: '🏙️' },
        { key: 'phone', label: '电话', icon: '📞' },
        { key: 'email', label: '邮箱', icon: '📧' }
    ];
    
    fields.forEach(field => {
        if (info[field.key]) {
            html += `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                <span style="font-weight: bold;">${field.icon} ${field.label}:</span>
                <span style="margin-left: 10px;">${info[field.key]}</span>
                <button onclick="copyToClipboard('${info[field.key]}')" style="float: right; background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">复制</button>
            </div>`;
        }
    });
    
    if (info.education) {
        html += `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span style="font-weight: bold;">🎓 教育背景:</span>
            <div style="margin-top: 5px; font-size: 11px;">${info.education}</div>
            <button onclick="copyToClipboard('${info.education}')" style="float: right; background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">复制</button>
        </div>`;
    }
    
    if (info.experience) {
        html += `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            <span style="font-weight: bold;">💼 工作经历:</span>
            <div style="margin-top: 5px; font-size: 11px;">${info.experience}</div>
            <button onclick="copyToClipboard('${info.experience}')" style="float: right; background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">复制</button>
        </div>`;
    }
    
    html += '</div>';
    
    extractedInfoDiv.innerHTML = html;
    resumeInfoDiv.style.display = 'block';
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showStatus('已复制到剪贴板', 'success');
        
        // 尝试自动填充到网页表单
        fillWebForm(text);
    }).catch(err => {
        console.error('复制失败:', err);
        showStatus('复制失败', 'error');
    });
}

// 自动填充网页表单
function fillWebForm(text) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'fillForm',
                data: { text: text }
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('无法填充表单:', chrome.runtime.lastError.message);
                } else if (response && response.success) {
                    showStatus('已自动填充到表单', 'success');
                }
            });
        }
    });
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('弹出窗口已加载');
    showStatus('插件已就绪，可以开始测试', 'success');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 检查Chrome API是否可用
    if (typeof chrome === 'undefined') {
        showStatus('Chrome API不可用', 'error');
        return;
    }
    
    if (!chrome.tabs) {
        showStatus('Chrome Tabs API不可用', 'error');
        return;
    }
    
    if (!chrome.runtime) {
        showStatus('Chrome Runtime API不可用', 'error');
        return;
    }
    
    // 获取当前标签页信息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            console.log('当前标签页:', tabs[0].title);
            showStatus(`当前页面: ${tabs[0].title.substring(0, 30)}...`, 'info');
        } else {
            showStatus('无法获取当前标签页', 'error');
        }
    });
});

// 设置事件监听器
function setupEventListeners() {
    // PDF文件选择按钮
    document.getElementById('selectPDFBtn').addEventListener('click', selectPDFFile);
    document.getElementById('selectPDFDynamicBtn').addEventListener('click', selectPDFFileDynamic);
    
    // 文件输入框变化事件
    document.getElementById('pdfFile').addEventListener('change', handlePDFUpload);
    
    // 快速操作按钮
    document.getElementById('highlightBtn').addEventListener('click', () => testFunction('highlight'));
    document.getElementById('extractBtn').addEventListener('click', () => testFunction('extract'));
    document.getElementById('screenshotBtn').addEventListener('click', () => testFunction('screenshot'));
    document.getElementById('analyzeBtn').addEventListener('click', () => testFunction('analyze'));
    
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('notificationBtn').addEventListener('click', testNotification);
}

// 错误处理
window.addEventListener('error', function(event) {
    console.error('弹出窗口错误:', event.error);
    showStatus(`错误: ${event.error.message}`, 'error');
});