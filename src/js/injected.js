// Injected Script for Chromium Plugin Framework
// 这个脚本会被注入到页面中执行

(function() {
    'use strict';
    
    // 避免重复注入
    if (window.chromiumPluginInjected) {
        return;
    }
    window.chromiumPluginInjected = true;
    
    console.log('Chromium Plugin injected script loaded');
    
    // 插件功能对象
    const PluginFeatures = {
        // 高亮文本
        highlightText: function(text, options = {}) {
            const defaultOptions = {
                backgroundColor: '#ffff00',
                color: '#000000',
                className: 'plugin-highlight',
                caseSensitive: false
            };
            
            const config = { ...defaultOptions, ...options };
            const searchText = config.caseSensitive ? text : text.toLowerCase();
            
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            
            while (node = walker.nextNode()) {
                const nodeText = config.caseSensitive ? node.textContent : node.textContent.toLowerCase();
                if (nodeText.includes(searchText)) {
                    textNodes.push(node);
                }
            }
            
            textNodes.forEach(textNode => {
                const parent = textNode.parentNode;
                const highlighted = document.createElement('span');
                highlighted.className = config.className;
                highlighted.style.backgroundColor = config.backgroundColor;
                highlighted.style.color = config.color;
                highlighted.style.padding = '2px 4px';
                highlighted.style.border-radius = '3px';
                highlighted.textContent = textNode.textContent;
                parent.replaceChild(highlighted, textNode);
            });
            
            return textNodes.length;
        },
        
        // 移除高亮
        removeHighlight: function(className = 'plugin-highlight') {
            const highlightedElements = document.querySelectorAll(`.${className}`);
            highlightedElements.forEach(element => {
                const parent = element.parentNode;
                parent.replaceChild(document.createTextNode(element.textContent), element);
                parent.normalize();
            });
        },
        
        // 提取页面数据
        extractPageData: function() {
            return {
                title: document.title,
                url: window.location.href,
                domain: window.location.hostname,
                text: document.body.innerText,
                textLength: document.body.innerText.length,
                elementCount: document.querySelectorAll('*').length,
                imageCount: document.images.length,
                linkCount: document.links.length,
                formCount: document.forms.length,
                images: Array.from(document.images).map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.width,
                    height: img.height
                })),
                links: Array.from(document.links).map(link => ({
                    href: link.href,
                    text: link.textContent,
                    title: link.title
                })),
                forms: Array.from(document.forms).map(form => ({
                    action: form.action,
                    method: form.method,
                    inputs: Array.from(form.elements).map(input => ({
                        name: input.name,
                        type: input.type,
                        value: input.value,
                        placeholder: input.placeholder
                    }))
                })),
                meta: {
                    description: document.querySelector('meta[name="description"]')?.content || '',
                    keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                    author: document.querySelector('meta[name="author"]')?.content || '',
                    viewport: document.querySelector('meta[name="viewport"]')?.content || ''
                },
                timestamp: Date.now()
            };
        },
        
        // 页面分析
        analyzePage: function() {
            const data = this.extractPageData();
            
            // 分析页面结构
            const analysis = {
                ...data,
                structure: {
                    headings: {
                        h1: document.querySelectorAll('h1').length,
                        h2: document.querySelectorAll('h2').length,
                        h3: document.querySelectorAll('h3').length,
                        h4: document.querySelectorAll('h4').length,
                        h5: document.querySelectorAll('h5').length,
                        h6: document.querySelectorAll('h6').length
                    },
                    sections: document.querySelectorAll('section').length,
                    articles: document.querySelectorAll('article').length,
                    navs: document.querySelectorAll('nav').length,
                    asides: document.querySelectorAll('aside').length,
                    footers: document.querySelectorAll('footer').length
                },
                performance: {
                    loadTime: performance.timing ? 
                        performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
                    domContentLoaded: performance.timing ?
                        performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0
                },
                accessibility: {
                    imagesWithoutAlt: Array.from(document.images).filter(img => !img.alt).length,
                    linksWithoutText: Array.from(document.links).filter(link => !link.textContent.trim()).length,
                    headingsWithoutText: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                        .filter(heading => !heading.textContent.trim()).length
                },
                seo: {
                    titleLength: document.title.length,
                    metaDescriptionLength: data.meta.description.length,
                    hasH1: document.querySelectorAll('h1').length > 0,
                    hasMetaDescription: !!data.meta.description,
                    hasMetaKeywords: !!data.meta.keywords
                }
            };
            
            return analysis;
        },
        
        // 截图功能（需要background script支持）
        takeScreenshot: function() {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'takeScreenshot'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });
        },
        
        // 查找和替换文本
        findAndReplace: function(findText, replaceText, options = {}) {
            const defaultOptions = {
                caseSensitive: false,
                wholeWord: false,
                regex: false
            };
            
            const config = { ...defaultOptions, ...options };
            let searchText = findText;
            
            if (config.regex) {
                try {
                    const flags = config.caseSensitive ? 'g' : 'gi';
                    searchText = new RegExp(findText, flags);
                } catch (e) {
                    console.error('Invalid regex pattern:', e);
                    return 0;
                }
            } else if (!config.caseSensitive) {
                searchText = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            }
            
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let replacementCount = 0;
            let node;
            
            while (node = walker.nextNode()) {
                if (node.parentNode && node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
                    const originalText = node.textContent;
                    let newText;
                    
                    if (config.regex) {
                        newText = originalText.replace(searchText, replaceText);
                    } else if (config.wholeWord) {
                        const wordBoundary = config.caseSensitive ? 
                            new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g') :
                            new RegExp(`\\b${findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                        newText = originalText.replace(wordBoundary, replaceText);
                    } else {
                        newText = originalText.replace(searchText, replaceText);
                    }
                    
                    if (newText !== originalText) {
                        node.textContent = newText;
                        replacementCount++;
                    }
                }
            }
            
            return replacementCount;
        },
        
        // 添加自定义样式
        addCustomStyles: function(css) {
            const styleId = 'chromium-plugin-custom-styles';
            let styleElement = document.getElementById(styleId);
            
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = css;
        },
        
        // 移除自定义样式
        removeCustomStyles: function() {
            const styleElement = document.getElementById('chromium-plugin-custom-styles');
            if (styleElement) {
                styleElement.remove();
            }
        },
        
        // 监听页面变化
        observeChanges: function(callback) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        callback(mutation);
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            return observer;
        },
        
        // 获取页面统计信息
        getPageStats: function() {
            return {
                elementCount: document.querySelectorAll('*').length,
                textLength: document.body.innerText.length,
                imageCount: document.images.length,
                linkCount: document.links.length,
                formCount: document.forms.length,
                scriptCount: document.scripts.length,
                styleCount: document.querySelectorAll('style, link[rel="stylesheet"]').length,
                iframeCount: document.querySelectorAll('iframe').length,
                videoCount: document.querySelectorAll('video').length,
                audioCount: document.querySelectorAll('audio').length,
                canvasCount: document.querySelectorAll('canvas').length,
                svgCount: document.querySelectorAll('svg').length
            };
        },
        
        // 滚动到元素
        scrollToElement: function(selector) {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return true;
            }
            return false;
        },
        
        // 高亮元素
        highlightElement: function(selector, options = {}) {
            const defaultOptions = {
                backgroundColor: '#ffff00',
                border: '2px solid #ff0000',
                duration: 3000
            };
            
            const config = { ...defaultOptions, ...options };
            const element = document.querySelector(selector);
            
            if (element) {
                const originalStyle = {
                    backgroundColor: element.style.backgroundColor,
                    border: element.style.border
                };
                
                element.style.backgroundColor = config.backgroundColor;
                element.style.border = config.border;
                
                if (config.duration > 0) {
                    setTimeout(() => {
                        element.style.backgroundColor = originalStyle.backgroundColor;
                        element.style.border = originalStyle.border;
                    }, config.duration);
                }
                
                return true;
            }
            
            return false;
        }
    };
    
    // 将功能暴露到全局
    window.ChromiumPlugin = PluginFeatures;
    
    // 监听来自content script的消息
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        const { action, data, requestId } = event.data;
        
        if (action && action.startsWith('plugin:')) {
            const methodName = action.replace('plugin:', '');
            
            if (typeof PluginFeatures[methodName] === 'function') {
                try {
                    const result = PluginFeatures[methodName](...data);
                    
                    // 发送结果回content script
                    window.postMessage({
                        type: 'plugin-response',
                        requestId,
                        success: true,
                        data: result
                    }, '*');
                } catch (error) {
                    window.postMessage({
                        type: 'plugin-response',
                        requestId,
                        success: false,
                        error: error.message
                    }, '*');
                }
            }
        }
    });
    
    // 通知content script注入完成
    window.postMessage({
        type: 'plugin-injected',
        data: { timestamp: Date.now() }
    }, '*');
    
    console.log('Chromium Plugin injected script ready');
    
})();
