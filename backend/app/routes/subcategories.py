from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Subcategory, Category
from app.schemas import (
    subcategory_schema,
    subcategories_schema,
)

subcategories_bp = Blueprint('subcategories', __name__)


@subcategories_bp.route('', methods=['GET'])
def get_subcategories():
    """GET /api/subcategories — список всех подкатегорий.

    Query-параметры:
      - category_id: фильтр по категории (опционально)
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
    return jsonify(subcategories_schema.dump(subcategories))


@subcategories_bp.route('/<int:subcategory_id>', methods=['GET'])
def get_subcategory(subcategory_id):
    """GET /api/subcategories/<id> — детали подкатегории."""
    subcategory = Subcategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({'error': 'Подкатегория не найдена'}), 404
    return jsonify(subcategory.to_dict())


@subcategories_bp.route('', methods=['POST'])
def create_subcategory():
    """POST /api/subcategories — создание подкатегории."""
    data = request.get_json()
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
def update_subcategory(subcategory_id):
    """PUT /api/subcategories/<id> — обновление подкатегории."""
    subcategory = Subcategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({'error': 'Подкатегория не найдена'}), 404

    data = request.get_json()
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
def delete_subcategory(subcategory_id):
    """DELETE /api/subcategories/<id> — удаление с проверкой связанных поставщиков."""
    subcategory = Subcategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({'error': 'Подкатегория не найдена'}), 404

    if subcategory.suppliers.count() > 0:
        return jsonify({
            'error': 'Невозможно удалить подкатегорию, есть связанные поставщики'
        }), 409

    db.session.delete(subcategory)
    db.session.commit()
    return jsonify({'message': 'Подкатегория удалена'}), 200
