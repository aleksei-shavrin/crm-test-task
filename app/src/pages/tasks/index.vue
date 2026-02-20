<script lang="ts">
import Vue from 'vue'
import type { Task, TaskStatus, TaskPayload, Client, UserResponse } from '@/shared/api'
import { fetchTasks, fetchClients, createTask, updateTask, fetchRandomTaskPayload, deleteTask, fetchUsers } from '@/shared/api'
import { isAdmin, getUser } from '@/shared/auth'
import { showSnackbar } from '@/shared/snackbar'

type ViewMode = 'kanban' | 'table'

interface KanbanColumn {
  id: TaskStatus
  title: string
  status: TaskStatus
}

const STATUS_FILTER_OPTIONS: { value: TaskStatus | ''; text: string }[] = [
  { value: '', text: 'Все статусы' },
  { value: 'pending', text: 'К выполнению' },
  { value: 'in_progress', text: 'В работе' },
  { value: 'completed', text: 'Готово' }
]

const emptyTaskForm = (): TaskPayload => ({
  title: '',
  description: '',
  clientId: '',
  status: 'pending',
  priority: 'medium',
  dueDate: new Date().toISOString().slice(0, 10)
})

interface TableOptions {
  page: number
  itemsPerPage: number
}

interface TaskFilters {
  status: TaskStatus | ''
  assigneeId: string
}

interface TasksData {
  tasks: Task[]
  totalTasks: number
  clients: Client[]
  users: UserResponse[]
  loading: boolean
  addingRandom: boolean
  savingTask: boolean
  deletingId: string | null
  deleteDialogOpen: boolean
  taskToDelete: Task | null
  taskFormOpen: boolean
  taskFormMode: 'create' | 'edit'
  taskForm: TaskPayload
  taskFormId: string | null
  taskFormValidationTriggered: boolean
  actionMenuOpenId: string | null
  viewMode: ViewMode
  headers: { text: string; value: string; sortable?: boolean }[]
  kanbanColumns: KanbanColumn[]
  options: TableOptions
  filters: TaskFilters
  statusFilterOptions: { value: TaskStatus | ''; text: string }[]
}

