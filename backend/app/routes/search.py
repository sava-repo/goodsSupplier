"""Поиск и сравнение поставщиков.

* ``GET /api/suppliers/search``  — поиск с фильтрами, сортировкой,
  пагинацией. Не требует JWT (но при авторизации добавляет ``user_note``).
* ``GET /api/suppliers/compare`` — данные до 5 поставщиков по id для
  страницы сравнения.
"""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from app.models import Supplier, Category
from app.utils.pagination import attach_user_notes
from app.utils.sorting import parse_sort_params

search_bp = Blueprint('search', __name__)


# Поля сортировки (см. parse_sort_params)
SORTABLE_FIELDS = {
    'name': Supplier.name,
    'city': Supplier.city,
    'min_order_amount': Supplier.min_order_amount,
    'certificates': Supplier.certificate_urls.isnot(None),
}

# Максимум поставщиков в одном сравнении
MAX_COMPARE_ITEMS = 5


@search_bp.route('/search', methods=['GET'])
@jwt_required(optional=True)
def search_suppliers():
    """GET /api/suppliers/search — поиск с фильтрами.

    Query-параметры:
        q (str):           поиск по названию (ilike %q%).
        category_id (str): id категорий через запятую (OR-фильтр).
        city (str):        точный фильтр по городу (ilike %city%).
        region (str):      точный фильтр по региону (ilike %region%).
        location (str):    свободный поиск по городу ИЛИ региону
                           (используется, когда пользователь не выбрал
                           конкретный элемент из подсказок).
        sort_by (str):     поле сортировки.
        sort_order (str):  'asc' | 'desc'.
        page, per_page:    пагинация.

    Returns:
        ``{items, total, page, per_page, pages}``.
    """
    query_text = request.args.get('q', '', type=str).strip()
    category_ids_str = request.args.get('category_id', '', type=str)
    city = request.args.get('city', '', type=str).strip()
    region = request.args.get('region', '', type=str).strip()
    location = request.args.get('location', '', type=str).strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    order_expr, _, err = parse_sort_params(SORTABLE_FIELDS)
    if err:
        return jsonify({'error': err[1]}), err[0]

    query = Supplier.query.filter_by(is_active=True)

    # Поиск по названию
    if query_text:
        query = query.filter(Supplier.name.ilike(f'%{query_text}%'))

    # Фильтр по категориям (несколько через запятую — OR)
    if category_ids_str:
        try:
            category_ids = [
                int(cid.strip()) for cid in category_ids_str.split(',') if cid.strip()
            ]
        except ValueError:
            return jsonify({'error': 'Некорректный формат category_id'}), 400

        if category_ids:
            query = query.filter(
                Supplier.categories.any(Category.id.in_(category_ids))
            )

    # Фильтр по городу
    if city:
        query = query.filter(Supplier.city.ilike(f'%{city}%'))

    # Фильтр по региону
    if region:
        query = query.filter(Supplier.region.ilike(f'%{region}%'))

    # Свободный «location» — OR по городу и региону
    if location and not city and not region:
        query = query.filter(
            or_(
                Supplier.city.ilike(f'%{location}%'),
                Supplier.region.ilike(f'%{location}%'),
            )
        )

    query = query.order_by(order_expr, Supplier.id)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    jwt_data = get_jwt()
    user_id = int(get_jwt_identity()) if jwt_data else None
    items = attach_user_notes(paginated.items, user_id)

    return jsonify({
        'items': items,
        'total': paginated.total,
        'page': paginated.page,
        'per_page': paginated.per_page,
        'pages': paginated.pages,
    })


@search_bp.route('/compare', methods=['GET'])
def compare_suppliers():
    """GET /api/suppliers/compare?ids=1,2,3 — данные для страницы сравнения.

    Query-параметры:
        ids (str): список id через запятую (максимум 5).

    Returns:
        Массив сериализованных поставщиков.
    """
    ids_str = request.args.get('ids', '', type=str).strip()

    if not ids_str:
        return jsonify({'error': 'Укажите параметр ids'}), 400

    try:
        ids = [int(i.strip()) for i in ids_str.split(',') if i.strip()]
    except ValueError:
        return jsonify({'error': 'Некорректный формат ids'}), 400

    if not ids:
        return jsonify({'error': 'Список ids пуст'}), 400

    if len(ids) > MAX_COMPARE_ITEMS:
        return jsonify({
            'error': f'Максимум {MAX_COMPARE_ITEMS} поставщиков для сравнения'
        }), 400

    suppliers = Supplier.query.filter(
        Supplier.id.in_(ids), Supplier.is_active.is_(True)
    ).all()

    if len(suppliers) != len(ids):
        found_ids = {s.id for s in suppliers}
        missing = [i for i in ids if i not in found_ids]
        return jsonify({
            'error': f'Поставщики не найдены: {missing}'
        }), 404

    return jsonify([s.to_dict() for s in suppliers])
