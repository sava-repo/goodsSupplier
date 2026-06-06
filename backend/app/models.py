from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db


# Связующая таблица many-to-many
supplier_categories = db.Table(
    'supplier_categories',
    db.Column('supplier_id', db.Integer, db.ForeignKey('suppliers.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True),
)


# Связующая таблица many-to-many поставщик-подкатегория
supplier_subcategories = db.Table(
    'supplier_subcategories',
    db.Column('supplier_id', db.Integer, db.ForeignKey('suppliers.id'), primary_key=True),
    db.Column('subcategory_id', db.Integer, db.ForeignKey('subcategories.id'), primary_key=True),
)


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)

    suppliers = db.relationship(
        'Supplier',
        secondary=supplier_categories,
        backref=db.backref('categories', lazy='select'),
        lazy='dynamic',
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'supplier_count': self.suppliers.count(),
        }


class Subcategory(db.Model):
    __tablename__ = 'subcategories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    description = db.Column(db.Text, nullable=True)

    category = db.relationship('Category', backref=db.backref(
        'subcategories', lazy='select'
    ))
    suppliers = db.relationship(
        'Supplier',
        secondary=supplier_subcategories,
        backref=db.backref('subcategories', lazy='select'),
        lazy='dynamic',
    )

    __table_args__ = (
        db.UniqueConstraint(
            'name', 'category_id', name='uq_subcategory_name_per_category'
        ),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category_id': self.category_id,
            'description': self.description,
            'supplier_count': self.suppliers.count(),
        }


class Supplier(db.Model):
    __tablename__ = 'suppliers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    contact_person = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    website = db.Column(db.String(500), nullable=True)
    source_url = db.Column(db.String(500), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=True)
    address = db.Column(db.String(300), nullable=True)
    inn = db.Column(db.String(12), nullable=True)
    min_order_amount = db.Column(db.Numeric(12, 2), nullable=True)
    price_range = db.Column(db.String(50), nullable=True)
    certificate_details = db.Column(db.Text, nullable=True)
    certificate_urls = db.Column(db.JSON, nullable=True)
    delivery_conditions = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def to_dict(self, include_categories=True):
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'website': self.website,
            'source_url': self.source_url,
            'city': self.city,
            'region': self.region,
            'address': self.address,
            'inn': self.inn,
            'min_order_amount': self.min_order_amount,
            'price_range': self.price_range,
            'certificate_details': self.certificate_details,
            'certificate_urls': self.certificate_urls or [],
            'delivery_conditions': self.delivery_conditions,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_categories:
            data['categories'] = [
                {'id': c.id, 'name': c.name} for c in self.categories
            ]
            data['subcategories'] = [
                {'id': sc.id, 'name': sc.name, 'category_id': sc.category_id}
                for sc in self.subcategories
            ]
        return data


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SupplierNote(db.Model):
    __tablename__ = 'supplier_notes'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'supplier_id', name='uq_user_supplier'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    note = db.Column(db.Text, nullable=True)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = db.relationship('User', backref=db.backref('supplier_notes', lazy='select'))
    supplier = db.relationship('Supplier', backref=db.backref('user_notes', lazy='select'))

    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'note': self.note,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
