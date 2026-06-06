from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Supplier

locations_bp = Blueprint('locations', __name__)

MAX_RESULTS = 20


@locations_bp.route('/locations', methods=['GET'])
def list_locations():
    """GET /api/suppliers/locations?q=<term> — список уникальных локаций.

    Возвращает города и регионы активных поставщиков, начинающиеся с
    введённых символов (case-insensitive). Применяется для автодополнения
    в фильтре поставщиков на главной странице.

    Каждый элемент содержит поля:
      - value: название города или региона
      - type:  'city' | 'region'

    Фильтрация выполняется на стороне Python через str.lower(), что
    корректно работает с Unicode (включая кириллицу) независимо от СУБД.
    Результаты сортируются по названию по алфавиту без группировки
    по типу.
    """
    q = request.args.get('q', '', type=str).strip()

    if not q:
        return jsonify({'items': []})

    city_rows = (
        db.session.query(Supplier.city.label('value'))
        .filter(Supplier.is_active.is_(True))
        .filter(Supplier.city.isnot(None))
        .distinct()
        .all()
    )
    region_rows = (
        db.session.query(Supplier.region.label('value'))
        .filter(Supplier.is_active.is_(True))
        .filter(Supplier.region.isnot(None))
        .distinct()
        .all()
    )

    q_lower = q.lower()
    cities = [
        {'value': row[0], 'type': 'city'}
        for row in city_rows
        if row[0] and row[0].lower().startswith(q_lower)
    ]
    regions = [
        {'value': row[0], 'type': 'region'}
        for row in region_rows
        if row[0] and row[0].lower().startswith(q_lower)
    ]

    combined = cities + regions
    combined.sort(key=lambda item: item['value'].lower())
    return jsonify({'items': combined[:MAX_RESULTS]})
