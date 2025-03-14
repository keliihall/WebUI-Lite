import Alpine from 'alpinejs';
import { createSettingsStore } from './store/settings';

window.Alpine = Alpine;
Alpine.data('settings', createSettingsStore);
Alpine.start(); 