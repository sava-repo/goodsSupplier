"""Конфигурация приложения.

Классы-наследники BaseConfig задают настройки для разных сред.
Выбор класса происходит через переменную FLASK_ENV:

    FLASK_ENV=development   → DevelopmentConfig
    FLASK_ENV=production    → ProductionConfig

Все чувствительные значения (JWT-секрет, URL БД, список CORS-источников)
обязательно должны быть заданы через переменные окружения.
"""
from __future__ import annotations

import os
from datetime import timedelta


def _env_bool(name: str, default: bool = False) -> bool:
    """Преобразует строковое значение env-переменной в bool."""
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ('1', 'true', 'yes', 'on')


def _env_list(name: str, default: str = '') -> list[str]:
    """Парсит env-строку вида 'http://a,http://b' в список."""
    raw = os.environ.get(name, default)
    return [x.strip() for x in raw.split(',') if x.strip()]


class BaseConfig:
    """Базовые настройки, общие для всех сред."""

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        'DATABASE_URL',
        'sqlite:///' + os.path.abspath(
            os.path.join(os.path.dirname(__file__), '..', 'dev.db')
        ),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # JWT
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', '')
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        hours=int(os.environ.get('JWT_ACCESS_TOKEN_HOURS', '24'))
    )

    # CORS: список origin-ов, разделённых запятыми
    CORS_ORIGINS: list[str] = _env_list(
        'CORS_ORIGINS', 'http://localhost:3000'
    )

    # Безопасность паролей
    MIN_PASSWORD_LENGTH: int = int(os.environ.get('MIN_PASSWORD_LENGTH', '8'))


class DevelopmentConfig(BaseConfig):
    """Настройки для локальной разработки."""

    DEBUG: bool = True
    # В dev позволяем фолбэк JWT-секрета, чтобы не мучить разработчика.
    JWT_SECRET_KEY: str = os.environ.get(
        'JWT_SECRET_KEY', 'dev-secret-do-not-use-in-prod'
    )


class ProductionConfig(BaseConfig):
    """Настройки для production. Строгие требования к секретам."""

    DEBUG: bool = False


CONFIG_BY_NAME: dict[str, type[BaseConfig]] = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}


def get_config() -> type[BaseConfig]:
    """Возвращает класс конфига по переменной FLASK_ENV."""
    env_name = os.environ.get('FLASK_ENV', 'development').lower()
    return CONFIG_BY_NAME.get(env_name, DevelopmentConfig)
