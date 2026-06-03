from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app.database import db
from app.models import User

auth_bp = Blueprint('auth', __name__)


class RegisterSchema(Schema):
    username = fields.String(required=True, validate=lambda x: len(x.strip()) >= 2)
    password = fields.String(required=True, validate=lambda x: len(x) >= 4)


class LoginSchema(Schema):
    username = fields.String(required=True)
    password = fields.String(required=True)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя."""
    data = request.get_json()
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
    """Вход пользователя."""
    data = request.get_json()
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
    """Данные текущего пользователя."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    return jsonify(user.to_dict()), 200