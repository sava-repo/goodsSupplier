"""Импорт поставщиков из productcenter-suppliers.json в БД.

Особенности:
    - Идемпотентный: при повторном запуске пропускает записи, чьё `name`
      уже присутствует в БД.
    - Создаёт категорию "Продукты питания", если её ещё нет.
    - `url` (исходная страница productcenter.ru) и `подкатегории_товаров`
      намеренно НЕ сохраняются.
    - Поле `телефон` может содержать несколько номеров через запятую —
      берём только первый, обрезаем до 50 символов.
    - Поле `инн` сохраняется только если состоит из 10 или 12 цифр.

Использование::

    python backend/import_json.py            # боевой запуск
    python backend/import_json.py --dry-run  # отладочный прогон без записи
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Iterable

# Подключаем backend/ к sys.path, чтобы работало `from app...`
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402
from app.database import db  # noqa: E402
from app.models import Category, Supplier  # noqa: E402

JSON_PATH = BACKEND_DIR.parent / "productcenter-suppliers.json"


def _clean_str(value: Any, max_len: int | None = None) -> str | None:
    """Возвращает None для пустого значения, иначе очищенную строку."""
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if max_len:
        text = text[:max_len]
    return text


def _take_first_phone(raw: Any) -> str | None:
    """Берём первый телефон из строки вида "тел1, тел2, тел3"."""
    if not raw:
        return None
    first = str(raw).split(",", 1)[0].strip()
    if not first:
        return None
    return first[:50]


def _normalize_inn(raw: Any) -> str | None:
    """ИНН — только 10 или 12 цифр."""
    if raw is None:
        return None
    digits = re.sub(r"\D", "", str(raw))
    if len(digits) in (10, 12):
        return digits
    return None


def _category_id_by_name(name: str, cache: dict[str, int]) -> int | None:
    """Возвращает id категории по имени, кэшируя результат."""
    if name in cache:
        return cache[name]
    cat = Category.query.filter_by(name=name).first()
    if cat is None:
        return None
    cache[name] = cat.id
    return cat.id


def _ensure_category(name: str, cache: dict[str, int]) -> int:
    """Создаёт категорию, если её нет. Возвращает id."""
    existing = _category_id_by_name(name, cache)
    if existing is not None:
        return existing
    cat = Category(name=name)
    db.session.add(cat)
    db.session.flush()  # получаем id до коммита
    cache[name] = cat.id
    return cat.id


def _record_to_supplier(
    record: dict[str, Any],
    category_cache: dict[str, int],
) -> tuple[Supplier | None, list[str]]:
    """Превращает JSON-запись в Supplier. Возвращает (supplier, skipped_reasons)."""
    name = _clean_str(record.get("название"), max_len=200)
    city = _clean_str(record.get("город"), max_len=100)
    if not name or not city:
        return None, ["missing name or city"]

    cert_urls_raw = record.get("сертификаты_ссылки") or []
    if isinstance(cert_urls_raw, str):
        try:
            cert_urls = json.loads(cert_urls_raw)
        except json.JSONDecodeError:
            cert_urls = [cert_urls_raw]
    else:
        cert_urls = list(cert_urls_raw)
    cert_urls = [u for u in (str(x).strip() for x in cert_urls) if u]

    # Категории — из "категории_товаров", fallback на "категория_каталога"
    raw_cats = record.get("категории_товаров") or record.get("категория_каталога") or []
    if isinstance(raw_cats, str):
        raw_cats = [raw_cats]

    category_ids: list[int] = []
    skipped_cats: list[str] = []
    for c_name in raw_cats:
        c_name = (c_name or "").strip()
        if not c_name:
            continue
        cid = _category_id_by_name(c_name, category_cache)
        if cid is None:
            skipped_cats.append(c_name)
            continue
        if cid not in category_ids:
            category_ids.append(cid)

    description = _clean_str(record.get("описание"))
    supplier = Supplier(
        name=name,
        description=description,
        city=city,
        region=_clean_str(record.get("регион"), max_len=100),
        address=_clean_str(record.get("адрес"), max_len=300),
        phone=_take_first_phone(record.get("телефон")),
        email=_clean_str(record.get("электронная_почта"), max_len=200),
        website=_clean_str(record.get("сайт"), max_len=500),
        inn=_normalize_inn(record.get("инн")),
        min_order_amount=None,  # в JSON все null
        certificate_urls=cert_urls or None,
        is_active=True,
    )
    if category_ids:
        supplier.categories = Category.query.filter(
            Category.id.in_(category_ids)
        ).all()
    return supplier, skipped_cats


def _stream_records(path: Path) -> Iterable[dict[str, Any]]:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Ожидался JSON-массив записей")
    yield from data


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Только отчёт, без записи в БД",
    )
    parser.add_argument(
        "--json",
        type=Path,
        default=JSON_PATH,
        help="Путь к JSON-файлу (по умолчанию: ../productcenter-suppliers.json)",
    )
    args = parser.parse_args()

    if not args.json.exists():
        print(f"[error] JSON не найден: {args.json}", file=sys.stderr)
        return 2

    # stdout в UTF-8 для Windows-консоли
    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        except Exception:
            pass

    app = create_app()
    with app.app_context():
        existing_names = {
            n for (n,) in db.session.query(Supplier.name).all()
        }
        print(f"[info] Уже в БД поставщиков: {len(existing_names)}")

        # Гарантируем наличие категории "Продукты питания"
        category_cache: dict[str, int] = {}
        pp_id = _ensure_category("Продукты питания", category_cache)
        print(f"[info] Категория «Продукты питания» → id={pp_id}")
        if not args.dry_run:
            db.session.commit()

        imported = 0
        skipped_dup = 0
        skipped_invalid = 0
        skipped_categories: dict[str, int] = {}
        records = list(_stream_records(args.json))
        total = len(records)
        print(f"[info] Записей в JSON: {total}")

        for i, record in enumerate(records, 1):
            name = (record.get("название") or "").strip()
            if not name or name in existing_names:
                skipped_dup += 1
                continue

            supplier, missed_cats = _record_to_supplier(record, category_cache)
            if supplier is None:
                skipped_invalid += 1
                continue

            for c in missed_cats:
                skipped_categories[c] = skipped_categories.get(c, 0) + 1

            db.session.add(supplier)
            existing_names.add(name)
            imported += 1

            if i % 100 == 0:
                print(f"[info] обработано {i}/{total} (импортировано: {imported})")

        print()
        print("[summary] Импорт завершён")
        print(f"  Всего в JSON:          {total}")
        print(f"  Импортировано:         {imported}")
        print(f"  Пропущено дублей:      {skipped_dup}")
        print(f"  Пропущено невалидных:  {skipped_invalid}")
        if skipped_categories:
            print("  Пропущены категории (нет в БД и не созданы автоматически):")
            for cname, cnt in sorted(
                skipped_categories.items(), key=lambda kv: -kv[1]
            ):
                print(f"    - {cname}: {cnt}")

        if args.dry_run:
            db.session.rollback()
            print("[info] dry-run: изменения откатаны")
        else:
            db.session.commit()
            total_in_db = Supplier.query.count()
            print(f"[info] Поставщиков в БД теперь: {total_in_db}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
