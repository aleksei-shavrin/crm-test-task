<script lang="ts">
import Vue from 'vue'
import type { UserResponse } from '@/shared/api'
import { showSnackbar } from '@/shared/snackbar'

interface ProfileData {
  loading: boolean
  saving: boolean
  user: UserResponse | null
  form: {
    name: string
    avatar: string
  }
  error: string
}

export default Vue.extend({
  name: 'ProfilePage',
  data(): ProfileData {
    return {
      loading: true,
      saving: false,
      user: null,
      form: {
        name: '',
        avatar: ''
      },
      error: ''
    }
  },
  computed: {
    roleLabel(): string {
      if (!this.user) return ''
      return this.user.role === 'admin' ? 'Администратор' : 'Менеджер'
    },
    initial(): string {
      const name = this.form.name.trim() || this.user?.email || ''
      return name ? name.charAt(0).toUpperCase() : '?'
    }
  },
  async mounted() {
    await this.loadUser()
  },
  methods: {
    async loadUser(): Promise<void> {
      this.loading = true
      this.error = ''
      try {
        const user = await this.$store.dispatch('auth/fetchMe')
        this.user = user
        this.form.name = user.name
        this.form.avatar = user.avatar
      } catch (e) {
        this.error = (e as Error).message || 'Не удалось загрузить данные'
      } finally {
        this.loading = false
      }
    },
    async saveProfile(): Promise<void> {
      this.saving = true
      this.error = ''
      try {
        this.user = await this.$store.dispatch('auth/updateMe', {
          name: this.form.name,
          avatar: this.form.avatar
        })
        showSnackbar('Профиль сохранён')
      } catch (e) {
        this.error = (e as Error).message || 'Не удалось сохранить данные'
      } finally {
        this.saving = false
      }
    }
  }
})
</script>

<template>
  <div class="p-6 max-w-xl mx-auto">
    <v-skeleton-loader
      v-if="loading"
      type="list-item-avatar-two-line, divider, list-item-two-line@4, button"
      class="rounded-lg bg-[#1a1a1a] p-6"
      dark
    />

    <div v-else-if="user" class="rounded-lg border p-6 bg-[#1a1a1a] border-[#252525]">
      <div class="flex items-center mb-6">
        <v-avatar size="64" class="mr-4 bg-[#121212]">
          <img v-if="form.avatar" :src="form.avatar" alt="Аватар" />
          <span v-else class="primary--text text-2xl font-bold">{{ initial }}</span>
        </v-avatar>
        <div>
          <div class="text-white text-lg font-medium">{{ form.name || user.email }}</div>
          <div class="text-gray-400 text-sm">{{ user.email }}</div>
          <div class="text-gray-500 text-xs mt-1">{{ roleLabel }}</div>
        </div>
      </div>

      <v-divider class="mb-6" dark />

      <v-form @submit.prevent="saveProfile">
        <v-text-field
          v-model="form.name"
          label="Имя"
          outlined
          dense
          hide-details
          class="mb-4"
          placeholder="Ваше имя"
        />
        <v-text-field
          v-model="form.avatar"
          label="URL аватара"
          type="url"
          outlined
          dense
          hide-details
          class="mb-4"
          placeholder="https://example.com/avatar.jpg"
        />
        <v-text-field
          :value="user.email"
          label="Email"
          outlined
          dense
          hide-details
          disabled
          class="mb-4"
        />
        <v-text-field
          :value="roleLabel"
          label="Роль"
          outlined
          dense
          hide-details
          disabled
          class="mb-4"
        />
        <div v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</div>
        <v-btn
          type="submit"
          color="primary"
          :loading="saving"
          :disabled="saving"
        >
          Сохранить
        </v-btn>
      </v-form>
    </div>

    <div v-else class="text-red-400 py-8 text-center">{{ error || 'Ошибка загрузки' }}</div>
  </div>
</template>
