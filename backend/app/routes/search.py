from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from app.database import db
from app.models import Supplier, Category

search_bp = Blueprint('search', __name__)


@search_bp.route('/search', methods=['GET'])
def search_suppliers():
    """GET /api/suppliers/search — поиск с фильтрами и пагинацией."""
    query_text = request.args.get('q', '', type=str).strip()
    category_ids_str = request.args.get('category_id', '', type=str)
    city = request.args.get('city', '', type=str).strip()
    region = request.args.get('region', '', type=str).strip()
    location = request.args.get('location', '', type=str).strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)

    query = Supplier.query.filter_by(is_active=True)

    # Поиск по названию (case-insensitive, частичное совпадение)
    if query_text:
        query = query.filter(Supplier.name.ilike(f'%{query_text}%'))

    # Фильтрация по категориям (поддержка нескольких через запятую, OR)
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

    # Фильтрация по городу (частичное совпадение)
    if city:
        query = query.filter(Supplier.city.ilike(f'%{city}%'))

    # Фильтрация по региону (частичное совпадение)
    if region:
        query = query.filter(Supplier.region.ilike(f'%{region}%'))

    # Фильтрация по локации: OR-поиск по городу и региону.
    # Используется при свободном вводе в поле «Город или регион»,
    # когда пользователь не выбрал конкретный элемент из подсказок.
    if location and not city and not region:
        query = query.filter(
            or_(
                Supplier.city.ilike(f'%{location}%'),
                Supplier.region.ilike(f'%{location}%'),
            )
        )

    query = query.order_by(Supplier.name)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'items': [s.to_dict() for s in paginated.items],
        'total': paginated.total,
        'page': paginated.page,
        'per_page': paginated.per_page,
        'pages': paginated.pages,
    })


@search_bp.route('/compare', methods=['GET'])
def compare_suppliers():
    """GET /api/suppliers/compare?ids=1,2,3 — данные для сравнения (максимум 5)."""
    ids_str = request.args.get('ids', '', type=str).strip()

    if not ids_str:
        return jsonify({'error': 'Укажите параметр ids'}), 400

    try:
        ids = [int(i.strip()) for i in ids_str.split(',') if i.strip()]
    except ValueError:
        return jsonify({'error': 'Некорректный формат ids'}), 400

    if len(ids) == 0:
        return jsonify({'error': 'Список ids пуст'}), 400

    if len(ids) > 5:
        return jsonify({'error': 'Максимум 5 поставщиков для сравнения'}), 400

    suppliers = Supplier.query.filter(
        Supplier.id.in_(ids), Supplier.is_active == True
    ).all()

    if len(suppliers) != len(ids):
        found_ids = {s.id for s in suppliers}
        missing = [i for i in ids if i not in found_ids]
        return jsonify({
            'error': f'Поставщики не найдены: {missing}'
        }), 404

    return jsonify([s.to_dict() for s in suppliers])