export default Vue.extend({
  name: 'TasksPage',
  data(): TasksData {
    return {
      tasks: [],
      totalTasks: 0,
      clients: [],
      users: [],
      loading: true,
      addingRandom: false,
      savingTask: false,
      deletingId: null,
      deleteDialogOpen: false,
      taskToDelete: null,
      taskFormOpen: false,
      taskFormMode: 'create',
      taskForm: emptyTaskForm(),
      taskFormId: null,
      taskFormValidationTriggered: false,
      actionMenuOpenId: null,
      viewMode: 'kanban',
      headers: [
        { text: 'Название', value: 'title', sortable: false },
        { text: 'Статус', value: 'status', sortable: false },
        { text: 'Приоритет', value: 'priority', sortable: false },
        { text: 'Срок', value: 'dueDate', sortable: false },
        { text: 'Клиент', value: 'clientId', sortable: false },
        { text: 'Описание', value: 'description', sortable: false },
        { text: 'Пользователь', value: 'assigneeId', sortable: false },
        { text: '', value: 'actions', sortable: false }
      ],
      kanbanColumns: [
        { id: 'pending', title: 'К выполнению', status: 'pending' },
        { id: 'in_progress', title: 'В работе', status: 'in_progress' },
        { id: 'completed', title: 'Готово', status: 'completed' }
      ],
      options: { page: 1, itemsPerPage: 10 },
      filters: { status: '', assigneeId: '' },
      statusFilterOptions: STATUS_FILTER_OPTIONS
    }
  },
  watch: {
    'options.page'(): void {
      if (this.viewMode === 'table') this.loadTasks()
    },
    'options.itemsPerPage'(): void {
      if (this.viewMode === 'table') {
        this.options.page = 1
        this.loadTasks()
      }
    },
    viewMode(): void {
      if (this.viewMode === 'kanban') {
        this.filters.status = ''
      }
      this.loadTasks()
    },
    'filters.status'(): void {
      this.options.page = 1
      this.loadTasks()
    },
    'filters.assigneeId'(): void {
      this.options.page = 1
      this.loadTasks()
    }
  },
  computed: {
    canDeleteTasks(): boolean {
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
    currentUser(): { id: string; name: string; email: string } | null {
      return getUser()
    },
    clientById(): Record<string, Client> {
      const map: Record<string, Client> = {}
      this.clients.forEach((c) => { map[c.id] = c })
      return map
    },
    tasksByColumn(): Record<TaskStatus, Task[]> {
      const map: Record<TaskStatus, Task[]> = {
        pending: [],
        in_progress: [],
        completed: []
      }
      this.tasks.forEach((t) => {
        if (map[t.status]) map[t.status].push(t)
      })
      return map
    }
  },
  mounted(): void {
    this.loadTasks()
    this.loadClients()
    this.loadUsers()
  },
  methods: {
    async loadClients(): Promise<void> {
      try {
        const result = await fetchClients({ limit: 1000 })
        this.clients = result.items
      } catch {
        this.clients = []
      }
    },
    async loadUsers(): Promise<void> {
      try {
        this.users = await fetchUsers()
      } catch {
        this.users = []
      }
    },
    async loadTasks(): Promise<void> {
      this.loading = true
      try {
        const filters: { status?: TaskStatus; assigneeId?: string } = {}
        if (this.filters.status) filters.status = this.filters.status
        if (this.filters.assigneeId) filters.assigneeId = this.filters.assigneeId
        if (this.viewMode === 'kanban') {
          const result = await fetchTasks({ limit: 1000 }, filters)
          this.tasks = result.items
          this.totalTasks = result.total
        } else {
          const result = await fetchTasks(
            { page: this.options.page, limit: this.options.itemsPerPage },
            filters
          )
          this.tasks = result.items
          this.totalTasks = result.total
        }
      } catch {
        this.tasks = []
        this.totalTasks = 0
      } finally {
        this.loading = false
      }
    },
    async onRandomInDialog(): Promise<void> {
      this.addingRandom = true
      try {
        const payload = await fetchRandomTaskPayload()
        this.taskForm = {
          title: payload.title,
          description: payload.description ?? '',
          clientId: payload.clientId,
          status: payload.status,
          priority: payload.priority,
          dueDate: payload.dueDate
        }
      } catch {
      } finally {
        this.addingRandom = false
      }
    },
    openDeleteDialog(task: Task): void {
      this.taskToDelete = task
      this.deleteDialogOpen = true
    },
    closeDeleteDialog(): void {
      if (this.deletingId === null) {
        this.deleteDialogOpen = false
        this.taskToDelete = null
      }
    },
    onActionMenuInput(open: boolean): void {
      if (!open) this.actionMenuOpenId = null
    },
    openAddTaskDialog(): void {
      this.taskFormMode = 'create'
      this.taskForm = emptyTaskForm()
      this.taskFormId = null
      this.taskFormValidationTriggered = false
      this.taskFormOpen = true
    },
    openEditTaskDialog(task: Task): void {
      this.taskFormMode = 'edit'
      this.taskFormId = task.id
      this.taskForm = {
        title: task.title,
        description: task.description,
        clientId: task.clientId,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      }
      this.taskFormValidationTriggered = false
      this.taskFormOpen = true
      this.actionMenuOpenId = null
    },
    closeTaskForm(): void {
      if (!this.savingTask) {
        this.taskFormOpen = false
        this.taskFormId = null
      }
    },
    async saveTask(): Promise<void> {
      this.taskFormValidationTriggered = true
      if (!this.taskForm.title.trim() || !this.taskForm.clientId?.trim()) return
      this.savingTask = true
      try {
        if (this.taskFormMode === 'create') {
          await createTask(this.taskForm)
          showSnackbar('Задача создана')
        } else if (this.taskFormId) {
          await updateTask(this.taskFormId, this.taskForm)
          showSnackbar('Задача обновлена')
        }
        this.taskFormOpen = false
        this.taskFormId = null
        await this.loadTasks()
      } catch {
        showSnackbar({ text: this.taskFormMode === 'create' ? 'Ошибка создания задачи' : 'Ошибка обновления задачи', color: 'error' })
      } finally {
        this.savingTask = false
      }
    },
    async confirmDeleteTask(): Promise<void> {
      if (!this.taskToDelete) return
      const id = this.taskToDelete.id
      this.deletingId = id
      try {
        await deleteTask(id)
        this.deleteDialogOpen = false
        this.taskToDelete = null
        showSnackbar('Задача удалена')
        await this.loadTasks()
      } catch {
        showSnackbar({ text: 'Ошибка удаления задачи', color: 'error' })
      } finally {
        this.deletingId = null
      }
    },
    tasksForColumn(status: TaskStatus): Task[] {
      return this.tasksByColumn[status] || []
    },
    priorityColor(priority: string): string {
      return priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'grey'
    },
    statusLabel(status: string): string {
      const map: Record<string, string> = { pending: 'К выполнению', in_progress: 'В работе', completed: 'Готово' }
      return map[status] || status
    },
    priorityLabel(priority: string): string {
      const map: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }
      return map[priority] || priority
    }
  }
})
</script>

