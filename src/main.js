import Vue from 'vue';
import App from './App.vue';
import vSelect from 'vue-select';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

import './assets/scss/styling.scss';

// Override default deselect button content
vSelect.props.components.default = () => ({
    Deselect: {
        render: h => h('i'/*, { attrs: { 'class': 'bi bi-x' } }*/),
    },
    OpenIndicator: {
        render: h => h('div'/*, [
            h('i', { attrs: { 'class': 'bi bi-chevron-down' } }),
        ]*/),
    },
});

Vue.component('v-select', vSelect);

Vue.config.productionTip = false;

new Vue({
    render: h => h(App),
}).$mount('#app');
