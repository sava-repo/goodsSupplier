from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app.database import db
from app.models import SupplierNote, Supplier

notes_bp = Blueprint('notes', __name__)


class NoteSchema(Schema):
    note = fields.String(load_default=None)


@notes_bp.route('/<int:supplier_id>/note', methods=['GET'])
@jwt_required()
def get_note(supplier_id):
    """Получить заметку текущего пользователя по поставщику."""
    user_id = int(get_jwt_identity())

    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    note_obj = SupplierNote.query.filter_by(
        user_id=user_id, supplier_id=supplier_id
    ).first()

    if not note_obj:
        return jsonify({'supplier_id': supplier_id, 'note': None}), 200

    return jsonify(note_obj.to_dict()), 200


@notes_bp.route('/<int:supplier_id>/note', methods=['PUT'])
@jwt_required()
def upsert_note(supplier_id):
    """Создать или обновить заметку."""
    user_id = int(get_jwt_identity())

    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Отсутствуют данные'}), 400

    schema = NoteSchema()
    try:
        data = schema.load(data)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

    note_obj = SupplierNote.query.filter_by(
        user_id=user_id, supplier_id=supplier_id
    ).first()

    if note_obj:
        note_obj.note = data.get('note')
    else:
        note_obj = SupplierNote(
            user_id=user_id,
            supplier_id=supplier_id,
            note=data.get('note'),
        )
        db.session.add(note_obj)

    db.session.commit()
    return jsonify(note_obj.to_dict()), 200


@notes_bp.route('/<int:supplier_id>/note', methods=['DELETE'])
@jwt_required()
def delete_note(supplier_id):
    """Удалить заметку."""
    user_id = int(get_jwt_identity())

    note_obj = SupplierNote.query.filter_by(
        user_id=user_id, supplier_id=supplier_id
    ).first()

    if not note_obj:
        return jsonify({'error': 'Заметка не найдена'}), 404

    db.session.delete(note_obj)
    db.session.commit()
    return jsonify({'message': 'Заметка удалена'}), 200