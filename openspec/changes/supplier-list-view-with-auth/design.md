## Architecture Overview

Изменение затрагивает три слоя: backend (модели + API), frontend (компоненты + маршруты), и добавляет новый модуль авторизации.

## Backend Changes

### Новые модели

**User** (таблица `users`):
- `id` (Integer, PK)
- `username` (String(80), unique, not null)
- `password_hash` (String(256), not null)
- `created_at` (DateTime)

**SupplierNote** (таблица `supplier_notes`):
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id)
- `supplier_id` (Integer, FK → suppliers.id)
- `note` (Text)
- `updated_at` (DateTime)
- UniqueConstraint(user_id, supplier_id)

### Новые зависимости

- `Flask-JWT-Extended==4.6.0` — JWT-авторизация
- `werkzeug.security` (встроено во Flask) — хеширование паролей

### Новые API endpoints

**Авторизация:**
- `POST /api/auth/register` — регистрация (username, password)
- `POST /api/auth/login` — вход → JWT access token
- `GET /api/auth/me` — данные текущего пользователя (требует JWT)

**Заметки:**
- `GET /api/suppliers/<id>/note` — заметка текущего пользователя по поставщику
- `PUT /api/suppliers/<id>/note` — создать/обновить заметку
- `DELETE /api/suppliers/<id>/note` — удалить заметку

### Изменение существующих endpoints

- `GET /api/suppliers` — в `to_dict()` уже возвращаются `min_order_amount`, `has_certificates`, `city`, `categories`. Дополнительно: при авторизованном запросе присоединять `user_note` из SupplierNote.

## Frontend Changes

### Новые файлы

| Файл | Назначение |
|---|---|
| `pages/LoginPage.jsx` | Форма входа |
| `pages/RegisterPage.jsx` | Форма регистрации |
| `context/AuthContext.jsx` | Провайдер авторизации (JWT, user, login/logout) |
| `api/auth.js` | API-клиент для авторизации |
| `components/SupplierList.jsx` | Таблица поставщиков |
| `components/SupplierList.module.css` | Стили таблицы |

### Изменяемые файлы

| Файл | Изменение |
|---|---|
| `App.jsx` | Добавить AuthProvider, маршруты /login, /register, ProtectedRoute |
| `api/client.js` | Добавить JWT-токен в заголовки Authorization |
| `pages/HomePage.jsx` | Заменить SupplierCard на SupplierList |
| `pages/HomePage.module.css` | Обновить стили (grid → table) |

### Компонент SupplierList

Таблица со столбцами:
1. **Название** — ссылка на `/suppliers/{id}`
2. **Город** — текст
3. **Категории** — бейджи
4. **Мин. сумма заказа** — текст из `min_order_amount`
5. **Сертификаты** — иконка Check/X (да/нет) из `has_certificates`
6. **Заметка** — inline textarea, автосохранение с debounce (если авторизован), placeholder «Ваша заметка» если нет

## Data Flow

```
LoginPage → POST /api/auth/login → JWT token → localStorage
    ↓
AuthContext → читает JWT из localStorage → предоставляет user + isAuthenticated
    ↓
HomePage → GET /api/suppliers (с JWT в заголовке) → список с user_note
    ↓
SupplierList → рендерит таблицу → заметка редактируется inline
    ↓
PUT /api/suppliers/{id}/note → сохранение заметки
```

## Security

- Пароли хешируются через `werkzeug.security.generate_password_hash` (pbkdf2)
- JWT токен с expiration (24 часа)
- SupplierNote доступен только владельцу (фильтрация по user_id из JWT)
- CORS уже настроен через flask-cors