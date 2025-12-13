/**
 * GlassCard - Premium glassmorphism card component
 * Based on Panorama Glass Lodge design aesthetic
 */

export default function GlassCard({
    children,
    className = '',
    hover = true,
    padding = 'p-6',
    onClick
}) {
    return (
        <div
            className={`
                glass-card 
                ${padding}
                ${hover ? 'hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-0.5' : ''}
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

// Variant: Glass card with gold border accent
export function GlassCardGold({ children, className = '', ...props }) {
    return (
        <div
            className={`
                glass-card p-6
                border-l-2 border-l-[#c4a35a]
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    )
}

// Variant: Stat card with large number and label
export function GlassStatCard({ value, label, icon, className = '' }) {
    return (
        <div className={`luxury-stat-card ${className}`}>
            {icon && <div className="text-3xl mb-2">{icon}</div>}
            <div className="luxury-stat-value">{value}</div>
            <div className="luxury-stat-label">{label}</div>
        </div>
    )
}
