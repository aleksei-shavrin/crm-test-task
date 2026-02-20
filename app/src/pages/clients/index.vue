<script lang="ts">
import Vue from 'vue'
import type { Client, ClientStatus, UserResponse } from '@/shared/api'
import { fetchClients, createClient, updateClient, fetchRandomClientPayload, deleteClient, fetchUsers } from '@/shared/api'
import { isAdmin } from '@/shared/auth'
import { showSnackbar } from '@/shared/snackbar'
import { requiredField, emailField, isEmpty, isValidEmail, type FieldError } from '@/shared/validation'

const STATUS_OPTIONS: { value: ClientStatus; text: string }[] = [
  { value: 'active', text: 'Активный' },
  { value: 'inactive', text: 'Неактивный' },
  { value: 'lead', text: 'Лид' }
]

const STATUS_FILTER_OPTIONS: { value: ClientStatus | ''; text: string }[] = [
  { value: '', text: 'Все статусы' },
  ...STATUS_OPTIONS
]

interface ClientForm {
  name: string
  email: string
  phone: string
  company: string
  status: ClientStatus
  notes: string
}

interface TableOptions {
  page: number
  itemsPerPage: number
}

interface ClientFilters {
  status: ClientStatus | ''
  managerId: string
  search: string
}

interface ClientsData {
  clients: Client[]
  totalClients: number
  loading: boolean
  addingRandom: boolean
  saving: boolean
  deletingId: string | null
  deleteDialogOpen: boolean
  clientToDelete: Client | null
  actionMenuOpenId: string | null
  dialog: boolean
  editClient: Client | null
  form: ClientForm
  statusOptions: { value: ClientStatus; text: string }[]
  statusFilterOptions: { value: ClientStatus | ''; text: string }[]
  headers: { text: string; value: string; sortable?: boolean; width?: string }[]
  validationTriggered: boolean
  options: TableOptions
  filters: ClientFilters
  users: UserResponse[]
  searchDebounce: number | null
}

