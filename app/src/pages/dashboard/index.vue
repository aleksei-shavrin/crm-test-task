<script lang="ts">
import Vue from 'vue'
import type { TaskStatusCount, Client, Task, ClientStatus } from '@/shared/api'
import { fetchStats, fetchRecentActivities } from '@/shared/api'

const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
  lead: 'Лид'
}
const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'К выполнению',
  in_progress: 'В работе',
  completed: 'Готово'
}

interface DashboardData {
  clientsCount: number
  tasksCount: number
  loading: boolean
  recentClients: Client[]
  recentTasks: Task[]
  chartR: number
  chartStroke: number
  chartCircumference: number
  taskStatuses: TaskStatusCount[]
}

const DEFAULT_TASK_STATUSES: TaskStatusCount[] = [
  { label: 'К выполнению', count: 0, color: '#3B82F6' },
  { label: 'В работе', count: 0, color: '#F59E0B' },
  { label: 'Выполнено', count: 0, color: '#10B981' }
]

export default Vue.extend({
  name: 'DashboardPage',
  data(): DashboardData {
    return {
      clientsCount: 0,
      tasksCount: 0,
      loading: true,
      recentClients: [],
      recentTasks: [],
      chartR: 48,
      chartStroke: 20,
      chartCircumference: 2 * Math.PI * 48,
      taskStatuses: []
    }
  },
  computed: {
    clientStatusLabel(): (s: ClientStatus) => string {
      return (s) => CLIENT_STATUS_LABELS[s] || s
    },
    taskStatusLabel(): (s: string) => string {
      return (s) => TASK_STATUS_LABELS[s] || s
    },
    totalTasks(): number {
      return this.taskStatuses.reduce((s, t) => s + t.count, 0)
    },
    chartSegments(): { offset: number; length: number; color: string }[] {
      if (this.totalTasks === 0) return []
      const circumference = this.chartCircumference
      const segments: { offset: number; length: number; color: string }[] = []
      let offset = 0
      for (const t of this.taskStatuses) {
        const length = (t.count / this.totalTasks) * circumference
        segments.push({ offset, length, color: t.color })
        offset += length
      }
      return segments
    }
  },
  mounted(): void {
    this.fetchStats()
  },
  methods: {
    goTo(path: string): void {
      this.$router.push(path)
    },
    pluralize(n: number, one: string, few: string, many: string): string {
      const abs = Math.abs(n)
      const mod10 = abs % 10
      const mod100 = abs % 100
      if (mod100 >= 11 && mod100 <= 19) return many
      if (mod10 === 1) return one
      if (mod10 >= 2 && mod10 <= 4) return few
      return many
    },
    formatDate(iso: string): string {
      if (!iso) return '—'
      try {
        return new Date(iso).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return iso
      }
    },
    async fetchStats(): Promise<void> {
      this.loading = true
      try {
        const [data, recent] = await Promise.all([
          fetchStats(),
          fetchRecentActivities().catch(() => ({ clients: [], tasks: [] }))
        ])
        this.clientsCount = data.clients
        this.tasksCount = data.tasks
        this.taskStatuses =
          Array.isArray(data.taskStatuses) && data.taskStatuses.length > 0
            ? data.taskStatuses
            : [...DEFAULT_TASK_STATUSES]
        this.recentClients = recent.clients
        this.recentTasks = recent.tasks
      } catch {
        this.clientsCount = 0
        this.tasksCount = 0
        this.taskStatuses = [...DEFAULT_TASK_STATUSES]
        this.recentClients = []
        this.recentTasks = []
      } finally {
        this.loading = false
      }
    }
  }
})
</script>

