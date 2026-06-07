"""Экземпляр SQLAlchemy, общий для всего приложения.

Инициализация ``db.init_app(app)`` происходит в :func:`app.create_app`.
Модели импортируют ``db`` отсюда для объявления колонок и связей.
"""
from flask_sqlalchemy import SQLAlchemy

# Единый экземпляр SQLAlchemy — разделяется всеми моделями.
db = SQLAlchemy()
