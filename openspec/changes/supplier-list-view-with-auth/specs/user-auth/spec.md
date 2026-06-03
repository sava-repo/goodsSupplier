## ADDED Requirements

### Requirement: Регистрация пользователя
Система SHALL позволять регистрировать нового пользователя с уникальным username и паролем.

#### Scenario: Успешная регистрация
- **WHEN** POST /api/auth/register с username и password
- **THEN** статус 201, возвращается id и username

#### Scenario: Дублирование username
- **WHEN** POST /api/auth/register с существующим username
- **THEN** статус 400 с описанием ошибки

#### Scenario: Отсутствие обязательных полей
- **WHEN** POST /api/auth/register без username или password
- **THEN** статус 400 с описанием ошибки валидации

### Requirement: Вход пользователя (login)
Система SHALL аутентифицировать пользователя по логину и паролю и выдавать JWT access token.

#### Scenario: Успешный вход
- **WHEN** POST /api/auth/login с корректными username и password
- **THEN** статус 200 с access_token и данными пользователя

#### Scenario: Неверные учётные данные
- **WHEN** POST /api/auth/login с неверным password
- **THEN** статус 401

#### Scenario: Несуществующий пользователь
- **WHEN** POST /api/auth/login с несуществующим username
- **THEN** статус 401

### Requirement: Получение данных текущего пользователя
Система SHALL возвращать данные текущего авторизованного пользователя по JWT токену.

#### Scenario: Авторизованный запрос
- **WHEN** GET /api/auth/me с валидным JWT
- **THEN** возвращается id и username

#### Scenario: Неавторизованный запрос
- **WHEN** GET /api/auth/me без JWT
- **THEN** статус 401