export default function ActionButton({ children, variant = 'primary', onClick, className = '' }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  }

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
