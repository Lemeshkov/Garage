# Garage

Monorepo для закрытого приложения учёта личного транспорта.

## Запуск

1. Установите зависимости: `npm install`.
2. Мобильное приложение: `npm run mobile`.
3. Скелет API: скопируйте `apps/api/.env.example` в `.env`, затем `npm run api`.

## Реестр транспорта (этап 2)

1. Создайте `apps/api/.env` на основе `.env.example` и укажите PostgreSQL в `DATABASE_URL`.
2. Создайте `apps/mobile/.env` на основе `.env.example`; для физического телефона укажите LAN-адрес компьютера.
3. Миграция лежит в `apps/api/prisma/migrations/20261010000100_vehicle_registry/`, но не применена. После проверки строки подключения отдельно выполните `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`.
4. Для локального создания и редактирования временно установите `LOCAL_DEV_WRITE=true`. В остальных режимах API возвращает `403` для операций записи.

## Структура

- `apps/mobile` — Expo / React Native интерфейс.
- `apps/api` — NestJS каркас и начальная Prisma-схема.
- `packages/shared` — будущие общие типы.

На первом этапе данные мобильного интерфейса намеренно локальные; авторизация, БД и push-уведомления не реализованы.

Полные сценарии проверки реестра, пробега и фото: [TESTING.md](TESTING.md).

$env:EXPO_OFFLINE="1"

npm run mobile -- --clear
