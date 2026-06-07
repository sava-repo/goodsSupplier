"""Автодополнение по городам.

``GET /api/suppliers/cities?q=<term>`` — возвращает уникальные города
активных поставщиков, начинающиеся с введённых символов.
"""
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Supplier

cities_bp = Blueprint('cities', __name__)

MAX_CITIES = 20


@cities_bp.route('/cities', methods=['GET'])
def list_cities():
    """GET /api/suppliers/cities?q=<term> — список уникальных городов.

    Поиск по префиксу (case-insensitive): город должен начинаться с
    введённых символов. Возвращает города активных поставщиков,
    отсортированные по алфавиту, не более MAX_CITIES штук.

    Фильтрация выполняется на стороне Python через str.lower(), что
    корректно работает с Unicode (включая кириллицу) независимо от СУБД.
    """
    q = request.args.get('q', '', type=str).strip()

    if not q:
        return jsonify({'items': []})

    rows = (
        db.session.query(Supplier.city)
        .filter(Supplier.is_active.is_(True))
        .filter(Supplier.city.isnot(None))
        .distinct()
        .order_by(Supplier.city)
        .all()
    )
    all_cities = [row[0] for row in rows if row[0]]

    q_lower = q.lower()
    cities = [c for c in all_cities if c.lower().startswith(q_lower)]
    return jsonify({'items': cities[:MAX_CITIES]})