export default Vue.extend({
  name: 'ClientsPage',
  data(): ClientsData {
    return {
      clients: [],
      totalClients: 0,
      loading: true,
      addingRandom: false,
      saving: false,
      deletingId: null,
      deleteDialogOpen: false,
      clientToDelete: null,
      actionMenuOpenId: null,
      dialog: false,
      editClient: null,
      form: {
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        notes: ''
      },
      statusOptions: STATUS_OPTIONS,
      statusFilterOptions: STATUS_FILTER_OPTIONS,
      validationTriggered: false,
      options: { page: 1, itemsPerPage: 10 },
      filters: { status: '', managerId: '', search: '' },
      users: [],
      searchDebounce: null,
      headers: [
        { text: 'Имя', value: 'name', sortable: false },
        { text: 'Email', value: 'email', sortable: false },
        { text: 'Телефон', value: 'phone', sortable: false },
        { text: 'Компания', value: 'company', sortable: false },
        { text: 'Статус', value: 'status', sortable: false },
        { text: 'Заметки', value: 'notes', sortable: false },
        { text: 'Пользователь', value: 'managerId', sortable: false },
        { text: '', value: 'actions', sortable: false }
      ]
    }
  },
  watch: {
    'options.page'(): void {
      this.loadClients()
    },
    'options.itemsPerPage'(): void {
      this.options.page = 1
      this.loadClients()
    },
    'filters.status'(): void {
      this.options.page = 1
      this.loadClients()
    },
    'filters.managerId'(): void {
      this.options.page = 1
      this.loadClients()
    },
    'filters.search'(): void {
      if (this.searchDebounce) clearTimeout(this.searchDebounce)
      this.searchDebounce = window.setTimeout(() => {
        this.options.page = 1
        this.loadClients()
      }, 300)
    }
  },
  mounted(): void {
    this.loadClients()
    this.loadUsers()
  },
  computed: {
    canDeleteClients(): boolean {
      return isAdmin()
    },
    showUserFilter(): boolean {
      return isAdmin()
    },
    userOptions(): { value: string; text: string }[] {
      return [
        { value: '', text: 'Все пользователи' },
        ...this.users.map((u) => ({ value: u.id, text: u.name || u.email }))
      ]
    },
    nameFieldError(): FieldError {
      return requiredField(this.form.name, this.validationTriggered, 'Введите имя')
    },
    emailFieldError(): FieldError {
      return emailField(this.form.email, this.validationTriggered)
    },
    formValid(): boolean {
      return !isEmpty(this.form.name) && !isEmpty(this.form.email) && isValidEmail(this.form.email)
    }
  },
  methods: {
    async loadClients(): Promise<void> {
      this.loading = true
      try {
        const filters: { status?: ClientStatus; managerId?: string; search?: string } = {}
        if (this.filters.status) filters.status = this.filters.status
        if (this.filters.managerId) filters.managerId = this.filters.managerId
        if (this.filters.search) filters.search = this.filters.search
        const result = await fetchClients(
          { page: this.options.page, limit: this.options.itemsPerPage },
          filters
        )
        this.clients = result.items
        this.totalClients = result.total
      } catch {
        this.clients = []
        this.totalClients = 0
      } finally {
        this.loading = false
      }
    },
    async loadUsers(): Promise<void> {
      try {
        this.users = await fetchUsers()
      } catch {
        this.users = []
      }
    },
    openAddDialog(): void {
      this.editClient = null
      this.form = {
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        notes: ''
      }
      this.validationTriggered = false
      this.dialog = true
    },
    async onRandomInDialog(): Promise<void> {
      this.addingRandom = true
      try {
        const payload = await fetchRandomClientPayload()
        this.form = {
          name: payload.name,
          email: payload.email,
          phone: payload.phone ?? '',
          company: payload.company ?? '',
          status: payload.status,
          notes: payload.notes ?? ''
        }
      } catch {
      } finally {
        this.addingRandom = false
      }
    },
    closeClientDialog(): void {
      this.dialog = false
    },
    openEditDialog(client: Client): void {
      this.editClient = client
      this.form = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        status: client.status,
        notes: client.notes
      }
      this.validationTriggered = false
      this.dialog = true
    },
    async saveClient(): Promise<void> {
      this.validationTriggered = true
      if (!this.formValid) return
      this.saving = true
      try {
        if (this.editClient) {
          await updateClient(this.editClient.id, this.form)
          showSnackbar('Клиент обновлён')
        } else {
          await createClient(this.form)
          showSnackbar('Клиент создан')
        }
        this.dialog = false
        await this.loadClients()
      } catch {
        showSnackbar({ text: this.editClient ? 'Ошибка обновления клиента' : 'Ошибка создания клиента', color: 'error' })
      } finally {
        this.saving = false
      }
    },
    onActionMenuInput(open: boolean): void {
      if (!open) this.actionMenuOpenId = null
    },
    openDeleteDialog(client: Client): void {
      this.clientToDelete = client
      this.deleteDialogOpen = true
    },
    closeDeleteDialog(): void {
      if (this.deletingId === null) {
        this.deleteDialogOpen = false
        this.clientToDelete = null
      }
    },
    statusLabel(status: ClientStatus): string {
      const opt = this.statusOptions.find((o) => o.value === status)
      return opt ? opt.text : status
    },
    async confirmDeleteClient(): Promise<void> {
      if (!this.clientToDelete) return
      const id = this.clientToDelete.id
      this.deletingId = id
      try {
        await deleteClient(id)
        await this.loadClients()
        this.deleteDialogOpen = false
        this.clientToDelete = null
        showSnackbar('Клиент удалён')
      } catch {
        showSnackbar({ text: 'Ошибка удаления клиента', color: 'error' })
      } finally {
        this.deletingId = null
      }
    }
  }
})
</script>

