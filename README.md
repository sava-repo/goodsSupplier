# Поставщики товаров (Goods Supplier)

Веб-приложение для поиска, просмотра и сравнения поставщиков товаров для food-бизнеса. Каталог поставщиков с фильтрацией по категориям и локациям, детальной информацией о каждом поставщике, личными заметками и функцией сравнения.

## Возможности

- **Поиск и фильтрация** — по названию, категории (одной или нескольким), городу/региону с автодополнением
- **Сортировка** — по названию, городу, минимальной сумме заказа, наличию сертификатов (двусторонняя)
- **Каталог поставщиков** — детальная карточка с контактами, адресом, коммерческими условиями и ссылками на сертификаты
- **Сравнение** — до 5 поставщиков в одной таблице
- **Личные заметки** — каждый авторизованный пользователь может оставить заметку на любого поставщика
- **Аутентификация** — регистрация и вход с JWT-токенами; редактирование, создание, удаление и заметки доступны только авторизованным
- **Адаптивный интерфейс** — работает на десктопе и мобильных устройствах

## Стек технологий

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 18, Vite 5, React Router 6, Lucide React (иконки), CSS Modules |
| **Backend** | Python 3.11, Flask 3, SQLAlchemy, Flask-Migrate (Alembic), Marshmallow, Flask-JWT-Extended |
| **База данных** | SQLite (разработка), PostgreSQL 16 (production) |
| **Инфраструктура** | Docker Compose |

## Быстрый старт

### Локальная разработка (без Docker)

#### 1. Клонирование и подготовка

```bash
git clone <repo-url>
cd goodsSupplier
cp .env.example .env   # настроить при необходимости
```

#### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

# Применить миграции и загрузить начальные данные
flask --app app db upgrade
python seed.py

# Запустить
python run.py
```

API будет доступен по адресу `http://127.0.0.1:5000/api`.

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI будет доступен по адресу `http://localhost:3000`.

#### 4. Импорт поставщиков из JSON (опционально)

```bash
cd backend
python import_json.py ../productcenter-suppliers.json
```

### Запуск через Docker Compose

```bash
docker compose up --build
```

После запуска:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000/api
- **PostgreSQL:** localhost:5432

При первом запуске автоматически применяются миграции и загружаются начальные категории через `seed.py`.

```bash
# Остановка
docker compose down

# С удалением тома БД
docker compose down -v
```

## Переменные окружения

См. `.env.example` для полного списка. Основные:

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `FLASK_ENV` | `development` | Режим: `development` или `production` |
| `HOST` | `127.0.0.1` | Адрес привязки (для Docker: `0.0.0.0`) |
| `PORT` | `5000` | Порт Flask-сервера |
| `DATABASE_URL` | `sqlite:///backend/dev.db` | URL подключения к БД |
| `JWT_SECRET_KEY` | (dev fallback) | Секрет JWT. **Обязателен в production** |
| `JWT_ACCESS_TOKEN_HOURS` | `24` | Время жизни JWT-токена (часы) |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые CORS-источники через запятую |
| `MIN_PASSWORD_LENGTH` | `8` | Минимальная длина пароля при регистрации |

Сгенерировать секретный ключ:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## API Reference

Базовый URL: `/api`. Формат ответа — JSON. Ошибки возвращаются в виде `{"error": "сообщение"}` или `{"errors": {...}}`.

### Health-check

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/health` | Проверка работоспособности — `{"status": "ok"}` |

### Аутентификация

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| POST | `/api/auth/register` | Регистрация → `{user, access_token}` | — |
| POST | `/api/auth/login` | Вход → `{user, access_token}` | — |
| GET | `/api/auth/me` | Текущий пользователь | JWT |

**Тела запросов:**

```json
// POST /api/auth/register
{"username": "ivan", "password": "secret123"}

// POST /api/auth/login
{"username": "ivan", "password": "secret123"}
```

Политика паролей: минимум 8 символов, минимум 1 цифра.

### Категории

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/categories` | Список всех категорий с `supplier_count` |
| POST | `/api/categories` | Создать категорию |
| PUT | `/api/categories/<id>` | Обновить категорию |
| DELETE | `/api/categories/<id>` | Удалить (если нет связанных поставщиков) |

### Подкатегории

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/subcategories` | Список (фильтр: `?category_id=N`) |
| GET | `/api/subcategories/<id>` | Детали подкатегории |
| POST | `/api/subcategories` | Создать |
| PUT | `/api/subcategories/<id>` | Обновить |
| DELETE | `/api/subcategories/<id>` | Удалить (если нет поставщиков) |

### Поставщики

| Метод | URL | Описание | Auth |
|-------|-----|----------|------|
| GET | `/api/suppliers` | Список с пагинацией и сортировкой | optional |
| POST | `/api/suppliers` | Создать поставщика | JWT |
| GET | `/api/suppliers/<id>` | Детали поставщика | — |
| PUT | `/api/suppliers/<id>` | Обновить поставщика | JWT |
| DELETE | `/api/suppliers/<id>` | Мягкое удаление (`is_active=False`) | JWT |

**Query-параметры списка (`GET /api/suppliers`):**

| Параметр | Тип | По умолч. | Описание |
|----------|-----|-----------|----------|
| `page` | int | 1 | Номер страницы |
| `per_page` | int | 20 | Размер страницы (макс. 100) |
| `sort_by` | str | — | Поле: `name`, `city`, `min_order_amount`, `certificates` |
| `sort_order` | str | `asc` | `asc` или `desc` |

При авторизованном запросе в каждый элемент добавляется поле `user_note`.

### Поиск

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/suppliers/search` | Поиск с фильтрами, сортировкой, пагинацией |

