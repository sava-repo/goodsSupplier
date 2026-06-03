from datetime import datetime, timezone
from app.database import db


# Связующая таблица many-to-many
supplier_categories = db.Table(
    'supplier_categories',
    db.Column('supplier_id', db.Integer, db.ForeignKey('suppliers.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True),
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
    min_order_amount = db.Column(db.String(100), nullable=True)
    price_range = db.Column(db.String(50), nullable=True)
    has_certificates = db.Column(db.Boolean, default=False)
    certificate_details = db.Column(db.Text, nullable=True)
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
            'min_order_amount': self.min_order_amount,
            'price_range': self.price_range,
            'has_certificates': self.has_certificates,
            'certificate_details': self.certificate_details,
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
        return data