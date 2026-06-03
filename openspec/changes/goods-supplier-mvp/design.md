## Context

Проект создаётся с нуля — нет существующей кодовой базы или инфраструктуры. Целевая аудитория — малый и средний food-бизнес (кафе, рестораны, пекарни). Команда — junior-middle разработчик, поэтому простота реализации и поддержки приоритетнее масштабируемости.

Стек определён заказчиком: Python Flask (бэкенд), React JS (фронтенд), PostgreSQL (БД).

## Goals / Non-Goals

**Goals:**
- Простая и понятная архитектура, легко расширяемая
- Минимальное количество сущностей и связей для MVP
- REST API с чёткой структурой эндпоинтов
- Удобный UI для поиска, просмотра и сравнения поставщиков
- Docker Compose для быстрого старта разработки
- Код, понятный junior-middle разработчику

**Non-Goals:**
- Аутентификация и авторизация пользователей (не в MVP)
- Сложная система прав и ролей
- Интеграция с внешними источниками данных (парсинг, API поставщиков)
- Реалтайм-обновления (WebSockets)
- Мобильное приложение
- Развёртывание в production (только локальная разработка)
- Отзывы и рейтинги поставщиков (следующая итерация)

## Decisions

### 1. Монолитная архитектура Flask

**Решение:** Единое Flask-приложение с Blueprint-ами для роутинга.

**Альтернативы:** FastAPI (асинхронность, автодокументация), Django (тяжёлый для MVP).

**Обоснование:** Flask — минимален, понятен, легко масштабируется до микросервисов. Blueprint-ы позволяют логически разделить API (suppliers, categories, search). Для MVP монолита достаточно.

### 2. SQLAlchemy ORM + Alembic для миграций

**Решение:** SQLAlchemy как ORM, Alembic для миграций БД.

**Обоснование:** Стандартный выбор для Flask. Позволяет описывать модели данных в Python-коде, миграции — через Alembic. Проще чем писать SQL-миграции вручную.

### 3. Структура данных — 3 основных таблицы

**Решение:**
- `categories` — справочник категорий товаров (ингредиенты, упаковка, готовая продукция...)
- `suppliers` — поставщики с полной информацией
- `supplier_categories` — связь many-to-many между поставщиками и категориями

**Модель поставщика (suppliers):**
```
id, name, description, contact_person, phone, email, website, source_url,
city, region, address, min_order_amount, price_range, has_certificates,
certificate_details, delivery_conditions, notes, is_active,
created_at, updated_at
```

**Обоснование:** Одна таблица поставщиков с основными полями. Связь many-to-many с категориями позволяет одному поставщику относиться к нескольким категориям. Поля `city` и `region` — простые строки, без справочника городов (для MVP достаточно).

### 4. React SPA с Vite + дизайн-система GoulashDesign

**Решение:** React + Vite для сборки, React Router для навигации, lucide-react для иконок. UI-компоненты строим по дизайн-системе из `goulashDesign.pen`.

**Альтернативы:** Next.js (избыточен для SPA), CRA (устарел), готовая UI-библиотека MUI/Ant Design (не соответствует дизайн-системе).

**Обоснование:** Vite — быстрый, современный. Дизайн-система GoulashDesign определяет токены (цвета, радиусы, тени, типографика) и компоненты (Button, Input, Card, Badge, SearchInput, Select, Tabs, Toast, EmptyState, Header, Sidebar). Все компоненты реализуются как React-компоненты с CSS Variables из дизайн-токенов.