<template>
  <div class="p-6 bg-[#121212] min-h-screen">
    <template v-if="loading">
      <div class="grid grid-cols-2 gap-4 w-full md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
        <v-skeleton-loader type="card" class="md:row-start-1 md:col-start-1 rounded-lg min-h-[120px] bg-[#1a1a1a]" dark />
        <v-skeleton-loader type="card" class="md:row-start-1 md:col-start-2 rounded-lg min-h-[120px] bg-[#1a1a1a]" dark />
        <v-skeleton-loader type="card" class="col-span-2 md:row-start-1 md:col-start-3 md:col-span-2 rounded-lg min-h-[120px] bg-[#1a1a1a]" dark />
        <v-skeleton-loader type="table-heading, table-row-divider@5" class="col-span-2 md:row-start-2 md:col-start-1 md:col-span-2 rounded-lg bg-[#1a1a1a]" dark />
        <v-skeleton-loader type="table-heading, table-row-divider@5" class="col-span-2 md:row-start-2 md:col-start-3 md:col-span-2 rounded-lg bg-[#1a1a1a]" dark />
      </div>
    </template>
    <template v-else>
      <div class="grid grid-cols-2 gap-4 w-full md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
        <div
          class="md:row-start-1 md:col-start-1 rounded-lg p-6 shadow-lg cursor-pointer transition-colors border flex flex-col justify-between min-h-[120px] bg-[#1a1a1a] border-[#252525] hover:bg-[#222]"
          @click="goTo('/clients')"
        >
          <span class="text-4xl font-bold text-[#1976D2]">{{ clientsCount }}</span>
          <span class="text-gray-300 font-medium">{{ pluralize(clientsCount, 'Клиент', 'Клиента', 'Клиентов') }}</span>
        </div>

        <div
          class="md:row-start-1 md:col-start-2 rounded-lg p-6 shadow-lg cursor-pointer transition-colors border flex flex-col justify-between min-h-[120px] bg-[#1a1a1a] border-[#252525] hover:bg-[#222]"
          @click="goTo('/tasks')"
        >
          <span class="text-4xl font-bold text-[#1976D2]">{{ tasksCount }}</span>
          <span class="text-gray-300 font-medium">{{ pluralize(tasksCount, 'Задача', 'Задачи', 'Задач') }}</span>
        </div>

        <div
          v-if="taskStatuses.length > 0"
          class="col-span-2 md:row-start-1 md:col-start-3 md:col-span-2 rounded-lg shadow-lg border bg-[#1a1a1a] border-[#252525] grid grid-cols-[auto_1fr]"
        >
          <div class="flex items-center justify-center py-4 px-8 border-r border-[#252525]">
            <svg width="130" height="130" viewBox="0 0 120 120" class="-rotate-90">
              <circle
                cx="60"
                cy="60"
                :r="chartR"
                fill="none"
                stroke="#252525"
                :stroke-width="chartStroke"
              />
              <circle
                v-for="(seg, i) in chartSegments"
                :key="'seg-' + i"
                cx="60"
                cy="60"
                :r="chartR"
                fill="none"
                :stroke="seg.color"
                :stroke-width="chartStroke"
                stroke-linecap="butt"
                :stroke-dasharray="seg.length + ' ' + chartCircumference"
                :stroke-dashoffset="'-' + seg.offset"
              />
            </svg>
          </div>
          <div class="p-4 flex flex-col justify-center">
            <h2 class="text-lg font-semibold text-white mb-3">Статусы задач</h2>
            <ul class="space-y-2 pl-0">
              <li
                v-for="(t, i) in taskStatuses"
                :key="'legend-' + i"
                class="flex items-center gap-2 text-gray-300"
              >
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: t.color }"
                />
                <span>{{ t.label }}</span>
                <span class="text-white font-medium ml-auto">{{ t.count }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-span-2 md:row-start-2 md:col-start-1 md:col-span-2 rounded-lg p-6 shadow-lg border min-w-0 bg-[#1a1a1a] border-[#252525]">
          <h2 class="text-lg font-semibold text-white mb-4">Последние клиенты</h2>
          <div class="overflow-x-auto rounded border border-[#252525]">
            <table class="w-full text-left text-sm bg-[#1a1a1a] [&_th]:py-2 [&_th]:px-3 [&_th]:text-gray-400 [&_th]:font-semibold [&_th]:border-b [&_th]:border-[#252525] [&_td]:py-2 [&_td]:px-3 [&_td]:border-b [&_td]:border-[#252525] [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Пользователь</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in recentClients"
                  :key="c.id"
                  class="text-gray-200 hover:bg-white/5 cursor-pointer"
                  @click="goTo('/clients')"
                >
                  <td class="max-w-[150px]"><span class="block truncate">{{ c.name }}</span></td>
                  <td>
                    <v-chip
                      x-small
                      :color="c.status === 'active' ? 'green' : c.status === 'lead' ? 'blue' : 'grey'"
                    >
                      {{ clientStatusLabel(c.status) }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(c.createdAt) }}</td>
                  <td class="max-w-[120px]"><span class="block truncate">{{ c.managerName || '—' }}</span></td>
                </tr>
                <tr v-if="recentClients.length === 0">
                  <td colspan="4" class="py-4 px-3 text-gray-500 text-center">Нет данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-span-2 md:row-start-2 md:col-start-3 md:col-span-2 rounded-lg p-6 shadow-lg border min-w-0 bg-[#1a1a1a] border-[#252525]">
          <h2 class="text-lg font-semibold text-white mb-4">Последние задачи</h2>
          <div class="overflow-x-auto rounded border border-[#252525]">
            <table class="w-full text-left text-sm bg-[#1a1a1a] [&_th]:py-2 [&_th]:px-3 [&_th]:text-gray-400 [&_th]:font-semibold [&_td]:py-2 [&_td]:px-3 [&_tbody_tr]:border-b [&_tbody_tr]:border-[#252525] [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                  <th>Пользователь</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="t in recentTasks"
                  :key="t.id"
                  class="text-gray-200 hover:bg-white/5 cursor-pointer"
                  @click="goTo('/tasks')"
                >
                  <td class="max-w-[150px]"><span class="block truncate">{{ t.title }}</span></td>
                  <td>
                    <v-chip
                      x-small
                      :color="t.status === 'completed' ? 'green' : t.status === 'in_progress' ? 'orange' : 'blue'"
                    >
                      {{ taskStatusLabel(t.status) }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(t.createdAt) }}</td>
                  <td class="max-w-[120px]"><span class="block truncate">{{ t.assigneeName || '—' }}</span></td>
                </tr>
                <tr v-if="recentTasks.length === 0">
                  <td colspan="4" class="py-4 px-3 text-gray-500 text-center">Нет данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
