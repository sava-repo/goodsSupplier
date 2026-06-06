from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from app.models import Supplier, Category, Subcategory, SupplierNote
from app.schemas import supplier_schema, suppliers_schema, supplier_create_schema, supplier_update_schema

suppliers_bp = Blueprint('suppliers', __name__)

SORTABLE_FIELDS = {
    'name': lambda: Supplier.name,
    'city': lambda: Supplier.city,
    'min_order_amount': lambda: Supplier.min_order_amount,
    'certificates': lambda: Supplier.certificate_urls.isnot(None),
}


@suppliers_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_suppliers():
    """GET /api/suppliers — список активных поставщиков с пагинацией."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort_by', 'name').strip()
    sort_order = request.args.get('sort_order', 'asc').strip().lower()
    per_page = min(per_page, 100)  # максимум 100 на страницу

    if sort_by not in SORTABLE_FIELDS:
        return jsonify({'error': f'Недопустимое поле сортировки: {sort_by}'}), 400
    if sort_order not in ('asc', 'desc'):
        return jsonify({'error': 'sort_order должен быть asc или desc'}), 400

    order_expr = SORTABLE_FIELDS[sort_by]()
    if sort_order == 'desc':
        order_expr = order_expr.desc()
    query = (
        Supplier.query
        .filter_by(is_active=True)
        .order_by(order_expr, Supplier.id)
    )
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    # Если пользователь авторизован — добавляем user_note
    jwt_data = get_jwt()
    user_id = int(get_jwt_identity()) if jwt_data else None

    items = []
    for s in paginated.items:
        supplier_dict = s.to_dict()
        if user_id:
            note_obj = SupplierNote.query.filter_by(
                user_id=user_id, supplier_id=s.id
            ).first()
            supplier_dict['user_note'] = note_obj.note if note_obj else None
        items.append(supplier_dict)

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
    """POST /api/suppliers — создание поставщика с привязкой категорий."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Отсутствует тело запроса'}), 400

    errors = supplier_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    category_ids = data.pop('category_ids', [])
    subcategory_ids = data.pop('subcategory_ids', [])

    # Проверяем что все категории существуют
    categories = Category.query.filter(Category.id.in_(category_ids)).all()
    if len(categories) != len(category_ids):
        return jsonify({'error': 'Одна или несколько категорий не найдены'}), 400

    # Проверяем что все подкатегории существуют
    subcategories = Subcategory.query.filter(Subcategory.id.in_(subcategory_ids)).all()
    if len(subcategories) != len(subcategory_ids):
        return jsonify({'error': 'Одна или несколько подкатегорий не найдены'}), 400

    supplier = Supplier(**data)
    for cat in categories:
        supplier.categories.append(cat)
    for sc in subcategories:
        supplier.subcategories.append(sc)

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
@jwt_required()
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
    subcategory_ids = data.pop('subcategory_ids', None)

    # Обновляем поля
    for field in [
        'name', 'description', 'contact_person', 'phone', 'email',
        'website', 'source_url', 'city', 'region', 'address', 'inn',
        'min_order_amount', 'price_range',
        'certificate_details', 'certificate_urls', 'delivery_conditions', 'notes',
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

    # Обновляем подкатегории если переданы
    if subcategory_ids is not None:
        subcategories = Subcategory.query.filter(
            Subcategory.id.in_(subcategory_ids)
        ).all()
        if len(subcategories) != len(subcategory_ids):
            return jsonify({'error': 'Одна или несколько подкатегорий не найдены'}), 400
        supplier.subcategories = []
        for sc in subcategories:
            supplier.subcategories.append(sc)

    db.session.commit()
    return jsonify(supplier.to_dict())


@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    """DELETE /api/suppliers/<id> — мягкое удаление (is_active = false)."""
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    supplier.is_active = False
    db.session.commit()
    return jsonify({'message': 'Поставщик удалён'}), 200