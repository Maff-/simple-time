import Vue from 'vue';
import App from './App.vue';
import vSelect from 'vue-select';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './assets/scss/styling.scss';

Vue.component('v-select', vSelect);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');
