import os
import sqlite3
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import event
from app.database import db
from flask_migrate import Migrate

migrate = Migrate()


def _register_unicode_lower(dbapi_conn, _):
    """Переопределяет SQLite-функцию LOWER на Python str.lower().

    Стандартный SQLite LOWER() работает только с ASCII. Кастомная версия
    корректно приводит к нижнему регистру Unicode-символы (включая
    кириллицу), что делает ilike-запросы регистронезависимыми для всех
    символов, а не только для латиницы.
    """
    if isinstance(dbapi_conn, sqlite3.Connection):
        dbapi_conn.create_function(
            'lower', 1,
            lambda s: s.lower() if isinstance(s, str) else s,
        )


def create_app():
    app = Flask(__name__)

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Локальная разработка без Docker — используем SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_url = 'sqlite:///' + os.path.join(basedir, '..', 'dev.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    JWTManager(app)

    # SQLite: переопределяем LOWER() для поддержки Unicode (кириллицы).
    # На PostgreSQL/MySQL listener не регистрируется — там ilike/LOWER
    # изначально работают с Unicode.
    with app.app_context():
        if db.engine.dialect.name == 'sqlite':
            event.listen(db.engine, 'connect', _register_unicode_lower)

    from app.routes.categories import categories_bp
    from app.routes.subcategories import subcategories_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.search import search_bp
    from app.routes.auth import auth_bp
    from app.routes.notes import notes_bp
    from app.routes.cities import cities_bp
    from app.routes.locations import locations_bp

    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(subcategories_bp, url_prefix='/api/subcategories')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(search_bp, url_prefix='/api/suppliers')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(notes_bp, url_prefix='/api/suppliers')
    app.register_blueprint(cities_bp, url_prefix='/api/suppliers')
    app.register_blueprint(locations_bp, url_prefix='/api/suppliers')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    # Создаём таблицы если их нет (для SQLite)
    with app.app_context():
        db.create_all()

    return app