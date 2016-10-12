// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
require("bootstrap");
require("./assets/style.css");
require('whatwg-fetch');
var Vue = require("vue");
var Hello = require('./components/Hello');
var Autocomplete = require('./components/AutoComplete');
var sixdegrees = require('./components/SixDegrees');

var VueResource = require('vue-resource');
var Vuex = require('vuex');

/* Initialize the plugin */
Vue.use(VueResource)
Vue.use(Vuex);

/* eslint-disable no-new */
var app = new Vue({
  el: '#app',
  store:require("./store.js"),
  components: {
    "hello": Hello,
    "autocomplete": Autocomplete,
    "sixdegrees": sixdegrees
  }
});
