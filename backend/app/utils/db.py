"""Хелперы работы с БД: get_or_404, verify_ids_exist и т.п.

Избавляют от дублирования шаблонного кода «получить по id или вернуть 404»
и «проверить, что все переданные id существуют в БД».
"""
from __future__ import annotations

from typing import Type, Sequence

from flask import jsonify
from sqlalchemy.orm import DeclarativeBase


def get_object_or_404(model: Type[DeclarativeBase], obj_id: int, message: str = 'Не найдено'):
    """Вернуть объект по id либо jsonify({'error': ...}) с кодом 404.

    Возвращает либо модель, либо кортеж ``(response, status_code)``,
    готовый к выдаче из обработчика маршрута.

    Использование::

        obj, err = get_object_or_404(Supplier, 999)
        if err:
            return err
        # работать с obj
    """
    obj = model.query.get(obj_id)
    if obj is None:
        return None, (jsonify({'error': message}), 404)
    return obj, None


def get_or_404(model: Type[DeclarativeBase], obj_id: int, message: str = 'Не найдено'):
    """То же, но выбрасывает исключение (для использования в обработчиках).

    Возвращает объект, либо поднимает :class:`HTTPException` через
    Flask ``abort``. Удобно в простых маршрутах.
    """
    obj = model.query.get(obj_id)
    if obj is None:
        from werkzeug.exceptions import abort
        abort(404, description=message)
    return obj


def verify_ids_exist(
    model: Type[DeclarativeBase],
    ids: Sequence[int],
    error_message: str = 'Одна или несколько записей не найдены',
):
    """Проверить, что все id существуют в БД.

    Returns:
        ``(objects, error_response)``. ``error_response`` — это
        ``(jsonify, status_code)`` или ``None``, если всё ок.
    """
    if not ids:
        return [], None
    objects = model.query.filter(model.id.in_(list(ids))).all()
    if len(objects) != len(ids):
        return objects, (jsonify({'error': error_message}), 400)
    return objects, None
