# CRM

Vue.js + Express + MongoDB + Redis

## Установка и запуск

```bash
cp .env.example .env
cd api && npm i
cd ../app && npm i
docker compose up -d
docker compose exec api npm run seed
```

## Скриншоты

### Авторизация

<p float="left">
  <img src="app/public/images/crm-screens__login.png" width="700" alt="Вход" />
  <img src="app/public/images/crm-screens__register.png" width="700" alt="Регистрация" />
</p>

### Дашборд

<p float="left">
  <img src="app/public/images/crm-screens__dashboard.png" width="700" alt="Дашборд" />
  <img src="app/public/images/crm-screens__phone-dashboard.png" width="700" alt="Дашборд (мобильный)" />
</p>

### Боковое меню

<img src="app/public/images/crm-screens__sidebar.png" width="700" alt="Боковое меню" />

### Клиенты

<p float="left">
  <img src="app/public/images/crm-screens__clients.png" width="700" alt="Список клиентов" />
  <img src="app/public/images/crm-screens__client-dialog.png" width="700" alt="Диалог клиента" />
</p>

### Задачи

<img src="app/public/images/crm-screens__tasks.png" width="700" alt="Канбан задач" />

### Профиль

<img src="app/public/images/crm-screens__profile.png" width="700" alt="Профиль пользователя" />

### Инфраструктура

<p float="left">
  <img src="app/public/images/crm-screens__redis.png" width="700" alt="Redis кэш" />
  <img src="app/public/images/crm-screens__indexes.png" width="700" alt="MongoDB индексы" />
</p>

### Напоминания

<img src="app/public/images/crm-screens__reminder.png" width="700" alt="Напоминания в Telegram" />
