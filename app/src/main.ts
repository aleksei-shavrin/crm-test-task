import Vue, { CreateElement } from 'vue'
import Vuetify from 'vuetify'
import App from '@/app/App.vue'
import router from '@/app/router'
import store from '@/store'
import 'vuetify/dist/vuetify.min.css'
import '@/app/styles/global.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify)

const vuetify = new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'
      }
    }
  }
})

new Vue({
  router,
  store,
  vuetify,
  render: (h: CreateElement) => h(App)
}).$mount('#app')
