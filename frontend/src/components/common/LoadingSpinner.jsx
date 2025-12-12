export default function LoadingSpinner({ size = 'md', text = '' }) {
    const sizeClasses = {
        sm: 'h-8 w-8 border-2',
        md: 'h-16 w-16 border-b-2',
        lg: 'h-24 w-24 border-4',
    }

    return (
        <div className="flex flex-col items-center justify-center">
            <div
                className={`animate-spin rounded-full border-purple-600 ${sizeClasses[size]}`}
                style={{ borderTopColor: 'transparent' }}
            />
            {text && (
                <p className="text-gray-700 font-semibold mt-4">{text}</p>
            )}
        </div>
    )
}
