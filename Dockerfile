# ── Stage 1: Сборка фронтенда (Vite) ───────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2: Runtime (Python + nginx) ──────────────────────────────
FROM python:3.11-slim

# nginx для раздачи статики и проксирования API
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/* && \
    rm -f /etc/nginx/sites-enabled/default

# Backend: зависимости и код
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Собранная статика фронтенда
COPY --from=frontend-build /build/dist /usr/share/nginx/html

# Конфигурация nginx и стартовый скрипт
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
