import React from 'react'
import './StarBorder.css'
import { accentColors as colorMap } from '../../context/AccentColorContext'

/**
 * StarBorder Component from React Bits design pattern
 * Creates an animated gradient border effect that moves around the element
 * 
 * @param {string} as - The HTML element type to render (default: 'button')
 * @param {string} className - Additional CSS classes
 * @param {string} color - The primary color of the border effect (default: 'purple')
 * @param {number} speed - Animation duration in seconds (default: 6)
 * @param {React.ReactNode} children - Content inside the component
 */
export default function StarBorder({
    as: Component = 'button',
    className = '',
    color = 'purple',
    speed = 6,
    children,
    ...props
}) {
    // Get color from the color map or use directly if not found
    const borderColor = colorMap[color]?.primary || color

    return (
        <Component
            className={`star-border ${className}`}
            style={{
                '--border-color': borderColor,
                '--speed': `${speed}s`,
            }}
            {...props}
        >
            <div className="star-border-inner">
                {children}
            </div>
        </Component>
    )
}