<template>
  <div class="p-6 bg-[#121212] min-h-screen">
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <v-text-field
        v-model="filters.search"
        placeholder="Поиск по имени, email, компании..."
        prepend-inner-icon="mdi-magnify"
        outlined
        dense
        dark
        hide-details
        clearable
        class="max-w-xs flex-shrink-0"
      />
      <v-select
        v-model="filters.status"
        :items="statusFilterOptions"
        item-value="value"
        item-text="text"
        outlined
        dense
        dark
        hide-details
        class="max-w-[180px] flex-shrink-0"
        :menu-props="{ dark: true }"
      />
      <v-select
        v-if="showUserFilter"
        v-model="filters.managerId"
        :items="userOptions"
        item-value="value"
        item-text="text"
        outlined
        dense
        dark
        hide-details
        class="max-w-[200px] flex-shrink-0"
        :menu-props="{ dark: true }"
      />
      <v-spacer />
      <v-btn color="primary" small :disabled="loading" @click="openAddDialog">
        <v-icon left small>mdi-plus</v-icon>
        Добавить
      </v-btn>
    </div>

    <v-skeleton-loader
      v-if="loading"
      type="table-heading, table-row-divider@10"
      class="rounded-lg bg-[#1a1a1a]"
      dark
    />

    <v-data-table
      v-else
      :headers="headers"
      :items="clients"
      :options.sync="options"
      :server-items-length="totalClients"
      class="elevation-0"
      dark
      :footer-props="{ 'items-per-page-options': [10, 25, 50], 'items-per-page-text': 'Строк на странице:', 'page-text': '{0}-{1} из {2}' }"
    >
      <template #item.phone="{ item }">
        <span class="whitespace-nowrap">{{ item.phone }}</span>
      </template>
      <template #item.status="{ item }">
        <v-chip
          x-small
          :color="item.status === 'active' ? 'green' : item.status === 'lead' ? 'blue' : 'grey'"
        >
          {{ statusLabel(item.status) }}
        </v-chip>
      </template>
      <template #item.managerId="{ item }">
        {{ item.managerName || '—' }}
      </template>
      <template #item.actions="{ item }">
        <v-menu
          :value="actionMenuOpenId === item.id"
          offset-y
          left
          close-on-click
          @input="onActionMenuInput"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              small
              :disabled="deletingId !== null"
              v-bind="attrs"
              v-on="on"
              @click="actionMenuOpenId = item.id"
            >
              <v-icon small>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list dense dark>
            <v-list-item @click="openEditDialog(item); actionMenuOpenId = null">
              <v-list-item-icon>
                <v-icon small>mdi-pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Изменить</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="canDeleteClients" @click="openDeleteDialog(item); actionMenuOpenId = null">
              <v-list-item-icon>
                <v-icon small color="error">mdi-delete</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Удалить</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="500" persistent @keydown.esc="closeClientDialog">
      <v-card dark>
        <v-card-title class="text-base font-semibold">{{ editClient ? 'Изменить клиента' : 'Добавить клиента' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Имя"
            outlined
            dense
            hide-details="auto"
            class="mb-4"
            :error="nameFieldError.error"
            :error-messages="nameFieldError.messages"
          />
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            hide-details="auto"
            class="mb-4"
            :error="emailFieldError.error"
            :error-messages="emailFieldError.messages"
          />
          <v-text-field
            v-model="form.phone"
            label="Телефон"
            outlined
            dense
            hide-details
            class="mb-4"
          />
          <v-text-field
            v-model="form.company"
            label="Компания"
            outlined
            dense
            hide-details
            class="mb-4"
          />
          <v-select
            v-model="form.status"
            :items="statusOptions"
            item-value="value"
            item-text="text"
            label="Статус"
            dark
            outlined
            dense
            hide-details
            class="mb-4"
            :menu-props="{ dark: true }"
          />
          <v-textarea
            v-model="form.notes"
            label="Заметки"
            outlined
            dense
            rows="2"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-4 pt-0 pb-5">
          <v-btn
            v-if="!editClient"
            text
            :loading="addingRandom"
            :disabled="saving || addingRandom"
            @click="onRandomInDialog"
          >
            <v-icon left small>mdi-dice-multiple</v-icon>
            Рандом
          </v-btn>
          <v-spacer />
          <v-btn text :disabled="saving" @click="closeClientDialog">
            Отмена
          </v-btn>
          <v-btn color="primary" :loading="saving" @click="saveClient">
            {{ editClient ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="deleteDialogOpen"
      max-width="400"
      persistent
      @keydown.esc="closeDeleteDialog"
    >
      <v-card dark>
        <v-card-title class="text-h6">Удалить клиента?</v-card-title>
        <v-card-text>
          <span v-if="clientToDelete" class="text-body-2">
            «{{ clientToDelete.name }}» будет удалён безвозвратно.
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            :disabled="deletingId !== null"
            @click="closeDeleteDialog"
          >
            Отмена
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingId !== null"
            :disabled="deletingId !== null"
            @click="confirmDeleteClient"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

