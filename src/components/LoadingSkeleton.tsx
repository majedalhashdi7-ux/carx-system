function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-2/3"></div>
    </div>
  );
}

function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 ${className}`}></div>
  );
}

export default LoadingSkeleton;
export { LoadingSpinner };