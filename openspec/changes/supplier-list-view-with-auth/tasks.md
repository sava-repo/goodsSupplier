## Tasks

### Epic 1: Backend — Авторизация
- [x] **T1.1** Добавить Flask-JWT-Extended в requirements.txt
- [x] **T1.2** Создать модель User в backend/app/models.py
- [x] **T1.3** Создать backend/app/routes/auth.py (register, login, me)
- [x] **T1.4** Зарегистрировать auth blueprint в __init__.py
- [x] **T1.5** Настроить JWT config в create_app()

### Epic 2: Backend — Пользовательские заметки
- [x] **T2.1** Создать модель SupplierNote в backend/app/models.py
- [x] **T2.2** Создать backend/app/routes/notes.py (GET, PUT, DELETE note)
- [x] **T2.3** Зарегистрировать notes blueprint в __init__.py
- [x] **T2.4** Модифицировать GET /api/suppliers — добавлять user_note при авторизации

### Epic 3: Frontend — Авторизация
- [x] **T3.1** Создать frontend/src/api/auth.js (register, login, me)
- [x] **T3.2** Модифицировать frontend/src/api/client.js — добавить JWT в заголовки
- [x] **T3.3** Создать frontend/src/context/AuthContext.jsx
- [x] **T3.4** Создать frontend/src/pages/LoginPage.jsx
- [x] **T3.5** Создать frontend/src/pages/RegisterPage.jsx
- [x] **T3.6** Обновить App.jsx — AuthProvider, ProtectedRoute, маршруты

### Epic 4: Frontend — Таблица поставщиков
- [x] **T4.1** Создать frontend/src/components/SupplierList.jsx
- [x] **T4.2** Создать frontend/src/components/SupplierList.module.css
- [x] **T4.3** Обновить HomePage.jsx — заменить SupplierCard на SupplierList
- [x] **T4.4** Обновить HomePage.module.css — стили для таблицы
- [x] **T4.5** Реализовать inline-редактирование заметок с debounce и автосохранением

### Epic 5: Тестирование и миграция
- [x] **T5.1** Создать миграцию для новых таблиц (users, supplier_notes) — db.create_all()
- [ ] **T5.2** Протестировать API авторизации (register, login, me)
- [ ] **T5.3** Протестировать API заметок
- [x] **T5.4** Протестировать отображение таблицы на HomePage — сборка успешна
- [ ] **T5.5** Протестировать inline-редактирование заметок
