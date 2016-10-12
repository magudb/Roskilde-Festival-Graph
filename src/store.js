
var Vuex = require('vuex');

var Vue = require('vue');
// root state object.
// each Vuex instance is just a single state tree.
var state = {
    bands: []
}

// mutations are operations that actually mutates the state.
// each mutation handler gets the entire state tree as the
// first argument, followed by additional payload arguments.
// mutations must be synchronous and can be recorded by plugins
// for debugging purposes.
var mutations = {
    SetBand(state, { band }) {

        if (state.bands.length < 2) {
            return state.bands.push(band);
        }
        state.bands = [];
        state.bands.push(band);

    }
}

// actions are functions that causes side effects and can involve
// asynchronous operations.
var actions = {
    AddBand: ({ commit }, band) => {
        commit('SetBand', { band })
        if (state.bands.length > 1) {
            var model = {
                a: state.bands[0],
                b: state.bands[1]
            }
            Vue.http.post('http://localhost:3000/sixdegrees', model)
                .then((response) => {
                    return response.body.suggestions;
                })
                .then((json) => {
                    console.log(json);                   
                })
        }
        
    },
}

// getters are functions
var getters = {
    bands: state => {
        if (state.bands.length > 1) {
            return {
                a: state.bands[0],
                b: state.bands[1]
            }
        }
        return {}
    }
}

// A Vuex instance is created by combining the state, mutations, actions,
// and getters.
module.exports = new Vuex.Store({
    state: state,
    getters: getters,
    actions: actions,
    mutations: mutations
})