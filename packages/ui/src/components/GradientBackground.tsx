'use client';

import React from 'react';

/**
 * A reusable gradient background with polygonal elements
 * for consistent styling across hero and auth-related pages
 */
const GradientBackground = () => {
  return (
    <>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#FFF9E9]/90 via-[#E1CCEB]/80 to-[#FFF9E9]/80 will-change-transform" />

      {/* Subtle Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l7.9-7.9h-.828zm5.656 0L19.515 8.485 17.343 10.657l7.9-7.9h2.757zm5.656 0l-6.485 6.485L25.515 8.14l7.9-7.9h-.714zm5.657 0l-4.243 4.242L33.414 5.9 41.3 0h-2.087zm5.657 0l-2 2-1.414 1.414L41.3 0h2.944zM32.03 0L40.515 8.485 42.687 6.313l-7.9-7.9h-2.757zm-5.657 0L34.858 8.485 33.444 9.9l-7.9-7.9h.828zm-5.657 0L28.2 6.485 26.786 7.9l-7.9-7.9h2.83zm-5.656 0L21.515 6.485 20.1 7.9l-7.9-7.9h2.83zm-5.657 0L15.858 6.485 14.444 7.9l-7.9-7.9h2.83zM5.373 0L13.858 8.485 12.444 9.9l-7.9-7.9h.828z' fill='%234b2c5e' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}
      />
    </>
  );
};

export default GradientBackground; 