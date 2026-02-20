<script lang="ts">
import Vue from 'vue'
import CrmLogo from '@/shared/ui/CrmLogo.vue'
import { requiredField, isEmpty, type FieldError } from '@/shared/validation'

interface LoginData {
  email: string
  password: string
  error: string
  loading: boolean
  validationTriggered: boolean
}

export default Vue.extend({
  name: 'LoginPage',
  components: { CrmLogo },
  data(): LoginData {
    return {
      email: '',
      password: '',
      error: '',
      loading: false,
      validationTriggered: false
    }
  },
  computed: {
    emailFieldError(): FieldError {
      return requiredField(this.email, this.validationTriggered, 'Введите email')
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
        await this.$store.dispatch('auth/login', { email: this.email.trim(), password: this.password })
        await this.$store.dispatch('auth/fetchMe')
        this.$router.push('/dashboard')
      } catch (e) {
        this.error = (e as Error).message || 'Ошибка входа'
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#121212] py-8">
      <CrmLogo :width="140" :height="48" class="mb-6" />
    <v-card dark class="w-full max-w-sm">
      <v-card-title class="text-xl font-bold">Вход</v-card-title>
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
          autocomplete="current-password"
          :error="passwordFieldError.error"
          :error-messages="passwordFieldError.messages"
          @keydown.enter="onSubmit"
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
          Войти
        </v-btn>
      </v-card-actions>
      <div class="px-4 pb-4 text-center">
        <router-link to="/register" class="text-gray-400 hover:text-white text-sm">
          Нет аккаунта? Зарегистрироваться
        </router-link>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
::v-deep input:-webkit-autofill,
::v-deep input:-webkit-autofill:hover,
::v-deep input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #1e1e1e inset !important;
  -webkit-text-fill-color: #fff !important;
  caret-color: #fff !important;
}

::v-deep .v-text-field--outlined:has(input:-webkit-autofill) .v-label {
  transform: translateY(-18px) scale(0.75) !important;
  background: #1e1e1e;
  padding: 0 4px;
}
</style>
