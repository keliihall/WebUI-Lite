import config from '../config';

export function createSidebarResizer() {
    return {
        isDragging: false,
        startX: 0,
        startWidth: 0,

        startDrag(e) {
            this.isDragging = true;
            this.startX = e.pageX;
            this.startWidth = this.sidebarWidth;
            document.body.classList.add('user-select-none');
        },

        doDrag(e) {
            if (!this.isDragging) return;
            
            const delta = e.pageX - this.startX;
            const newWidth = Math.max(225, Math.min(480, this.startWidth + delta));
            
            this.sidebarWidth = newWidth;
            localStorage.setItem(config.storage.keys.sidebarWidth, newWidth);
        },

        stopDrag() {
            this.isDragging = false;
            document.body.classList.remove('user-select-none');
        }
    };
} 