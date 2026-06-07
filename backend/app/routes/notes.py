"""Заметки пользователей по поставщикам.

Каждый авторизованный пользователь может оставить одну личную заметку
на поставщика (создать, прочитать, обновить, удалить).
Все эндпоинты требуют JWT.

* ``GET    /api/suppliers/<id>/note``  — получить заметку.
* ``PUT    /api/suppliers/<id>/note``  — создать или обновить заметку.
* ``DELETE /api/suppliers/<id>/note``  — удалить заметку.
"""
from __future__ import annotations

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError

from app.database import db
from app.models import SupplierNote, Supplier
from app.utils.db import get_object_or_404

notes_bp = Blueprint('notes', __name__)


class NoteSchema(Schema):
    """Схема валидации тела заметки (поле ``note`` — опциональное)."""

    note = fields.String(load_default=None)


@notes_bp.route('/<int:supplier_id>/note', methods=['GET'])
@jwt_required()
def get_note(supplier_id: int):
    """GET /api/suppliers/<id>/note — получить заметку текущего пользователя.

    Returns:
        200 — ``{"supplier_id": N, "note": "текст"}`` или
        ``{"supplier_id": N, "note": null}`` если заметки нет.
        404 — поставщик не найден.
    """
    user_id = int(get_jwt_identity())

    supplier, err = get_object_or_404(Supplier, supplier_id, 'Поставщик не найден')
    if err:
        return err

    note_obj = SupplierNote.query.filter_by(
        user_id=user_id, supplier_id=supplier_id
    ).first()

    if not note_obj:
        return jsonify({'supplier_id': supplier_id, 'note': None}), 200

    return jsonify(note_obj.to_dict()), 200


@notes_bp.route('/<int:supplier_id>/note', methods=['PUT'])
@jwt_required()
def upsert_note(supplier_id: int):
    """PUT /api/suppliers/<id>/note — создать или обновить заметку.

    Тело: ``{"note": "текст"}`` (поле ``note`` может быть ``null``).

    Returns:
        200 — обновлённая заметка.
        400 — данные отсутствуют или невалидны.
        404 — поставщик не найден.
    """
    user_id = int(get_jwt_identity())

    supplier, err = get_object_or_404(Supplier, supplier_id, 'Поставщик не найден')
    if err:
        return err

    data = request.get_json(silent=True)
    if data is None:
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
def delete_note(supplier_id: int):
    """DELETE /api/suppliers/<id>/note — удалить заметку.

    Returns:
        200 — ``{"message": "Заметка удалена"}``.
        404 — заметка не найдена.
    """
    user_id = int(get_jwt_identity())

    note_obj = SupplierNote.query.filter_by(
        user_id=user_id, supplier_id=supplier_id
    ).first()

    if not note_obj:
        return jsonify({'error': 'Заметка не найдена'}), 404

    db.session.delete(note_obj)
    db.session.commit()
    return jsonify({'message': 'Заметка удалена'}), 200
