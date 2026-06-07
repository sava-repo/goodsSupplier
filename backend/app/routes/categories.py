"""CRUD-эндпоинты для категорий.

* ``GET    /api/categories``          — список всех категорий.
* ``POST   /api/categories``          — создание категории.
* ``PUT    /api/categories/<id>``     — обновление категории.
* ``DELETE /api/categories/<id>``     — удаление (если нет поставщиков).
"""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from app.database import db
from app.models import Category, supplier_categories, Supplier
from app.schemas import category_schema
from app.utils.db import get_object_or_404

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('', methods=['GET'])
def get_categories():
    """GET /api/categories — список всех категорий с supplier_count.

    Оптимизация N+1: считаем количество поставщиков одним GROUP BY
    запросом, затем передаём готовые значения в :meth:`Category.to_dict`.
    Без этого каждый ``self.suppliers.count()`` в to_dict() делал бы
    отдельный SQL-запрос.
    """
    categories = Category.query.order_by(Category.name).all()

    if not categories:
        return jsonify([])

    # Один запрос: количество активных поставщиков на категорию
    counts_rows = (
        db.session.query(
            supplier_categories.c.category_id,
            func.count(supplier_categories.c.supplier_id),
        )
        .join(Supplier, Supplier.id == supplier_categories.c.supplier_id)
        .filter(Supplier.is_active.is_(True))
        .group_by(supplier_categories.c.category_id)
        .all()
    )
    counts_map = dict(counts_rows)

    result = [
        c.to_dict(supplier_count=counts_map.get(c.id, 0))
        for c in categories
    ]
    return jsonify(result)


@categories_bp.route('', methods=['POST'])
def create_category():
    """POST /api/categories — создание категории.

    Тело: ``{"name": "...", "description": "..."}``.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = category_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    existing = Category.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': 'Категория с таким названием уже существует'}), 409

    category = Category(
        name=data['name'],
        description=data.get('description'),
    )
    db.session.add(category)
    db.session.commit()

    return jsonify(category.to_dict()), 201


@categories_bp.route('/<int:category_id>', methods=['PUT'])
def update_category(category_id: int):
    """PUT /api/categories/<id> — обновление имени и/или описания."""
    category, err = get_object_or_404(Category, category_id, 'Категория не найдена')
    if err:
        return err

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    if 'name' in data:
        existing = Category.query.filter(
            Category.name == data['name'], Category.id != category_id
        ).first()
        if existing:
            return jsonify({'error': 'Категория с таким названием уже существует'}), 409
        category.name = data['name']

    if 'description' in data:
        category.description = data['description']

    db.session.commit()
    return jsonify(category.to_dict())


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
def delete_category(category_id: int):
    """DELETE /api/categories/<id> — удаление.

    Нельзя удалить категорию, если к ней привязан хотя бы один поставщик.
    """
    category, err = get_object_or_404(Category, category_id, 'Категория не найдена')
    if err:
        return err

    if category.suppliers.count() > 0:
        return jsonify({
            'error': 'Невозможно удалить категорию, есть связанные поставщики'
        }), 409

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Категория удалена'}), 200
