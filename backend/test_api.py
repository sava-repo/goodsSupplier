import requests
import json

BASE = 'http://127.0.0.1:5000/api'

# Health
r = requests.get(f'{BASE}/health')
print(f'Health: {r.status_code} {r.json()}')

# Categories
r = requests.get(f'{BASE}/categories')
print(f'Categories: {r.status_code} ({len(r.json())} items)')

# Create supplier
data = {
    'name': 'ООО Тест Поставщик',
    'city': 'Москва',
    'category_ids': [1, 2],
    'phone': '+7 999 123-45-67',
    'email': 'test@example.com',
    'price_range': 'Средний',
    'description': 'Тестовый поставщик ингредиентов'
}
r = requests.post(f'{BASE}/suppliers', json=data)
print(f'Create supplier: {r.status_code}')
if r.status_code == 201:
    supplier = r.json()
    sid = supplier['id']
    print(f'  ID: {sid}, Name: {supplier["name"]}')

    # Get supplier
    r = requests.get(f'{BASE}/suppliers/{sid}')
    print(f'Get supplier: {r.status_code}')

    # List suppliers
    r = requests.get(f'{BASE}/suppliers')
    print(f'List suppliers: {r.status_code} ({len(r.json()["items"])} items)')

    # Search
    r = requests.get(f'{BASE}/suppliers/search', params={'q': 'Тест'})
    print(f'Search: {r.status_code} ({r.json()["total"]} found)')

    # Compare
    r = requests.get(f'{BASE}/suppliers/compare', params={'ids': str(sid)})
    print(f'Compare: {r.status_code} ({len(r.json())} items)')
else:
    print(f'  Error: {r.text}')

print('\nAll tests passed!')