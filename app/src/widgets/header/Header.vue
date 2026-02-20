<script lang="ts">
import Vue from 'vue'
import CrmLogo from '@/shared/ui/CrmLogo.vue'
import type { UserRole, UserResponse } from '@/shared/api'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер'
}

const PAGE_META: Record<string, { title: string; icon: string }> = {
  '/dashboard': { title: 'Дашборд', icon: 'mdi-view-dashboard' },
  '/clients': { title: 'Клиенты', icon: 'mdi-account-group' },
  '/tasks': { title: 'Задачи', icon: 'mdi-format-list-checks' },
  '/profile': { title: 'Профиль', icon: 'mdi-account' }
}

export default Vue.extend({
  name: 'Header',
  components: { CrmLogo },
  props: {
    drawer: { type: Boolean, required: true }
  },
  computed: {
    pageTitle(): string {
      const meta = PAGE_META[this.$route.path]
      return meta ? meta.title : 'Приложение'
    },
    pageIcon(): string {
      const meta = PAGE_META[this.$route.path]
      return meta ? meta.icon : 'mdi-apps'
    },
    user(): UserResponse | null {
      return this.$store.getters['auth/currentUser']
    },
    displayName(): string {
      if (!this.user) return ''
      return (this.user.name && this.user.name.trim()) || this.user.email || ''
    },
    initial(): string {
      if (!this.displayName) return '?'
      return this.displayName.trim().charAt(0).toUpperCase()
    },
    roleLabel(): string {
      return this.user ? ROLE_LABELS[this.user.role] || this.user.role : ''
    }
  },
  methods: {
    toggleDrawer(): void {
      this.$emit('update:drawer', !this.drawer)
    },
    async logout(): Promise<void> {
      await this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    }
  }
})
</script>

<template>
  <v-app-bar app dark class="!bg-[#1a1a1a]">
    <v-app-bar-nav-icon @click="toggleDrawer" />
    <router-link to="/dashboard" class="mr-3 mt-0.5">
      <CrmLogo :width="96" :height="32" />
    </router-link>
    <v-icon class="mr-2 text-[22px]" color="primary">{{ pageIcon }}</v-icon>
    <span class="text-[0.9375rem] font-medium">{{ pageTitle }}</span>
    <v-spacer />
    <div class="flex items-center max-w-[min-content]">
      <router-link v-if="user" to="/profile" class="flex items-center mr-4 no-underline hover:opacity-80 transition-opacity cursor-pointer">
        <v-avatar size="36" class="md:mr-2 bg-[#121212]">
          <img v-if="user.avatar" :src="user.avatar" :alt="displayName" />
          <span v-else class="primary--text font-weight-bold">{{ initial }}</span>
        </v-avatar>
        <div class="hidden md:flex flex-col items-start">
          <span class="text-white text-sm font-medium whitespace-nowrap">{{ displayName }}</span>
          <span class="text-gray-400 text-xs block">{{ roleLabel }}</span>
        </div>
      </router-link>
      <v-btn icon color="grey" @click="logout" title="Выйти">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </div>
  </v-app-bar>
</template>
