"""Фабрика Flask-приложения.

Создаёт экземпляр Flask, инициализирует расширения (SQLAlchemy, JWT, CORS,
Migrate), регистрирует blueprints и обработчики ошибок.

Использование::

    from app import create_app
    app = create_app()

Конфигурация выбирается через переменную окружения ``FLASK_ENV``
(см. :mod:`app.config`).
"""
from __future__ import annotations

import os
import sqlite3
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import event
from flask_migrate import Migrate

from app.config import get_config
from app.database import db


migrate = Migrate()


def _register_unicode_lower(dbapi_conn, _):
    """Переопределяет SQLite-функцию LOWER на Python str.lower().

    Стандартный SQLite LOWER() работает только с ASCII. Кастомная версия
    корректно приводит к нижнему регистру Unicode-символы (включая
    кириллицу), что делает ilike-запросы регистронезависимыми для всех
    символов, а не только для латиницы.
    """
    if isinstance(dbapi_conn, sqlite3.Connection):
        dbapi_conn.create_function(
            'lower', 1,
            lambda s: s.lower() if isinstance(s, str) else s,
        )


def _ensure_jwt_secret(app: Flask) -> None:
    """Гарантирует, что JWT_SECRET_KEY задан.

    В режиме production отсутствие ключа — критическая ошибка:
    приложение не стартует. В development — фолбэк на dev-секрет.
    """
    if not app.config.get('JWT_SECRET_KEY'):
        if app.config.get('DEBUG'):
            app.config['JWT_SECRET_KEY'] = 'dev-secret-do-not-use-in-prod'
        else:
            raise RuntimeError(
                'JWT_SECRET_KEY обязателен в production. '
                'Задайте его через переменную окружения.'
            )


def create_app() -> Flask:
    """Создать и настроить Flask-приложение.

    Returns:
        Готовый к использованию экземпляр :class:`Flask`.
    """
    config_cls = get_config()
    app = Flask(__name__)
    app.config.from_object(config_cls)

    _ensure_jwt_secret(app)

    db.init_app(app)
    migrate.init_app(app, db)

    # CORS: только разрешённые источники (см. CORS_ORIGINS в config.py)
    CORS(
        app,
        resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}},
        supports_credentials=False,
    )

    JWTManager(app)

    # SQLite: переопределяем LOWER() для поддержки Unicode (кириллицы).
    # На PostgreSQL/MySQL listener не регистрируется — там ilike/LOWER
    # изначально работают с Unicode.
    with app.app_context():
        if db.engine.dialect.name == 'sqlite':
            event.listen(db.engine, 'connect', _register_unicode_lower)

    # Регистрируем blueprints
    from app.routes.auth import auth_bp
    from app.routes.categories import categories_bp
    from app.routes.cities import cities_bp
    from app.routes.locations import locations_bp
    from app.routes.notes import notes_bp
    from app.routes.search import search_bp
    from app.routes.subcategories import subcategories_bp
    from app.routes.suppliers import suppliers_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(subcategories_bp, url_prefix='/api/subcategories')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(search_bp, url_prefix='/api/suppliers')
    app.register_blueprint(notes_bp, url_prefix='/api/suppliers')
    app.register_blueprint(cities_bp, url_prefix='/api/suppliers')
    app.register_blueprint(locations_bp, url_prefix='/api/suppliers')

    @app.route('/api/health')
    def health():
        """Health-check: быстрый ответ для проверки работоспособности."""
        return {'status': 'ok'}

    # Глобальные обработчики ошибок (404, 500, JWT)
    from app.errors import register_error_handlers
    register_error_handlers(app)

    # Примечание: db.create_all() убран — управление схемой через Alembic.
    # Команда применения миграций: ``flask --app app db upgrade``.

    return app
