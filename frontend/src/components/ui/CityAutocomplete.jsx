/**
 * Автодополнение по городам — обёртка над Autocomplete.
 *
 * @param {string} value — текущий текст.
 * @param {(text: string) => void} onChange — обработчик изменения.
 * @param {(city: string) => void} [onApply] — обработчик выбора города.
 * @param {string} label — заголовок поля.
 * @param {string} placeholder — плейсхолдер.
 * @param {string} error — текст ошибки.
 */
import Autocomplete from './Autocomplete'
import { suppliersApi } from '../../api/suppliers'

export default function CityAutocomplete(props) {
  return (
    <Autocomplete
      {...props}
      fetchFn={(q) => suppliersApi.cities(q)}
    />
  )
}
