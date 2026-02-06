
import React from 'react';
import { Cpu } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
          <Cpu className="text-blue-600" size={28} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-black tracking-tight text-neutral-900 uppercase">
            Quartz<span className="text-blue-600">Revest</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
