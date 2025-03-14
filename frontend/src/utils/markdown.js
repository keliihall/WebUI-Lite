import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';

// 注册常用语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);

// 配置 marked
marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function(code, language) {
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(code, { language: validLanguage }).value;
    },
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartypants: false,
    xhtml: false
});

// 自定义渲染器
const renderer = new marked.Renderer();

// 自定义代码块渲染
renderer.code = (code, language) => {
    const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
    const highlightedCode = hljs.highlight(code, { language: validLanguage }).value;
    
    return `<div class="relative group">
        <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="copy-button p-1 rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                    onclick="navigator.clipboard.writeText(this.parentElement.parentElement.querySelector('code').textContent)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
            </button>
        </div>
        <pre class="bg-gray-100 dark:!bg-gray-800/50 !p-4 !rounded-lg"><code class="text-gray-800 dark:text-gray-200 language-${validLanguage}">${highlightedCode}</code></pre>
    </div>`;
};

// 自定义链接渲染
renderer.link = (href, title, text) => {
    return `<a href="${href}" title="${title || ''}" 
               class="text-primary hover:text-primary/90 underline" 
               target="_blank" rel="noopener noreferrer">${text}</a>`;
};

// 自定义图片渲染
renderer.image = (href, title, text) => {
    return `<img src="${href}" alt="${text}" title="${title || ''}" 
            class="max-w-full h-auto rounded-lg shadow-lg" 
            loading="lazy">`;
};

marked.use({ renderer });

/**
 * 渲染 Markdown 文本
 * @param {string} text - 要渲染的 Markdown 文本
 * @returns {string} 渲染后的 HTML
 */
export function renderMarkdown(text) {
    if (!text) return '';
    try {
        // 提取并保存 think 标签中的内容
        const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
        const thinkContents = [];
        text = text.replace(thinkRegex, (match, content) => {
            thinkContents.push(content.trim());
            return '%%THINK_CONTENT_' + (thinkContents.length - 1) + '%%';
        });

        // 先进行 Markdown 渲染
        let rendered = marked(text);

        // 还原 think 内容
        thinkContents.forEach((content, index) => {
            const placeholder = '%%THINK_CONTENT_' + index + '%%';
            rendered = rendered.replace(placeholder, `
                <div class="thinking-content text-base" x-data="{ isOpen: false }">
                    <div class="thinking-header cursor-pointer select-none" @click="isOpen = !isOpen">
                        <div class="thinking-start">
                            <svg class="w-4 h-4 transform transition-transform" :class="{ '-rotate-90': !isOpen }" 
                                 viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                            深度思考...
                        </div>
                    </div>
                    <div class="thinking-body overflow-hidden transition-all duration-300 ease-in-out" 
                         x-ref="content" 
                         x-bind:style="isOpen ? 'max-height: ' + $refs.content.scrollHeight + 'px' : 'max-height: 0px'">
                        <div class="text-gray-700 dark:text-gray-300 py-3">${content}</div>
                    </div>
                    <div class="thinking-end" x-show="isOpen" x-transition:enter="transition-opacity duration-300" 
                         x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"></div>
                </div>
            `);
        });

        return rendered;
    } catch (error) {
        console.error('Markdown rendering error:', error);
        return `<p class="text-red-500">Error rendering markdown: ${error.message}</p>`;
    }
} 