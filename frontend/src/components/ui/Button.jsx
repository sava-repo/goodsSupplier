/**
 * Кнопка с вариантами оформления и размерами.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
 *   size?: 'small' | 'medium' | 'large',
 *   disabled?: boolean,
 *   icon?: React.ComponentType,
 *   className?: string,
 * }} props
 */
import styles from './Button.module.css'

const VARIANT_MAP = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
  ghost: styles.ghost,
  danger: styles.danger,
}

const SIZE_MAP = {
  small: styles.small,
  medium: '',
  large: styles.large,
}

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const classes = [
    styles.button,
    VARIANT_MAP[variant] || styles.primary,
    SIZE_MAP[size],
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled} {...props}>
      {Icon && <Icon />}
      {children}
    </button>
  )
}
