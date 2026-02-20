<script lang="ts">
import Vue from 'vue'
import CrmLogo from '@/shared/ui/CrmLogo.vue'

export default Vue.extend({
  name: 'Sidebar',
  components: { CrmLogo },
  props: {
    value: { type: Boolean, required: true }
  },
  computed: {
    drawer: {
      get(): boolean {
        return this.value
      },
      set(v: boolean) {
        this.$emit('input', v)
      }
    }
  },
  methods: {
    goTo(path: string): void {
      this.$emit('input', false)
      if (this.$route.path === path) return
      this.$router.push(path)
    }
  }
})
</script>

<template>
  <v-navigation-drawer v-model="drawer" app temporary dark class="!bg-[#121212]">
    <router-link to="/dashboard" class="px-4 pt-4 pb-3 flex justify-center" @click.native="drawer = false">
      <CrmLogo :width="100" :height="34" />
    </router-link>
    <v-list nav dense class="sidebar-list">
      <v-list-item link @click="goTo('/dashboard')" :class="{ 'sidebar-item-active': $route.path === '/dashboard' }">
        <v-list-item-icon>
          <v-icon class="sidebar-icon" :class="{ 'primary--text': $route.path === '/dashboard' }">mdi-view-dashboard</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Дашборд</v-list-item-title>
      </v-list-item>
      <v-list-item link @click="goTo('/clients')" :class="{ 'sidebar-item-active': $route.path === '/clients' }">
        <v-list-item-icon>
          <v-icon class="sidebar-icon" :class="{ 'primary--text': $route.path === '/clients' }">mdi-account-group</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Клиенты</v-list-item-title>
      </v-list-item>
      <v-list-item link @click="goTo('/tasks')" :class="{ 'sidebar-item-active': $route.path === '/tasks' }">
        <v-list-item-icon>
          <v-icon class="sidebar-icon" :class="{ 'primary--text': $route.path === '/tasks' }">mdi-format-list-checks</v-icon>
        </v-list-item-icon>
        <v-list-item-title>Задачи</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
