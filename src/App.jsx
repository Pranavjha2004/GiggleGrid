import React, { useState, useRef } from 'react';
import MemeReel from '../components/MemeReel';
import SplashScreen from '../components/SplashScreen'; // Import the SplashScreen component

// Main App Component
const App = () => {
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const splashScreenLoadedRef = useRef(null); // Ref to signal splash screen completion

  return (
    // Main container for the application, setting dark background and text color
    <div className="min-h-screen w-screen bg-gray-950 text-white font-inter overflow-hidden flex flex-col items-start p-6 md:p-8">
      {/* Conditionally render SplashScreen or the main content */}
      {showSplashScreen && <SplashScreen onLoaded={splashScreenLoadedRef} />}

      {/* Title of the application, now aligned to the left */}
      <h1 className="text-4xl font-extrabold mb-6 text-zinc-200">
        Giggle<span className='text-red-400'>Grid</span>
      </h1>
      {/* Render the MemeReel component, centered horizontally */}
      <div className="flex-grow w-full flex items-center justify-center">
        <MemeReel onInitialVideosLoaded={() => {
          // Trigger splash screen fade out
          if (splashScreenLoadedRef.current) {
            splashScreenLoadedRef.current(); // Resolve the promise in SplashScreen
          }
          // After a short delay, hide the splash screen component
          setTimeout(() => setShowSplashScreen(false), 500); // Match fade out duration
        }} />
      </div>
    </div>
  );
};

export default App;
