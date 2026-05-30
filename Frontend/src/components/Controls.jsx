import Icon from './Icon'

export function SearchField({ placeholder }) {
  return (
    <div className="relative">
      <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-64"
      />
    </div>
  )
}

export function PrimaryButton({ children, icon, type = 'button', ...props }) {
  return (
    <button type={type} className="flex min-h-11 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60" {...props}>
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function IconButton({ icon, label, tone = 'gray', ...props }) {
  const toneClass = tone === 'danger' ? 'hover:text-red-600' : 'hover:text-primary-600'
  return (
    <button type="button" aria-label={label} className={`rounded p-2 text-gray-400 hover:bg-gray-100 ${toneClass}`} {...props}>
      <Icon name={icon} className="h-4 w-4" />
    </button>
  )
}
