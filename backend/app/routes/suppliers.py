from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Supplier, Category
from app.schemas import supplier_schema, suppliers_schema, supplier_create_schema, supplier_update_schema

suppliers_bp = Blueprint('suppliers', __name__)


@suppliers_bp.route('', methods=['GET'])
def get_suppliers():
    """GET /api/suppliers — список активных поставщиков с пагинацией."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # максимум 100 на страницу

    query = Supplier.query.filter_by(is_active=True).order_by(Supplier.name)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'items': [s.to_dict() for s in paginated.items],
        'total': paginated.total,
        'page': paginated.page,
        'per_page': paginated.per_page,
        'pages': paginated.pages,
    })


@suppliers_bp.route('', methods=['POST'])
def create_supplier():
    """POST /api/suppliers — создание поставщика с привязкой категорий."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = supplier_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    category_ids = data.pop('category_ids', [])

    # Проверяем что все категории существуют
    categories = Category.query.filter(Category.id.in_(category_ids)).all()
    if len(categories) != len(category_ids):
        return jsonify({'error': 'Одна или несколько категорий не найдены'}), 400

    supplier = Supplier(**data)
    for cat in categories:
        supplier.categories.append(cat)

    db.session.add(supplier)
    db.session.commit()

    return jsonify(supplier.to_dict()), 201


@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
def get_supplier(supplier_id):
    """GET /api/suppliers/<id> — детальная информация о поставщике."""
    supplier = Supplier.query.get(supplier_id)
    if not supplier or not supplier.is_active:
        return jsonify({'error': 'Поставщик не найден'}), 404
    return jsonify(supplier.to_dict())


@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
def update_supplier(supplier_id):
    """PUT /api/suppliers/<id> — обновление поставщика."""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = supplier_update_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    category_ids = data.pop('category_ids', None)

    # Обновляем поля
    for field in [
        'name', 'description', 'contact_person', 'phone', 'email',
        'website', 'source_url', 'city', 'region', 'address',
        'min_order_amount', 'price_range', 'has_certificates',
        'certificate_details', 'delivery_conditions', 'notes',
    ]:
        if field in data:
            setattr(supplier, field, data[field])

    # Обновляем категории если переданы
    if category_ids is not None:
        categories = Category.query.filter(Category.id.in_(category_ids)).all()
        if len(categories) != len(category_ids):
            return jsonify({'error': 'Одна или несколько категорий не найдены'}), 400
        # Очищаем и добавляем заново
        supplier.categories = []
        for cat in categories:
            supplier.categories.append(cat)

    db.session.commit()
    return jsonify(supplier.to_dict())


@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    """DELETE /api/suppliers/<id> — мягкое удаление (is_active = false)."""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    supplier.is_active = False
    db.session.commit()
    return jsonify({'message': 'Поставщик удалён'}), 200