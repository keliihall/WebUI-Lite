export default {
    template: `
        <div class="relative">
            <button
                @click="modelSelectorOpen = !modelSelectorOpen"
                type="button"
                class="relative w-full bg-white dark:bg-dark-700 pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm border border-gray-300 dark:border-dark-600 rounded-lg"
            >
                <span class="block truncate text-gray-900 dark:text-white" x-text="selectedModel"></span>
                <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </span>
            </button>

            <div
                x-show="modelSelectorOpen"
                @click.away="modelSelectorOpen = false"
                class="absolute z-10 mt-1 w-full bg-white dark:bg-dark-700 shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
            >
                <template x-for="model in models" :key="model">
                    <div
                        @click="selectedModel = model; modelSelectorOpen = false; localStorage.setItem('selectedModel', model)"
                        class="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-600"
                        :class="{ 'bg-gray-100 dark:bg-dark-600': model === selectedModel }"
                    >
                        <span class="block truncate" x-text="model"></span>
                        <span
                            x-show="model === selectedModel"
                            class="absolute inset-y-0 right-0 flex items-center pr-4 text-primary"
                        >
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    </div>
                </template>
            </div>
        </div>
    `
} 