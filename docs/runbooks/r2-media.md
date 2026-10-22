# Runbook: Cloudflare R2 media

Шаг **037**. Object storage для Payload Media через `@payloadcms/storage-s3` (S3 API R2).

## Когда что используется

| Окружение              | Условие                        | Хранилище                        |
| ---------------------- | ------------------------------ | -------------------------------- |
| Local (по умолчанию)   | `R2_*` пустые                  | repo-root `media/` (`staticDir`) |
| Local / preview / prod | все обязательные `R2_*` заданы | Cloudflare R2                    |

Обязательные переменные: `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`.  
Опционально: `R2_REGION` (default `auto`).

Код: [`src/storage/r2.ts`](../../src/storage/r2.ts) — plugin включается только если `isR2Configured()`.

## Cloudflare: создать bucket и ключи

1. Cloudflare Dashboard → **R2 Object Storage** → **Create bucket** (например `blog-media`).
2. Bucket → **Settings** → скопируйте **S3 API** endpoint:  
   `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` → `R2_ENDPOINT`.
3. R2 → **Manage R2 API Tokens** → Create token:
   - Permission: Object Read & Write (ограничьте bucket при возможности)
   - Скопируйте Access Key ID → `R2_ACCESS_KEY_ID`
   - Secret Access Key → `R2_SECRET_ACCESS_KEY`
4. `R2_BUCKET` = имя bucket.

## Публичный URL (`R2_PUBLIC_URL`)

S3 endpoint **не** отдаёт файлы публично. Нужен один из вариантов:

1. Bucket → **Settings** → **R2.dev subdomain** → Allow Access → URL вида `https://pub-….r2.dev` → `R2_PUBLIC_URL`
2. Или custom domain на bucket → `https://media.example.com`

Без trailing slash (код обрезает `/` на конце).

## CORS (client uploads)

При включённом R2 plugin использует `clientUploads: true` (лимит тела на Vercel ~4.5MB; наш max 5 MiB).

В R2 bucket → **Settings** → **CORS policy** разрешите для origin сайта (`NEXT_PUBLIC_SERVER_URL`):

- Methods: `GET`, `PUT`, `HEAD`
- Headers: `*` или как минимум `Content-Type`, `Authorization` / те, что шлёт Payload client upload
- Max Age: по желанию

Без CORS upload из браузера на Vercel/local с R2 упадёт.

## Проверка

1. Заполните `R2_*` в `.env` / Vercel env.
2. `npm run dev` (или deploy).
3. `/admin` → Media → upload JPEG/PNG/WebP/GIF + `alt`.
4. В R2 bucket появляется объект **WebP** (конвертация на upload, шаг **038**); в Media `mimeType: image/webp`, `url` = `{R2_PUBLIC_URL}/{filename}`.
5. Откройте `url` в браузере — картинка отдаётся.

Локально без R2: очистите `R2_*` → снова `media/` на disk.

## Операции

- **Ротация ключей:** новый API token → обновить env → redeploy; старый revoke.
- **Удаление файла:** delete в Payload admin удаляет объект в R2 (через storage adapter).
- **Бэкапы bucket:** политика R2 backups — Track ops (позже); не часть 037.

## Вне скоупа этого шага

- Custom CDN domain beyond `R2_PUBLIC_URL` — optional after v1

Media CUD — admin only (шаг **039**).
