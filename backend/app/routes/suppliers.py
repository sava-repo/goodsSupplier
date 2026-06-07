"""CRUD-эндпоинты для поставщиков.

* ``GET   /api/suppliers``          — список (с пагинацией, сортировкой,
  user_note для авторизованных).
* ``POST  /api/suppliers``          — создание (требует JWT).
* ``GET   /api/suppliers/<id>``     — детали поставщика.
* ``PUT   /api/suppliers/<id>``     — обновление (требует JWT).
* ``DELETE /api/suppliers/<id>``    — мягкое удаление (требует JWT).
"""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.database import db
from app.models import Supplier, Category, Subcategory
from app.schemas import (
    supplier_create_schema,
    supplier_update_schema,
)
from app.utils.pagination import attach_user_notes
from app.utils.sorting import parse_sort_params
from app.utils.db import verify_ids_exist

suppliers_bp = Blueprint('suppliers', __name__)


# Поля сортировки поставщика
SORTABLE_FIELDS = {
    'name': Supplier.name,
    'city': Supplier.city,
    'min_order_amount': Supplier.min_order_amount,
    'certificates': Supplier.certificate_urls.isnot(None),
}

# Поля, которые можно обновлять через PUT
UPDATABLE_FIELDS = (
    'name', 'description', 'contact_person', 'phone', 'email',
    'website', 'source_url', 'city', 'region', 'address', 'inn',
    'min_order_amount', 'price_range',
    'certificate_details', 'certificate_urls', 'delivery_conditions', 'notes',
)


@suppliers_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_suppliers():
    """GET /api/suppliers — список активных поставщиков.

    Query-параметры:
        page (int):     номер страницы (по умолч. 1).
        per_page (int): размер страницы (по умолч. 20, макс. 100).
        sort_by (str):  поле сортировки (name|city|min_order_amount|certificates).
        sort_order (str): 'asc' | 'desc'.

    Returns:
        ``{items: [...], total, page, per_page, pages}``.
        При авторизованном запросе в каждый item добавляется ``user_note``.
    """
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    order_expr, _, err = parse_sort_params(SORTABLE_FIELDS)
    if err:
        return jsonify({'error': err[1]}), err[0]

    query = (
        Supplier.query
        .filter_by(is_active=True)
        .order_by(order_expr, Supplier.id)
    )
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


@suppliers_bp.route('', methods=['POST'])
@jwt_required()
def create_supplier():
    """POST /api/suppliers — создать поставщика.

    Тело запроса должно соответствовать ``SupplierCreateSchema``,
    включая ``category_ids`` и ``subcategory_ids`` для привязки M2M.

    Returns:
        201 — созданный поставщик.
        400 — ошибка валидации или несуществующие категории/подкатегории.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = supplier_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    category_ids = data.pop('category_ids', [])
    subcategory_ids = data.pop('subcategory_ids', [])

    categories, err = verify_ids_exist(
        Category, category_ids, 'Одна или несколько категорий не найдены'
    )
    if err:
        return err

    subcategories, err = verify_ids_exist(
        Subcategory, subcategory_ids, 'Одна или несколько подкатегорий не найдены'
    )
    if err:
        return err

    supplier = Supplier(**data)
    for cat in categories:
        supplier.categories.append(cat)
    for sc in subcategories:
        supplier.subcategories.append(sc)

    db.session.add(supplier)
    db.session.commit()

    return jsonify(supplier.to_dict()), 201


@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
def get_supplier(supplier_id: int):
    """GET /api/suppliers/<id> — детали поставщика.

    Возвращает полный словарь поставщика, включая categories/subcategories.
    Неактивные поставщики (is_active=False) возвращают 404.
    """
    supplier = Supplier.query.get(supplier_id)
    if not supplier or not supplier.is_active:
        return jsonify({'error': 'Поставщик не найден'}), 404
    return jsonify(supplier.to_dict())


@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(supplier_id: int):
    """PUT /api/suppliers/<id> — обновить поставщика.

    Все поля опциональны. ``category_ids`` и ``subcategory_ids`` при
    передаче полностью заменяют текущие связи.
    """
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = supplier_update_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    category_ids = data.pop('category_ids', None)
    subcategory_ids = data.pop('subcategory_ids', None)

    # Обновляем простые поля
    for field in UPDATABLE_FIELDS:
        if field in data:
            setattr(supplier, field, data[field])

    # M2M: категории
    if category_ids is not None:
        categories, err = verify_ids_exist(
            Category, category_ids, 'Одна или несколько категорий не найдены'
        )
        if err:
            return err
        supplier.categories = categories

    # M2M: подкатегории
    if subcategory_ids is not None:
        subcategories, err = verify_ids_exist(
            Subcategory, subcategory_ids, 'Одна или несколько подкатегорий не найдены'
        )
        if err:
            return err
        supplier.subcategories = subcategories

    db.session.commit()
    return jsonify(supplier.to_dict())


@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id: int):
    """DELETE /api/suppliers/<id> — мягкое удаление (is_active=False).

    Сама запись остаётся в БД, но не попадает в списки и поиск.
    """
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    supplier.is_active = False
    db.session.commit()
    return jsonify({'message': 'Поставщик удалён'}), 200
