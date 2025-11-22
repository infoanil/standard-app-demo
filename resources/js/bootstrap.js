import axios from 'axios';
window.axios = axios;
window._ = require('lodash');

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
