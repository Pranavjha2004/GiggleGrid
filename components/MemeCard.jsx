import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, VolumeX, Volume2 } from 'lucide-react';

// MemeCard Component: Displays a single meme video with its details and interaction buttons
const MemeCard = React.forwardRef(({ video, isActive, isPreloaded }, ref) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false); // State for unmute hint

  // Effect to control video playback based on isActive prop
  useEffect(() => {
    const currentVideo = videoRef.current;
    if (currentVideo) {
      if (isActive) {
        // Attempt to play video when active
        currentVideo.play().then(() => {
          // Video played successfully (might still be muted by browser policy)
          if (currentVideo.muted) {
            setShowUnmuteHint(true); // Show hint if it's still muted
          } else {
            setShowUnmuteHint(false); // Hide hint if it played unmuted
          }
        }).catch(error => {
          // Autoplay prevented (most likely due to audio). Mute and try again.
          console.warn("Autoplay prevented:", error);
          currentVideo.muted = true; // Ensure it's muted if autoplay fails
          setIsMuted(true);
          setShowUnmuteHint(true); // Always show hint if autoplay with sound failed
          currentVideo.play().catch(e => console.error("Failed to play video even when muted:", e));
        });
      } else {
        // Pause and reset video when not active
        currentVideo.pause();
        currentVideo.currentTime = 0;
        setShowUnmuteHint(false); // Hide hint when not active
      }
    }
  }, [isActive, video.url]); // Re-run when active state or video URL changes

  // Function to toggle mute status
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      setShowUnmuteHint(false); // Hide hint once user interacts
    }
  };

  return (
    // Container for a single meme card, snapping to the scroll position
    <div
      ref={ref}
      className="relative w-full h-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden flex-shrink-0"
      style={{ height: '100%' }} // Ensure each card takes full height of its parent
    >
      {/* Conditionally render video source for preloading */}
      {isPreloaded ? (
        <video
          ref={videoRef}
          src={video.url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onError={(e) => console.error("Video error:", e.message || e.target.error || "An unknown video error occurred. Check video URL.")}
          preload="auto" // Suggest browser to preload
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        // Placeholder or nothing if not preloaded to save resources
        <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
          Video not loaded (scroll closer)
        </div>
      )}


      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-end p-4">
        {/* Mute/Unmute button */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Tap to Unmute Hint */}
        {isActive && isMuted && showUnmuteHint && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm animate-pulse">
            Tap to Unmute
          </div>
        )}

        {/* Bottom section: Meme details and interaction buttons */}
        <div className="flex justify-between items-end w-full">
          {/* Left: Meme Info */}
          <div className="flex-1 pr-4 text-shadow-md">
            <h2 className="text-white text-xl font-bold mb-1 line-clamp-2">
              {video.title}
            </h2>
            <p className="text-gray-200 text-sm mb-2 line-clamp-3">
              {video.description}
            </p>
            <a
              href={video.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 text-xs hover:underline"
            >
              By {video.photographer} (Pexels)
            </a>
          </div>

          {/* Right: Interaction Buttons (Vertical Stack) */}
          <div className="flex flex-col items-center space-y-5">
            {/* Like Button */}
            <button className="flex flex-col items-center text-white transition-transform transform hover:scale-110 active:scale-95">
              <Heart className="w-8 h-8 text-white drop-shadow-lg" />
              <span className="text-sm font-semibold mt-1">
                {video.likes >= 1000000
                  ? (video.likes / 1000000).toFixed(1) + 'M'
                  : video.likes >= 1000
                  ? (video.likes / 1000).toFixed(1) + 'K'
                  : video.likes}
              </span>
            </button>

            {/* Comment Button */}
            <button className="flex flex-col items-center text-white transition-transform transform hover:scale-110 active:scale-95">
              <MessageCircle className="w-8 h-8 text-white drop-shadow-lg" />
              <span className="text-sm font-semibold mt-1">
                {video.comments >= 1000000
                  ? (video.comments / 1000000).toFixed(1) + 'M'
                  : video.comments >= 1000
                  ? (video.comments / 1000).toFixed(1) + 'K'
                  : video.comments}
              </span>
            </button>

            {/* Share Button */}
            <button className="flex flex-col items-center text-white transition-transform transform hover:scale-110 active:scale-95">
              <Share2 className="w-8 h-8 text-white drop-shadow-lg" />
              <span className="text-sm font-semibold mt-1">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MemeCard;
