import React from 'react';

const Loader = ({ className = "", size = "md", fullPage = false, color = "red" }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4"
  };

  const colorClasses = {
    red: "border-t-[#d30614] border-b-[#d30614] border-l-transparent border-r-transparent",
    white: "border-t-white border-b-white border-l-transparent border-r-transparent",
    black: "border-t-black border-b-black border-l-transparent border-r-transparent"
  };

  const loader = (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}></div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;
