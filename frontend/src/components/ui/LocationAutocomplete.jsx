/**
 * Автодополнение по городам и регионам — обёртка над Autocomplete.
 *
 * Подсказки содержат поля `value` (название) и `type` ('city'|'region').
 * При выборе подсказки в onChange передаётся `item.value`, а в onApply —
 * весь объект `{value, type}`.
 *
 * @param {string} value — текущий текст.
 * @param {(text: string) => void} onChange — обработчик изменения.
 * @param {(item: {value: string, type: string|null}) => void} [onApply] —
 *   обработчик выбора.
 * @param {string} label — заголовок поля.
 * @param {string} placeholder — плейсхолдер.
 * @param {string} error — текст ошибки.
 */
import Autocomplete from './Autocomplete'
import { suppliersApi } from '../../api/suppliers'

export default function LocationAutocomplete(props) {
  return (
    <Autocomplete
      {...props}
      fetchFn={(q) => suppliersApi.locations(q)}
      getItemLabel={(item) => item.value}
      getItemKey={(item) => `${item.type}:${item.value}`}
      getApplyValue={(item) => item.value}
      getApplyPayload={(item) => item}
      fallbackApplyPayload={{ value: props.value, type: null }}
    />
  )
}
