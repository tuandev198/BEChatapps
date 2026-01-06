/**
 * Loading component với nhiều variants
 */
function Loading({ 
  size = 'md', 
  variant = 'spinner',
  text = '',
  fullScreen = false,
  className = ''
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`} />
  );

  const dots = (
    <div className={`flex gap-1 ${className}`}>
      <div className={`${sizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  );

  const pulse = (
    <div className={`${sizeClasses[size]} bg-indigo-600 rounded-full animate-pulse ${className}`} />
  );

  const skeleton = (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return dots;
      case 'pulse':
        return pulse;
      case 'skeleton':
        return skeleton;
      default:
        return spinner;
    }
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
          {renderLoader()}
          {text && <p className="text-slate-600 text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {renderLoader()}
      {text && <p className="text-slate-500 text-sm">{text}</p>}
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = 'sm', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <div className={`${sizeClasses[size]} border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`} />
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({ text = 'Đang xử lý...' }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Page loading overlay
 */
export function PageLoading({ text = 'Đang tải...' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F6F5FB]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">{text}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}

// Export both default and named for compatibility
export default Loading;
export { Loading };

