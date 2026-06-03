import os
from flask import Flask
from flask_cors import CORS
from app.database import db
from flask_migrate import Migrate

migrate = Migrate()


def create_app():
    app = Flask(__name__)

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Локальная разработка без Docker — используем SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_url = 'sqlite:///' + os.path.join(basedir, '..', 'dev.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    from app.routes.categories import categories_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.search import search_bp

    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(search_bp, url_prefix='/api/suppliers')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    # Создаём таблицы если их нет (для SQLite)
    with app.app_context():
        db.create_all()

    return app