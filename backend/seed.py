"""Скрипт для заполнения БД начальными категориями."""
import os
from app import create_app
from app.database import db
from app.models import Category

app = create_app()

CATEGORIES = [
    {'name': 'Ингредиенты', 'description': 'Основные ингредиенты для приготовления блюд'},
    {'name': 'Готовая продукция', 'description': 'Готовые продукты питания'},
    {'name': 'Упаковка', 'description': 'Упаковочные материалы и контейнеры'},
    {'name': 'Оборудование', 'description': 'Профессиональное кухонное оборудование'},
    {'name': 'Напитки', 'description': 'Безалкогольные и алкогольные напитки'},
    {'name': 'Специи и приправы', 'description': 'Специи, приправы и соусы'},
]


def seed():
    with app.app_context():
        for cat_data in CATEGORIES:
            existing = Category.query.filter_by(name=cat_data['name']).first()
            if not existing:
                category = Category(**cat_data)
                db.session.add(category)
                print(f'  Добавлена категория: {cat_data["name"]}')
            else:
                print(f'  Категория уже существует: {cat_data["name"]}')

        db.session.commit()
        print('Начальные данные загружены.')


if __name__ == '__main__':
    seed()