# Поставщики товаров (Goods Supplier MVP)

Приложение для поиска, просмотра и сравнения поставщиков товаров для food-бизнеса.

## Стек технологий

- **Backend:** Python 3.11, Flask, SQLAlchemy, Alembic, Marshmallow
- **Frontend:** React 18, Vite, React Router, Lucide React
- **Database:** PostgreSQL 16
- **Инфраструктура:** Docker Compose

## Быстрый старт

### Предварительные требования

- Docker Desktop (или Docker + Docker Compose)
- Git

### Запуск проекта

```bash
# Клонировать репозиторий
git clone <repo-url>
cd goodsSupplier

# Запустить все сервисы
docker compose up --build
```

После запуска:
- **Фронтенд:** http://localhost:3000
- **API бэкенда:** http://localhost:5000/api
- **PostgreSQL:** localhost:5432

При первом запуске автоматически:
1. Создаются таблицы БД (Alembic миграции)
2. Загружаются начальные категории (Ингредиенты, Готовая продукция, Упаковка, Оборудование, Напитки, Специи и приправы)

## API Endpoints

### Категории
| Метод  | URL                     | Описание                          |
|--------|-------------------------|-----------------------------------|
| GET    | `/api/categories`       | Список всех категорий             |
| POST   | `/api/categories`       | Создать категорию                 |
| PUT    | `/api/categories/<id>`  | Обновить категорию                |
| DELETE | `/api/categories/<id>`  | Удалить категорию                 |

### Поставщики
| Метод  | URL                        | Описание                          |
|--------|----------------------------|-----------------------------------|
| GET    | `/api/suppliers`           | Список поставщиков (пагинация)    |
| POST   | `/api/suppliers`           | Создать поставщика                |
| GET    | `/api/suppliers/<id>`      | Детали поставщика                 |
| PUT    | `/api/suppliers/<id>`      | Обновить поставщика               |
| DELETE | `/api/suppliers/<id>`      | Удалить (мягкое)                  |
| GET    | `/api/suppliers/search`    | Поиск с фильтрами                 |
| GET    | `/api/suppliers/compare`   | Сравнение (макс. 5)               |

### Параметры поиска (`/api/suppliers/search`)

| Параметр     | Тип    | Описание                                    |
|-------------|--------|---------------------------------------------|
| `q`         | string | Поиск по названию (частичное совпадение)     |
| `category_id` | string | ID категорий через запятую (OR)              |
| `city`      | string | Фильтр по городу (частичное совпадение)      |
| `region`    | string | Фильтр по региону                           |
| `page`      | int    | Номер страницы (по умолчанию 1)             |
| `per_page`  | int    | Кол-во на странице (по умолчанию 20, макс 100) |

### Примеры запросов

```bash
# Создать поставщика
curl -X POST http://localhost:5000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{"name": "ООО Поставщик", "city": "Москва", "category_ids": [1]}'

# Поиск поставщиков
curl "http://localhost:5000/api/suppliers/search?q=поставщик&city=Москва"

# Сравнение
curl "http://localhost:5000/api/suppliers/compare?ids=1,2,3"
```

## Структура проекта

```
goodsSupplier/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── database.py          # Настройка SQLAlchemy
│   │   ├── models.py            # Модели БД
│   │   ├── schemas.py           # Схемы валидации (marshmallow)
│   │   └── routes/
│   │       ├── categories.py    # API категорий
│   │       ├── suppliers.py     # API поставщиков
│   │       └── search.py        # API поиска и сравнения
│   ├── seed.py                  # Начальные данные
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                 # HTTP-клиент для API
│   │   ├── components/          # React-компоненты
│   │   │   └── ui/              # UI-компоненты дизайн-системы
│   │   ├── context/             # React-контексты
│   │   ├── pages/               # Страницы
│   │   ├── styles/              # CSS-токены и глобальные стили
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Остановка проекта

```bash
docker compose down

# С удалением данных БД
docker compose down -v