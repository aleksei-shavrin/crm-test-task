<script lang="ts">
import Vue from 'vue'
import Header from '@/widgets/header/Header.vue'
import Sidebar from '@/widgets/sidebar/Sidebar.vue'
import { apiState } from '@/shared/api/request'
import { fetchMe } from '@/shared/api'
import { isAuthenticated, setUser, clearToken, clearUser } from '@/shared/auth'
import { snackbarBus, SnackbarOptions } from '@/shared/snackbar'

interface AppData {
  drawer: boolean
  snackbar: boolean
  snackbarText: string
  snackbarColor: string
  snackbarTimeout: number
}

export default Vue.extend({
  name: 'App',
  components: { Header, Sidebar },
  data(): AppData {
    return {
      drawer: false,
      snackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
      snackbarTimeout: 3000
    }
  },
  computed: {
    isAuthRoute(): boolean {
      return this.$route.path === '/login' || this.$route.path === '/register'
    },
    isApiLoading(): boolean {
      return apiState.pendingCount > 0
    }
  },
  async created() {
    snackbarBus.$on('show', (opts: SnackbarOptions) => {
      this.snackbarText = opts.text
      this.snackbarColor = opts.color || 'success'
      this.snackbarTimeout = opts.timeout || 3000
      this.snackbar = true
    })
    if (isAuthenticated() && !this.isAuthRoute) {
      try {
        const user = await fetchMe()
        setUser(user)
      } catch {
        clearToken()
        clearUser()
        this.$router.push('/login')
      }
    }
  },
  beforeDestroy() {
    snackbarBus.$off('show')
  }
})
</script>

<template>
  <v-app>
    <template v-if="isAuthRoute">
      <router-view />
    </template>
    <template v-else>
      <Header :drawer="drawer" @update:drawer="drawer = $event" />
      <Sidebar :value="drawer" @input="drawer = $event" />
      <v-main class="min-h-screen bg-[#121212]">
        <router-view />
      </v-main>
    </template>

    <v-overlay
      :value="isApiLoading"
      :z-index="100"
      opacity="0.4"
      color="#121212"
    >
      <v-progress-circular
        indeterminate
        size="56"
        width="4"
        color="primary"
      />
    </v-overlay>

    <v-snackbar
      v-model="snackbar"
      :timeout="snackbarTimeout"
      :color="snackbarColor"
      bottom
      right
    >
      {{ snackbarText }}
      <template #action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
