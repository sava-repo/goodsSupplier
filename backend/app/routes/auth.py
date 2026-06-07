"""Эндпоинты аутентификации: регистрация, вход, получение профиля.

Все эндпоинты работают с моделью :class:`~app.models.User`.
Пароли хранятся в виде werkzeug-хеша (pbkdf2-sha256).
"""
from __future__ import annotations

from flask import Blueprint, current_app, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError

from app.database import db
from app.models import User

auth_bp = Blueprint('auth', __name__)


def _validate_username(value: str) -> bool:
    """Marshmallow-валидатор: username ≥ 2 символов."""
    return len(value.strip()) >= 2


def _validate_password(value: str) -> bool:
    """Marshmallow-валидатор: пароль ≥ MIN_PASSWORD_LENGTH и содержит ≥ 1 цифру."""
    min_len = current_app.config.get('MIN_PASSWORD_LENGTH', 8)
    if len(value) < min_len:
        return False
    return any(ch.isdigit() for ch in value)


class RegisterSchema(Schema):
    """Схема валидации регистрации."""

    username = fields.String(required=True, validate=_validate_username)
    password = fields.String(required=True, validate=_validate_password)


class LoginSchema(Schema):
    """Схема валидации входа (только required-поля)."""

    username = fields.String(required=True)
    password = fields.String(required=True)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя.

    Returns:
        201 — ``{user, access_token}`` при успехе.
        400 — ошибки валидации или имя занято.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствуют данные'}), 400

    schema = RegisterSchema()
    try:
        data = schema.load(data)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400

    user = User(username=data['username'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Вход пользователя по логину/паролю.

    Returns:
        200 — ``{user, access_token}``.
        401 — неверные учётные данные.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Отсутствуют данные'}), 400

    schema = LoginSchema()
    try:
        data = schema.load(data)
    except ValidationError as e:
        return jsonify({'error': e.messages}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Неверное имя пользователя или пароль'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Данные текущего авторизованного пользователя.

    Returns:
        200 — :meth:`User.to_dict`.
        404 — пользователь удалён (но токен ещё действует).
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    return jsonify(user.to_dict()), 200
