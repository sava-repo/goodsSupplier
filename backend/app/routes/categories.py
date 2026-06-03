from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Category
from app.schemas import category_schema, categories_schema

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('', methods=['GET'])
def get_categories():
    """GET /api/categories — список всех категорий с количеством поставщиков."""
    categories = Category.query.order_by(Category.name).all()
    return jsonify(categories_schema.dump(categories))


@categories_bp.route('', methods=['POST'])
def create_category():
    """POST /api/categories — создание категории с валидацией."""
    data = request.get_json()
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
def update_category(category_id):
    """PUT /api/categories/<id> — обновление категории."""
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404

    data = request.get_json()
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
def delete_category(category_id):
    """DELETE /api/categories/<id> — удаление с проверкой связанных поставщиков."""
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404

    if category.suppliers.count() > 0:
        return jsonify({
            'error': 'Невозможно удалить категорию, есть связанные поставщики'
        }), 409

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Категория удалена'}), 200