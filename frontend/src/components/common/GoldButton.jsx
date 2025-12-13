/**
 * GoldButton - Premium gold accent button component
 * Based on Panorama Glass Lodge design aesthetic
 */

export default function GoldButton({
    children,
    onClick,
    variant = 'solid', // solid | outline
    size = 'md', // sm | md | lg
    className = '',
    disabled = false,
    type = 'button',
    fullWidth = false
}) {
    const sizeClasses = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base'
    }

    const baseClasses = `
        ${variant === 'solid' ? 'gold-button' : 'gold-button-outline'}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
    `

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={baseClasses}
        >
            {children}
        </button>
    )
}

// Link styled as gold button
export function GoldLink({ children, href, variant = 'solid', className = '', ...props }) {
    return (
        <a
            href={href}
            className={`
                inline-block text-center
                ${variant === 'solid' ? 'gold-button' : 'gold-button-outline'}
                ${className}
            `}
            {...props}
        >
            {children}
        </a>
    )
}