**Дизайн-токены (CSS Variables из goulashDesign.pen):**
- Цвета: `--bg-app`, `--bg-surface`, `--bg-subtle`, `--bg-border`, `--color-primary`, `--color-primary-light`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info` и их soft/text варианты
- Радиусы: `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-pill` (9999px)
- Типографика: Inter, размеры 11-32px, веса normal/500/600/bold
- Тени: sm (blur:3 offset:1), md (blur:8 offset:2), lg (blur:32 offset:12)

**Компоненты из GoulashDesign для использования:**
- **Button**: Primary, Secondary, Outline, Ghost, Danger (с иконками lucide)
- **Input / SearchInput / Select / Textarea**: Поля ввода с label, placeholder, helper text
- **Card**: Header + Content + Footer с border-разделителями
- **Badge**: Success, Warning, Danger, Neutral (для статусов поставщиков)
- **Toast**: Success, Warning, Error, Info (для уведомлений)
- **EmptyState**: Иконка + заголовок + описание (для пустых результатов поиска)
- **Header**: Верхняя панель с поиском и аватаром
- **FilterPanel**: Панель фильтров с SearchInput, Select, Toggle
- **Tabs**: Для переключения видов
- **Breadcrumb**: Навигация по хлебным крошкам

### 5. Страницы фронтенда

**Решение:**
- `/` — Главная: строка поиска + список поставщиков с фильтрами
- `/suppliers/:id` — Карточка поставщика (детальная информация)
- `/suppliers/new` — Добавление нового поставщика
- `/suppliers/:id/edit` — Редактирование поставщика
- `/compare` — Сравнение выбранных поставщиков

**Обоснование:** Минимальный набор страниц для полного пользовательского сценария. Поиск на главной — точка входа. Сравнение — отдельная страница для параллельного просмотра.

### 6. REST API структура

**Решение:**
```
GET    /api/categories              — список категорий
POST   /api/categories              — создать категорию
GET    /api/suppliers               — список поставщиков (с фильтрами)
POST   /api/suppliers               — создать поставщика
GET    /api/suppliers/:id           — детали поставщика
PUT    /api/suppliers/:id           — обновить поставщика
DELETE /api/suppliers/:id           — удалить поставщика
GET    /api/suppliers/search        — поиск с фильтрами
GET    /api/suppliers/compare?ids=1,2,3 — данные для сравнения
```

**Обоснование:** Стандартный REST. Фильтры через query-параметры (`?category=2&city=Москва&search=мясо`). Отдельный эндпоинт `/search` для сложной фильтрации.

### 7. Docker Compose для разработки

**Решение:**
- `db` — PostgreSQL 16
- `backend` — Flask с hot-reload
- `frontend` — Vite dev server с hot-reload

**Обоснование:** Одна команда `docker compose up` для запуска всего окружения. Hot-reload для комфортной разработки.

### 8. Структура проекта

```
goodsSupplier/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # SQLAlchemy модели
│   │   ├── routes/
│   │   │   ├── categories.py    # API категорий
│   │   │   ├── suppliers.py     # API поставщиков
│   │   │   └── search.py        # API поиска и сравнения
│   │   ├── schemas.py           # Сериализация/валидация (marshmallow или pydantic)
│   │   └── database.py          # Настройка БД
│   ├── migrations/              # Alembic миграции
│   ├── seed.py                  # Начальные данные
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # Переиспользуемые компоненты
│   │   ├── pages/               # Страницы
│   │   ├── api/                 # Запросы к API
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── openspec/                    # Спецификации OpenSpec
```

**Обоснование:** Чёткое разделение backend/frontend. Внутри бэкенда — разделение на models/routes/schemas. Минимум вложенности.

## Risks / Trade-offs

- **[Нет авторизации]** → Любой может добавлять/редактировать поставщиков. Для MVP допустимо, добавить авторизацию в следующей итерации.
- **[Простые строковые поля для города/региона]** → Может быть опечатки, дубли. Для MVP терпимо → в будущем справочник городов.
- **[Без пагинации на старте]** → При большом количестве поставщиков может тормозить → добавить пагинацию с лимитом по умолчанию.
- **[Одна БД без кэширования]** → При росте нагрузки может стать узким местом → для MVP с десятками/сотнями поставщиков неактуально.
- **[CSS без UI-библиотеки]** → Больше времени на стили, но меньше зависимостей → можно подключить MUI/Ant Design позже.