import { renderMarkdown } from '../../utils/markdown.js';

export default {
    template: `
        <div class="flex flex-col space-y-2 p-4" :class="message.role === 'assistant' ? 'bg-gray-50 dark:bg-dark-800' : ''">
            <div class="flex items-start space-x-3">
                <div class="flex-1 overflow-hidden">
                    <div class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-900 dark:text-white" x-text="message.role === 'assistant' ? 'Assistant' : 'You'"></span>
                    </div>
                    <template x-if="message.content">
                        <div class="mt-1 prose dark:prose-invert max-w-none" x-html="renderMessageContent()"></div>
                    </template>
                </div>
            </div>
        </div>
    `,
    props: {
        message: {
            type: Object,
            required: true,
            validator: function(value) {
                return value.role && typeof value.content !== 'undefined';
            }
        }
    },
    setup(props) {
        return {
            renderMessageContent() {
                console.log('Rendering message content:', props.message.content);
                return window.renderMarkdown(props.message.content);
            }
        };
    }
} 