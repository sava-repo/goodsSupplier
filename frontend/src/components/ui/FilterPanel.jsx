import { SearchInput, Select } from './Input'
import CityAutocomplete from './CityAutocomplete'
import Button from './Button'
import styles from './FilterPanel.module.css'

export default function FilterPanel({
  searchValue = '',
  onSearchChange,
  categoryId = '',
  onCategoryChange,
  categories = [],
  city = '',
  onCityChange,
  onCityApply,
  onReset,
}) {
  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <SearchInput
          placeholder="Поиск по названию..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <Select
          label="Категория"
          options={categoryOptions}
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Все категории"
        />
      </div>
      <div className={styles.field}>
        <CityAutocomplete
          label="Город"
          placeholder="Город..."
          value={city}
          onChange={onCityChange}
          onApply={onCityApply}
        />
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onReset}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}