<template>
  <div class="p-6 bg-[#121212] min-h-screen">
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <v-select
        v-if="viewMode === 'table'"
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
        v-model="filters.assigneeId"
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
      <div class="flex gap-1 max-w-[min-content]">
        <v-btn
          icon
          class="min-w-12 min-h-12 w-12 h-12 [&_.v-icon]:text-[26px]"
          :color="viewMode === 'kanban' ? 'primary' : 'grey'"
          @click="viewMode = 'kanban'"
          title="Канбан"
        >
          <v-icon>mdi-view-column</v-icon>
        </v-btn>
        <v-btn
          icon
          class="min-w-12 min-h-12 w-12 h-12 [&_.v-icon]:text-[26px]"
          :color="viewMode === 'table' ? 'primary' : 'grey'"
          @click="viewMode = 'table'"
          title="Таблица"
        >
          <v-icon>mdi-table</v-icon>
        </v-btn>
      </div>
      <v-btn color="primary" small :disabled="loading" @click="openAddTaskDialog">
        <v-icon left small>mdi-plus</v-icon>
        Добавить
      </v-btn>
    </div>

    <template v-if="loading">
      <div v-if="viewMode === 'kanban'" class="flex gap-4 overflow-x-auto pb-4">
        <v-skeleton-loader
          v-for="n in 3"
          :key="'skel-col-' + n"
          type="list-item-two-line@4"
          class="flex-shrink-0 w-80 min-w-[320px] rounded-lg bg-[#1a1a1a]"
          dark
        />
      </div>
      <v-skeleton-loader
        v-else
        type="table-heading, table-row-divider@10"
        class="rounded-lg bg-[#1a1a1a]"
        dark
      />
    </template>

    <template v-else>
      <div v-if="viewMode === 'kanban'" class="kanban-board flex gap-4 overflow-x-auto pb-4">
        <div
          v-for="col in kanbanColumns"
          :key="col.id"
          class="flex-shrink-0 w-80 min-w-[320px] rounded-lg border bg-[#1a1a1a] border-[#252525]"
        >
          <div class="px-4 py-3 border-b border-[#252525]">
            <h2 class="text-sm font-semibold text-gray-200">
              {{ col.title }}
              <span class="ml-2 text-gray-400">({{ tasksForColumn(col.status).length }})</span>
            </h2>
          </div>
          <div class="kanban-column-body p-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-220px)]">
            <div
              v-for="task in tasksForColumn(col.status)"
              :key="task.id"
              class="rounded-lg border p-3 mb-2 cursor-default transition-colors flex justify-between items-start gap-2 bg-[#242424] border-[#252525] hover:border-[#333]"
            >
              <div class="min-w-0 flex-1">
                <div class="text-white font-medium text-sm mb-1">{{ task.title }}</div>
                <div v-if="task.description" class="text-gray-400 text-xs mb-2 line-clamp-2">
                  {{ task.description }}
                </div>
                <div class="flex flex-wrap gap-1">
                  <v-chip
                    x-small
                    :color="priorityColor(task.priority)"
                  >
                    {{ priorityLabel(task.priority) }}
                  </v-chip>
                  <span class="text-gray-500 text-xs self-center">Срок {{ task.dueDate }}</span>
                </div>
              </div>
              <v-menu
                :value="actionMenuOpenId === task.id"
                offset-y
                left
                nudge-left="8"
                close-on-click
                @input="onActionMenuInput"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    icon
                    x-small
                    :disabled="deletingId !== null"
                    class="flex-shrink-0"
                    v-bind="attrs"
                    v-on="on"
                    @click="actionMenuOpenId = task.id"
                  >
                    <v-icon small color="grey">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list dense dark>
                  <v-list-item @click="openEditTaskDialog(task); actionMenuOpenId = null">
                    <v-list-item-icon>
                      <v-icon small>mdi-pencil</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>Изменить</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-if="canDeleteTasks" @click="openDeleteDialog(task); actionMenuOpenId = null">
                    <v-list-item-icon>
                      <v-icon small color="error">mdi-delete</v-icon>
                    </v-list-item-icon>
                    <v-list-item-title>Удалить</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </div>
      </div>

      <v-data-table
        v-if="viewMode === 'table'"
        :headers="headers"
        :items="tasks"
        :options.sync="options"
        :server-items-length="totalTasks"
        class="elevation-0"
        dark
        :footer-props="{ 'items-per-page-options': [10, 25, 50], 'items-per-page-text': 'Строк на странице:', 'page-text': '{0}-{1} из {2}' }"
      >
        <template #item.dueDate="{ item }">
          <span class="whitespace-nowrap">{{ item.dueDate }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip
            x-small
            :color="item.status === 'completed' ? 'green' : item.status === 'in_progress' ? 'orange' : 'blue'"
          >
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.priority="{ item }">
          <v-chip
            x-small
            :color="priorityColor(item.priority)"
          >
            {{ priorityLabel(item.priority) }}
          </v-chip>
        </template>
        <template #item.clientId="{ item }">
          {{ (clientById[item.clientId] && clientById[item.clientId].name) || item.clientId || '—' }}
        </template>
        <template #item.assigneeId="{ item }">
          {{ item.assigneeName || (currentUser && item.assigneeId === currentUser.id ? (currentUser.name || currentUser.email) : '') || '—' }}
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
                x-small
                :disabled="deletingId !== null"
                v-bind="attrs"
                v-on="on"
                @click="actionMenuOpenId = item.id"
              >
                <v-icon small color="grey">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list dense dark>
              <v-list-item @click="openEditTaskDialog(item); actionMenuOpenId = null">
                <v-list-item-icon>
                  <v-icon small>mdi-pencil</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Изменить</v-list-item-title>
              </v-list-item>
              <v-list-item v-if="canDeleteTasks" @click="openDeleteDialog(item); actionMenuOpenId = null">
                <v-list-item-icon>
                  <v-icon small color="error">mdi-delete</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Удалить</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </template>

    <v-dialog
      v-model="taskFormOpen"
      max-width="500"
      persistent
      @keydown.esc="closeTaskForm"
    >
      <v-card dark>
        <v-card-title class="text-base font-semibold">{{ taskFormMode === 'create' ? 'Добавить задачу' : 'Изменить задачу' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="taskForm.title"
            label="Название"
            outlined
            dense
            hide-details="auto"
            class="mb-4"
            :error="taskFormValidationTriggered && !taskForm.title.trim()"
            :error-messages="taskFormValidationTriggered && !taskForm.title.trim() ? ['Введите название'] : []"
          />
          <v-textarea
            v-model="taskForm.description"
            label="Описание"
            outlined
            dense
            rows="2"
            hide-details
            class="mb-4"
          />
          <v-select
            v-model="taskForm.status"
            :items="[
              { value: 'pending', text: 'К выполнению' },
              { value: 'in_progress', text: 'В работе' },
              { value: 'completed', text: 'Готово' }
            ]"
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
          <v-select
            v-model="taskForm.priority"
            :items="[
              { value: 'low', text: 'Низкий' },
              { value: 'medium', text: 'Средний' },
              { value: 'high', text: 'Высокий' }
            ]"
            item-value="value"
            item-text="text"
            label="Приоритет"
            dark
            outlined
            dense
            hide-details
            class="mb-4"
            :menu-props="{ dark: true }"
          />
          <v-select
            v-model="taskForm.clientId"
            :items="clients"
            item-value="id"
            item-text="name"
            label="Клиент"
            dark
            outlined
            dense
            hide-details="auto"
            class="mb-4"
            no-data-text="Нет клиентов"
            :error="taskFormValidationTriggered && !taskForm.clientId"
            :error-messages="taskFormValidationTriggered && !taskForm.clientId ? ['Выберите клиента'] : []"
            :menu-props="{ dark: true }"
          />
          <v-text-field
            v-model="taskForm.dueDate"
            label="Срок"
            type="date"
            outlined
            dense
            hide-details
            class="mb-4"
          />
        </v-card-text>
        <v-card-actions class="px-4 pt-0 pb-5">
          <v-btn
            v-if="taskFormMode === 'create'"
            text
            :loading="addingRandom"
            :disabled="savingTask || addingRandom"
            @click="onRandomInDialog"
          >
            <v-icon left small>mdi-dice-multiple</v-icon>
            Рандом
          </v-btn>
          <v-spacer />
          <v-btn
            text
            :disabled="savingTask"
            @click="closeTaskForm"
          >
            Отмена
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingTask"
            :disabled="savingTask"
            @click="saveTask"
          >
            {{ taskFormMode === 'create' ? 'Создать' : 'Сохранить' }}
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
        <v-card-title class="text-h6">Удалить задачу?</v-card-title>
        <v-card-text>
          <span v-if="taskToDelete" class="text-body-2">
            «{{ taskToDelete.title }}» будет удалена безвозвратно.
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
            @click="confirmDeleteTask"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
