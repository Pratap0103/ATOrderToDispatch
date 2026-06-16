import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-3 md:py-2 border-t border-amber-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-[13px] md:text-sm font-bold md:font-medium text-amber-700">
          Powered By <a
            href="https://www.botivate.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 md:text-amber-600 hover:text-amber-800 font-black md:font-bold hover:underline transition-all"
          >
           Botivate
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;