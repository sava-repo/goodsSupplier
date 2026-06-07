"""Сортировка списков: парсинг и валидация параметров ``sort_by``/``sort_order``.

Каждый endpoint определяет свой «whitelist» допустимых полей и передаёт
его в :func:`parse_sort_params`. Whitelist сопоставляет имя параметра
(полученное от клиента) с SQLAlchemy-выражением.

Это гарантирует, что сортировка выполняется только по разрешённым колонкам
(защита от инъекций через имена полей).
"""
from __future__ import annotations

from typing import Callable, Optional

from flask import request


# Допустимые направления сортировки
ASC = 'asc'
DESC = 'desc'
_ALLOWED_ORDERS = (ASC, DESC)


def parse_sort_params(
    allowed_fields: dict,
    default_field: str = 'name',
    default_order: str = ASC,
) -> tuple[Optional[object], str, Optional[tuple[int, str]]]:
    """Разобрать и провалидировать параметры сортировки.

    Читает ``sort_by`` и ``sort_order`` из ``request.args``.

    Args:
        allowed_fields: словарь «имя_поля → SQLAlchemy-колонка или фабрика».
            Значением может быть как сам атрибут модели (``Supplier.name``),
            так и фабрика-лямбда, возвращающая колонку.
        default_field: поле по умолчанию (если параметр не передан).
        default_order: направление по умолчанию.

    Returns:
        Кортеж ``(order_expr, sort_order, error)``.

        - ``order_expr`` — SQLAlchemy-выражение (с применённым .desc() при
          необходимости) либо ``None``, если валидация провалена.
        - ``sort_order`` — фактическое направление ('asc' или 'desc').
        - ``error`` — ``(status_code, message)`` при ошибке валидации,
          иначе ``None``.

    Пример::

        order_expr, order, err = parse_sort_params(SORTABLE_FIELDS)
        if err:
            return jsonify({'error': err[1]}), err[0]
        query = query.order_by(order_expr, Supplier.id)
    """
    sort_by = request.args.get('sort_by', default_field).strip()
    sort_order = request.args.get('sort_order', default_order).strip().lower()

    if sort_by not in allowed_fields:
        return None, sort_order, (400, f'Недопустимое поле сортировки: {sort_by}')
    if sort_order not in _ALLOWED_ORDERS:
        return None, sort_order, (400, 'sort_order должен быть asc или desc')

    expr = allowed_fields[sort_by]
    if callable(expr):
        expr = expr()
    if sort_order == DESC:
        expr = expr.desc()

    return expr, sort_order, None