**Query-параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `q` | string | Поиск по названию (ilike `%q%`) |
| `category_id` | string | ID категорий через запятую (OR-фильтр) |
| `city` | string | Фильтр по городу (ilike `%city%`) |
| `region` | string | Фильтр по региону (ilike `%region%`) |
| `location` | string | Свободный поиск по городу ИЛИ региону |
| `sort_by` | string | Поле сортировки (те же, что у списка) |
| `sort_order` | string | `asc` или `desc` |
| `page`, `per_page` | int | Пагинация |

### Сравнение

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/suppliers/compare?ids=1,2,3` | До 5 поставщиков по ID |

### Заметки

Все эндпоинты требуют JWT. Один пользователь = одна заметка на поставщика.

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/suppliers/<id>/note` | Получить заметку |
| PUT | `/api/suppliers/<id>/note` | Создать или обновить |
| DELETE | `/api/suppliers/<id>/note` | Удалить |

### Автодополнение

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/suppliers/cities?q=<term>` | Уникальные города активных поставщиков |
| GET | `/api/suppliers/locations?q=<term>` | Города и регионы (`{value, type}`) |

### Примеры запросов

```bash
# Создать поставщика
curl -X POST http://localhost:5000/api/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "ООО Поставщик", "city": "Москва", "category_ids": [1]}'

# Поиск с фильтрами и сортировкой
curl "http://localhost:5000/api/suppliers/search?q=мяс&city=Москва&sort_by=name&sort_order=asc"

# Сравнение
curl "http://localhost:5000/api/suppliers/compare?ids=1,2,3"

# Сохранить заметку
curl -X PUT http://localhost:5000/api/suppliers/42/note \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"note": "Связаться в понедельник"}'
```

## Структура проекта

```
goodsSupplier/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Фабрика Flask-приложения
│   │   ├── config.py                # Конфигурация (Dev/Prod)
│   │   ├── database.py              # SQLAlchemy
│   │   ├── models.py                # Модели БД
│   │   ├── schemas.py               # Marshmallow-схемы
│   │   ├── errors.py                # Глобальные обработчики ошибок
│   │   ├── utils/                   # Вспомогательные функции
│   │   │   ├── db.py                # get_object_or_404, verify_ids_exist
│   │   │   ├── pagination.py        # attach_user_notes
│   │   │   └── sorting.py           # parse_sort_params
│   │   └── routes/
│   │       ├── auth.py              # Регистрация, вход, /me
│   │       ├── categories.py        # CRUD категорий
│   │       ├── subcategories.py     # CRUD подкатегорий
│   │       ├── suppliers.py         # CRUD поставщиков
│   │       ├── search.py            # Поиск и сравнение
│   │       ├── notes.py             # Личные заметки
│   │       ├── cities.py            # Автодополнение городов
│   │       └── locations.py         # Автодополнение локаций
│   ├── migrations/                  # Alembic-миграции
│   ├── seed.py                      # Начальные данные
│   ├── import_json.py               # Импорт поставщиков из JSON
│   ├── run.py                       # Локальный запуск
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                     # HTTP-клиент и API-функции
│   │   ├── components/
│   │   │   ├── SupplierList.jsx     # Таблица поставщиков
│   │   │   └── ui/                  # UI-компоненты дизайн-системы
│   │   ├── context/                 # AuthContext, CompareContext
│   │   ├── hooks/                   # useClickOutside, useListNavigation
│   │   ├── pages/                   # Страницы приложения
│   │   ├── styles/                  # tokens.css, global.css
│   │   ├── App.jsx                  # Корневой компонент + роутинг
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

### Модели данных

- **Category** — категория поставщика (M2M с Supplier)
- **Subcategory** — подкатегория, принадлежит Category (M2M с Supplier)
- **Supplier** — основной объект: контакты, адрес, коммерческие условия, сертификаты
- **User** — пользователь для JWT-аутентификации
- **SupplierNote** — личная заметка пользователя о поставщике (уникальный ключ user_id + supplier_id)

### Дизайн-система frontend

- `styles/tokens.css` — CSS-переменные (цвета, отступы, тени, радиусы)
- `styles/global.css` — глобальные стили и сброс
- CSS Modules для каждого компонента и страницы
- Базовый цвет бренда: `#132c33` (тёмно-бирюзовый)

## Разработка

### Миграции БД

```bash
cd backend

# Создать новую миграцию
flask --app app db migrate -m "описание изменений"

# Применить миграции
flask --app app db upgrade

# Откатить последнюю миграцию
flask --app app db downgrade
```

### Сборка frontend

```bash
cd frontend
npm run build      # production-сборка в dist/
npm run preview    # предварительный просмотр production-сборки
```
