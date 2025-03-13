export default {
    template: `
        <div class="border-t border-gray-200 dark:border-dark-border p-4">
            <div class="flex space-x-4">
                <div class="flex-1">
                    <textarea
                        x-model="message"
                        @keydown.enter.prevent="!$event.shiftKey && sendMessage()"
                        placeholder="输入消息..."
                        class="block w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2 text-gray-900 dark:text-white focus:border-primary focus:ring-primary sm:text-sm resize-none"
                        rows="1"
                        x-ref="textarea"
                        @input="autoResize($event.target)"
                    ></textarea>
                </div>
                <div class="flex-shrink-0">
                    <button
                        @click="sendMessage"
                        :disabled="!message.trim() || isThinking"
                        class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        <svg x-show="isThinking" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        发送
                    </button>
                </div>
            </div>
        </div>
    `,
    setup() {
        return {
            autoResize(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        };
    }
} 