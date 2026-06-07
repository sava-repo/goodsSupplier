"""Пагинация и прикрепление пользовательских заметок.

Основная задача — избежать N+1 запроса при получении списка поставщиков:
вместо подзапроса ``SupplierNote`` для каждой строки, мы делаем один
общий запрос по всем supplier_id текущей страницы.
"""
from __future__ import annotations

from typing import Any

from app.database import db
from app.models import Supplier, SupplierNote


def attach_user_notes(items: list[Supplier], user_id: int | None) -> list[dict[str, Any]]:
    """Превратить список Supplier в список dict с прикреплённым user_note.

    Оптимизация: один ``SELECT`` для заметок по всем supplier_id страницы,
    а не по одной на каждую строку.

    Args:
        items: список объектов :class:`Supplier` (одна страница).
        user_id: id текущего пользователя либо ``None``.

    Returns:
        Список словарей (результат :meth:`Supplier.to_dict`),
        с дополнительным ключом ``user_note`` для авторизованных.
    """
    if not items:
        return []

    result: list[dict[str, Any]] = []
    notes_by_supplier: dict[int, str | None] = {}

    if user_id:
        supplier_ids = [s.id for s in items]
        notes = (
            SupplierNote.query
            .filter(
                SupplierNote.user_id == user_id,
                SupplierNote.supplier_id.in_(supplier_ids),
            )
            .all()
        )
        notes_by_supplier = {n.supplier_id: n.note for n in notes}

    for s in items:
        d = s.to_dict()
        if user_id:
            d['user_note'] = notes_by_supplier.get(s.id)
        result.append(d)

    return result
