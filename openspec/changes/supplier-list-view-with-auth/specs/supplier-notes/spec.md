## ADDED Requirements

### Requirement: Создание/обновление заметки к поставщику
Система SHALL позволять авторизованному пользователю создавать или обновлять текстовую заметку, привязанную к поставщику.

#### Scenario: Создание заметки
- **WHEN** PUT /api/suppliers/1/note с note текстом
- **THEN** статус 200 с данными заметки

#### Scenario: Обновление существующей заметки
- **WHEN** PUT /api/suppliers/1/note с новым текстом
- **THEN** статус 200 с обновленной заметкой

#### Scenario: Неавторизованный запрос
- **WHEN** PUT /api/suppliers/1/note без JWT
- **THEN** статус 401

### Requirement: Получение заметки

#### Scenario: Заметка существует
- **WHEN** GET /api/suppliers/1/note с JWT
- **THEN** возвращается текст заметки

#### Scenario: Заметка не найдена
- **WHEN** GET /api/suppliers/1/note с JWT, но заметки нет
- **THEN** статус 200 с note: null

### Requirement: Удаление заметки

#### Scenario: Успешное удаление
- **WHEN** DELETE /api/suppliers/1/note с JWT
- **THEN** статус 200

### Requirement: Заметки в списке поставщиков

#### Scenario: Авторизованный запрос списка
- **WHEN** GET /api/suppliers с JWT
- **THEN** каждый поставщик содержит поле user_note

#### Scenario: Неавторизованный запрос списка
- **WHEN** GET /api/suppliers без JWT
- **THEN** поле user_note отсутствует
