import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import dialog from './plugins/dialog';

createApp(App).use(store).use(router).use(dialog).mount('#app');
