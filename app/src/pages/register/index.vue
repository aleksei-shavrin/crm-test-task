<script lang="ts">
import Vue from 'vue'
import CrmLogo from '@/shared/ui/CrmLogo.vue'
import type { UserRole } from '@/shared/api'
import { emailField, requiredField, isEmpty, type FieldError } from '@/shared/validation'

const ROLE_OPTIONS: { value: UserRole; text: string }[] = [
  { value: 'admin', text: 'Администратор' },
  { value: 'manager', text: 'Менеджер' }
]

interface RegisterData {
  email: string
  password: string
  name: string
  role: UserRole
  avatar: string
  loading: boolean
  error: string
  roleOptions: { value: UserRole; text: string }[]
  validationTriggered: boolean
}

export default Vue.extend({
  name: 'RegisterPage',
  components: { CrmLogo },
  data(): RegisterData {
    return {
      email: '',
      password: '',
      name: '',
      role: 'manager',
      avatar: '',
      loading: false,
      error: '',
      roleOptions: ROLE_OPTIONS,
      validationTriggered: false
    }
  },
  computed: {
    emailFieldError(): FieldError {
      return emailField(this.email, this.validationTriggered)
    },
    passwordFieldError(): FieldError {
      return requiredField(this.password, this.validationTriggered, 'Введите пароль')
    },
    formValid(): boolean {
      return !isEmpty(this.email) && !isEmpty(this.password)
    }
  },
  methods: {
    async onSubmit(): Promise<void> {
      this.validationTriggered = true
      this.error = ''
      if (!this.formValid) return
      this.loading = true
      try {
        await this.$store.dispatch('auth/register', {
          email: this.email,
          password: this.password,
          name: this.name || undefined,
          role: this.role,
          avatar: this.avatar || undefined
        })
        this.$router.push('/login')
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Ошибка регистрации'
      } finally {
        this.loading = false
      }
    },
    goToLogin(): void {
      this.$router.push('/login')
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#121212] py-8">
      <CrmLogo :width="140" :height="48" class="mb-6" />
    <v-card dark class="w-full max-w-sm">
      <v-card-title class="text-xl font-bold">Регистрация</v-card-title>
      <v-card-text>
        <div v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</div>
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          outlined
          dense
          hide-details="auto"
          class="mb-4"
          placeholder="Введите email"
          autocomplete="email"
          :error="emailFieldError.error"
          :error-messages="emailFieldError.messages"
        />
        <v-text-field
          v-model="password"
          label="Пароль"
          type="password"
          outlined
          dense
          hide-details="auto"
          class="mb-4"
          placeholder="Введите пароль"
          autocomplete="new-password"
          :error="passwordFieldError.error"
          :error-messages="passwordFieldError.messages"
        />
        <v-text-field
          v-model="name"
          label="Имя"
          outlined
          dense
          hide-details
          class="mb-4"
          placeholder="Введите имя"
          autocomplete="name"
        />
        <v-select
          v-model="role"
          :items="roleOptions"
          item-value="value"
          item-text="text"
          label="Роль"
          dark
          outlined
          dense
          hide-details
          class="mb-4"
          :menu-props="{ dark: true }"
        />
        <v-text-field
          v-model="avatar"
          label="Аватар (URL)"
          type="url"
          outlined
          dense
          hide-details
          placeholder="https://..."
        />
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn
          color="primary"
          block
          :loading="loading"
          :disabled="loading"
          @click="onSubmit"
        >
          Зарегистрироваться
        </v-btn>
      </v-card-actions>
      <div class="px-4 pb-4 text-center">
        <router-link to="/login" class="text-gray-400 hover:text-white text-sm">
          Уже есть аккаунт? Войти
        </router-link>
      </div>
    </v-card>
  </div>
</template>
