"""CRUD-эндпоинты для подкатегорий.

* ``GET    /api/subcategories``              — список (с фильтром по category_id).
* ``GET    /api/subcategories/<id>``         — детали подкатегории.
* ``POST   /api/subcategories``              — создание.
* ``PUT    /api/subcategories/<id>``         — обновление.
* ``DELETE /api/subcategories/<id>``         — удаление (если нет поставщиков).
"""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from app.database import db
from app.models import Subcategory, Category, supplier_subcategories, Supplier
from app.schemas import subcategory_schema
from app.utils.db import get_object_or_404

subcategories_bp = Blueprint('subcategories', __name__)


@subcategories_bp.route('', methods=['GET'])
def get_subcategories():
    """GET /api/subcategories — список всех подкатегорий.

    Query-параметры:
        category_id (int, опционально): фильтр по родительской категории.

    Оптимизация N+1: ``supplier_count`` считается одним GROUP BY,
    а не отдельным ``self.suppliers.count()`` для каждой подкатегории.
    """
    category_id = request.args.get('category_id', '', type=str).strip()
    query = Subcategory.query
    if category_id:
        try:
            category_id_int = int(category_id)
        except ValueError:
            return jsonify({'error': 'Некорректный category_id'}), 400
        query = query.filter_by(category_id=category_id_int)

    subcategories = query.order_by(Subcategory.name).all()

    if not subcategories:
        return jsonify([])

    # Один запрос: количество активных поставщиков на подкатегорию
    counts_rows = (
        db.session.query(
            supplier_subcategories.c.subcategory_id,
            func.count(supplier_subcategories.c.supplier_id),
        )
        .join(Supplier, Supplier.id == supplier_subcategories.c.supplier_id)
        .filter(Supplier.is_active.is_(True))
        .group_by(supplier_subcategories.c.subcategory_id)
        .all()
    )
    counts_map = dict(counts_rows)

    result = [
        sc.to_dict(supplier_count=counts_map.get(sc.id, 0))
        for sc in subcategories
    ]
    return jsonify(result)


@subcategories_bp.route('/<int:subcategory_id>', methods=['GET'])
def get_subcategory(subcategory_id: int):
    """GET /api/subcategories/<id> — детали одной подкатегории."""
    subcategory, err = get_object_or_404(
        Subcategory, subcategory_id, 'Подкатегория не найдена'
    )
    if err:
        return err
    return jsonify(subcategory.to_dict())


@subcategories_bp.route('', methods=['POST'])
def create_subcategory():
    """POST /api/subcategories — создание подкатегории.

    Тело: ``{"name": "...", "category_id": N, "description": "..."}``.
    Уникальность: ``(name, category_id)``.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = subcategory_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    # Проверяем, что родительская категория существует
    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 400

    # Уникальность (name, category_id)
    existing = Subcategory.query.filter_by(
        name=data['name'], category_id=data['category_id']
    ).first()
    if existing:
        return jsonify({
            'error': 'Подкатегория с таким названием уже существует в этой категории'
        }), 409

    subcategory = Subcategory(
        name=data['name'],
        category_id=data['category_id'],
        description=data.get('description'),
    )
    db.session.add(subcategory)
    db.session.commit()
    return jsonify(subcategory.to_dict()), 201


@subcategories_bp.route('/<int:subcategory_id>', methods=['PUT'])
def update_subcategory(subcategory_id: int):
    """PUT /api/subcategories/<id> — обновление подкатегории.

    Можно менять ``name``, ``category_id``, ``description``.
    Уникальность ``(name, category_id)`` проверяется с учётом
    текущей подкатегории (исключая её саму).
    """
    subcategory, err = get_object_or_404(
        Subcategory, subcategory_id, 'Подкатегория не найдена'
    )
    if err:
        return err

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    if 'name' in data:
        # Уникальность (name, category_id) — category_id берём из data если есть,
        # иначе из текущей подкатегории
        new_category_id = data.get('category_id', subcategory.category_id)
        existing = Subcategory.query.filter(
            Subcategory.name == data['name'],
            Subcategory.category_id == new_category_id,
            Subcategory.id != subcategory_id,
        ).first()
        if existing:
            return jsonify({
                'error': 'Подкатегория с таким названием уже существует в этой категории'
            }), 409
        subcategory.name = data['name']

    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Категория не найдена'}), 400
        subcategory.category_id = data['category_id']

    if 'description' in data:
        subcategory.description = data['description']

    db.session.commit()
    return jsonify(subcategory.to_dict())


@subcategories_bp.route('/<int:subcategory_id>', methods=['DELETE'])
def delete_subcategory(subcategory_id: int):
    """DELETE /api/subcategories/<id> — удаление.

    Нельзя удалить, если есть связанные поставщики.
    """
    subcategory, err = get_object_or_404(
        Subcategory, subcategory_id, 'Подкатегория не найдена'
    )
    if err:
        return err

    if subcategory.suppliers.count() > 0:
        return jsonify({
            'error': 'Невозможно удалить подкатегорию, есть связанные поставщики'
        }), 409

    db.session.delete(subcategory)
    db.session.commit()
    return jsonify({'message': 'Подкатегория удалена'}), 200
