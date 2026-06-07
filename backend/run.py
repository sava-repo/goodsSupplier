"""Локальный запуск Flask-приложения для разработки.

Для production используйте WSGI-сервер (gunicorn/uwsgi).

Usage::

    python run.py
    FLASK_ENV=development python run.py
"""
from __future__ import annotations

import os

from app import create_app

app = create_app()


if __name__ == '__main__':
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', '5000'))
    debug = app.config.get('DEBUG', False)
    app.run(host=host, port=port, debug=debug)
