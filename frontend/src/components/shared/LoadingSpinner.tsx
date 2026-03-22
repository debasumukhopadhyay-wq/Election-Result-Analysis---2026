import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export default function LoadingSpinner({ size = 'md', message }: Props) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${sizeMap[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );
}
