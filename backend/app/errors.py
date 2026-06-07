"""Глобальные обработчики ошибок Flask и JWT.

Все необработанные исключения на уровне фреймворка (404, 405, 500)
и ошибки JWT (просрочен, недействителен, отсутствует) возвращаются
в едином формате ``{'error': 'описание'}``, который совместим с тем,
что возвращают маршруты вручную.

Маршруты, которые уже возвращают ``{'error': ...}`` или ``{'errors': ...}``
(ошибки валидации Marshmallow), НЕ затрагиваются этими обработчиками —
они перехватывают только то, что «упало» до или после логики маршрута.
"""
from __future__ import annotations

from flask import jsonify
from werkzeug.exceptions import HTTPException
from werkzeug.http import HTTP_STATUS_CODES


def _error_response(message: str, status_code: int):
    """Сформировать стандартный JSON-ответ для ошибки.

    Формат: ``{'error': message}`` с HTTP status code.
    Используется всеми глобальными обработчиками ниже.
    """
    return jsonify({'error': message}), status_code


def register_error_handlers(app):
    """Зарегистрировать все обработчики ошибок на экземпляре Flask.

    Вызывается из :func:`app.create_app` после инициализации расширений
    и blueprints.

    Обрабатываются:
        - Все :class:`~werkzeug.exceptions.HTTPException` (404, 405, 413, …).
        - Общие :class:`Exception` (500).
        - JWT-ошибки (expired, invalid, revoked, absent).
    """
    # --- HTTP-исключения (404, 405, …) ----------------------------------
    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        """Обработка всех Werkzeug HTTPException.

        Для 404 возвращает ``{'error': 'Не найдено'}``.
        Для остальных — описание из Werkzeug или стандартный текст.
        """
        description = exc.description or HTTP_STATUS_CODES.get(exc.code, 'Ошибка')
        # Оставляем краткое описание без лишних деталей
        return _error_response(description, exc.code)

    # --- Общие исключения (500) -----------------------------------------
    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc: Exception):
        """Ловушка для непредвиденных ошибок.

        В режиме DEBUG перебрасывает исключение дальше (Flask покажет
        трейсбек). В production возвращает ``{'error': 'Внутренняя ошибка сервера'}``.
        """
        if app.config.get('DEBUG'):
            raise exc
        app.logger.exception('Неперехваченное исключение: %s', exc)
        return _error_response('Внутренняя ошибка сервера', 500)

    # --- JWT-ошибки -----------------------------------------------------
    # Все возвращают формат {'error': 'описание'} с соответствующим кодом.
    try:
        from flask_jwt_extended import (
            ExpiredAccessTokenError,
            NoAuthorizationError,
            InvalidTokenError,
            RevokedTokenError,
            WrongTokenError,
            FreshTokenRequired,
            UserClaimsVerificationError,
            CSRFError,
        )

        @app.errorhandler(ExpiredAccessTokenError)
        def _handle_expired(_exc):
            """Срок действия токена истёк."""
            return _error_response('Срок действия токена истёк', 401)

        @app.errorhandler(NoAuthorizationError)
        def _handle_no_auth(_exc):
            """Токен отсутствует в запросе."""
            return _error_response('Требуется авторизация', 401)

        @app.errorhandler(InvalidTokenError)
        def _handle_invalid(_exc):
            """Токен недействителен (подделан или повреждён)."""
            return _error_response('Недействительный токен', 422)

        @app.errorhandler(RevokedTokenError)
        def _handle_revoked(_exc):
            """Токен был отозван."""
            return _error_response('Токен отозван', 401)

        @app.errorhandler(WrongTokenError)
        def _handle_wrong_token(_exc):
            """Передан refresh-токен вместо access (или наоборот)."""
            return _error_response('Неверный тип токена', 422)

        @app.errorhandler(FreshTokenRequired)
        def _handle_not_fresh(_exc):
            """Требуется fresh-токен (повторный вход)."""
            return _error_response('Требуется повторная авторизация', 401)

        @app.errorhandler(UserClaimsVerificationError)
        def _handle_claims(_exc):
            """Проверка claims не прошла."""
            return _error_response('Недостаточно прав', 403)

        @app.errorhandler(CSRFError)
        def _handle_csrf(_exc):
            """CSRF-защита двойной отправки (если включена)."""
            return _error_response('Ошибка CSRF', 401)

    except ImportError:
        # flask_jwt_extended не установлен — обработчики не регистрируем
        pass
