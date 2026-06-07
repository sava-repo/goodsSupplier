#!/bin/bash
set -e

cd /app

# Применяем миграции БД
echo "==> Applying database migrations..."
flask --app app db upgrade

# Загружаем начальные данные (идемпотентно)
echo "==> Seeding initial data..."
python seed.py

# Запускаем gunicorn в фоне (2 воркера достаточно для старта)
echo "==> Starting gunicorn..."
gunicorn --bind 127.0.0.1:5000 --workers 2 --timeout 120 run:app &

# nginx — на переднем плане (PID 1)
echo "==> Starting nginx..."
exec nginx -g 'daemon off;'
