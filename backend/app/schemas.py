"""Marshmallow-схемы для валидации и сериализации.

Схемы используются:
    - ``*_schema`` (ед. ч.) — для одного объекта (dump / validate).
    - ``*_schema(many=True)`` — для списка.

Маршруты импортируют уже созданные экземпляры из этого модуля.
"""
from marshmallow import Schema, fields, validate


class CategorySchema(Schema):
    """Схема валидации и сериализации :class:`Category`."""

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(load_default=None)
    supplier_count = fields.Integer(dump_only=True)


class SubcategorySchema(Schema):
    """Схема валидации и сериализации :class:`Subcategory`."""

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    category_id = fields.Integer(required=True)
    description = fields.String(load_default=None)
    supplier_count = fields.Integer(dump_only=True)


class SupplierSchema(Schema):
    """Схема поставщика: все поля плюс ids для M2M-связей.

    ``category_ids`` и ``subcategory_ids`` — write-only (load),
    используются при создании/обновлении для привязки категорий.
    На вывод отдаются ``categories`` и ``subcategories`` (dump_only).
    """

    id = fields.Integer(dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(load_default=None)
    contact_person = fields.String(load_default=None)
    phone = fields.String(load_default=None)
    email = fields.Email(load_default=None)
    website = fields.String(load_default=None)
    source_url = fields.String(load_default=None)
    city = fields.String(required=True, validate=validate.Length(min=1, max=100))
    region = fields.String(load_default=None)
    address = fields.String(load_default=None)
    inn = fields.String(load_default=None, validate=validate.Length(max=12))
    min_order_amount = fields.Float(load_default=None, allow_none=True)
    price_range = fields.String(load_default=None)
    certificate_details = fields.String(load_default=None)
    certificate_urls = fields.List(fields.String(), load_default=list)
    delivery_conditions = fields.String(load_default=None)
    notes = fields.String(load_default=None)
    is_active = fields.Boolean(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    categories = fields.List(fields.Dict(), dump_only=True)
    subcategories = fields.List(fields.Dict(), dump_only=True)
    category_ids = fields.List(fields.Integer(), load_default=[])
    subcategory_ids = fields.List(fields.Integer(), load_default=[])


class SupplierUpdateSchema(Schema):
    """Схема частичного обновления — все поля опциональны."""

    name = fields.String(validate=validate.Length(min=1, max=200))
    description = fields.String()
    contact_person = fields.String()
    phone = fields.String()
    email = fields.Email()
    website = fields.String()
    source_url = fields.String()
    city = fields.String(validate=validate.Length(min=1, max=100))
    region = fields.String()
    address = fields.String()
    inn = fields.String(validate=validate.Length(max=12))
    min_order_amount = fields.Float(allow_none=True)
    price_range = fields.String()
    certificate_details = fields.String()
    certificate_urls = fields.List(fields.String())
    delivery_conditions = fields.String()
    notes = fields.String()
    category_ids = fields.List(fields.Integer())
    subcategory_ids = fields.List(fields.Integer())


# Готовые экземпляры схем — используются маршрутами напрямую
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)
subcategory_schema = SubcategorySchema()
subcategories_schema = SubcategorySchema(many=True)
supplier_schema = SupplierSchema()
suppliers_schema = SupplierSchema(many=True)
supplier_create_schema = SupplierSchema()
supplier_update_schema = SupplierUpdateSchema()
