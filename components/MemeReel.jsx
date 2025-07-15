import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import MemeCard from './MemeCard';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';

// MemeReel Component: Handles fetching and displaying a reel of memes
const MemeReel = ({ onInitialVideosLoaded }) => { // Accept onInitialVideosLoaded prop
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Tracks the page for infinite scroll
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const observerTarget = useRef(null);
  const reelContainerRef = useRef(null); // Ref for the scrollable container
  const initialLoadCompleted = useRef(false); // Track if initial load is done

  // Pexels API Key
  const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY; // Your actual Pexels API KEY

  // react-spring for animating the vertical position
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  // Debounce for wheel events
  const wheelTimeout = useRef(null);
  const WHEEL_DEBOUNCE_TIME = 400; // Time in ms to wait before allowing another wheel event

  // Function to fetch videos from Pexels API
  const fetchVideos = useCallback(async (pageNum, initialRandomPage = 0) => {
    if (!PEXELS_API_KEY) {
      setError("Pexels API Key is not configured. Please get one from pexels.com/api and add it to MemeReel.jsx");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use initialRandomPage for the first fetch, otherwise use pageNum for infinite scroll
      const actualPageToFetch = initialRandomPage > 0 ? initialRandomPage : pageNum;

      // Increased per_page to load more videos and added cache-busting parameter
      const response = await fetch(`https://api.pexels.com/videos/search?query=funny+memes&per_page=15&page=${actualPageToFetch}&cachebust=${Date.now()}`, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
      }
      const data = await response.json();

      if (data.videos.length === 0 && actualPageToFetch > 1) {
        // If no videos found on a random page, try fetching from page 1 as a fallback
        console.warn(`No videos found on page ${actualPageToFetch}. Falling back to page 1.`);
        await fetchVideos(1, 0); // Recursively call with page 1, without randomizing
        return;
      }

      const newVideos = data.videos.map(video => {
        const videoFile = video.video_files.find(file => file.quality === 'hd' && file.width <= 1080) || video.video_files[0];
        return {
          id: video.id,
          url: videoFile ? videoFile.link : '',
          thumbnail: video.image,
          title: video.url.split('/').pop().replace(/-/g, ' ').replace(/\.html$/, '') || 'Funny Meme',
          description: `A hilarious video from Pexels by ${video.user.name}.`,
          likes: Math.floor(Math.random() * 1000000),
          comments: Math.floor(Math.random() * 10000),
          shares: Math.floor(Math.random() * 10000),
          photographer: video.user.name,
          photographerUrl: video.user.url,
        };
      }).filter(video => video.url);

      // Only append if it's for infinite scroll, otherwise replace for initial load
      if (initialRandomPage === 0 && pageNum === 1) {
          setVideos(newVideos); // For initial load (page 1, not random)
      } else {
          setVideos(prevVideos => [...prevVideos, ...newVideos]);
      }

    } catch (e) {
      console.error("Failed to fetch videos:", e);
      setError(`Failed to load memes: ${e.message}. Please check your API key and network connection.`);
    } finally {
      setLoading(false);
      // Signal to App.jsx that initial videos are loaded
      if (!initialLoadCompleted.current && pageNum === 1) {
        initialLoadCompleted.current = true;
        if (onInitialVideosLoaded) {
          onInitialVideosLoaded();
        }
      }
    }
  }, [PEXELS_API_KEY, onInitialVideosLoaded]); // Add onInitialVideosLoaded to dependency array

  // Effect to fetch initial videos when the component mounts
  useEffect(() => {
    // Generate a random page number between 1 and 10 for initial load
    // Adjust maxPage as needed, but be mindful of potential empty results
    const randomInitialPage = Math.floor(Math.random() * 10) + 1;
    fetchVideos(1, randomInitialPage); // Pass 1 for internal page tracking, and randomInitialPage for actual fetch
  }, [fetchVideos]);

  // Programmatic scrolling when currentVideoIndex changes
  useEffect(() => {
    if (reelContainerRef.current && videos.length > 0) {
      const videoHeight = reelContainerRef.current.clientHeight;
      api.start({ y: -currentVideoIndex * videoHeight, immediate: false }); // Animate smoothly
    }
  }, [currentVideoIndex, videos.length, api]);

  // Infinite scrolling logic using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage(prevPage => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loading]);

  // Fetch more videos when page number changes (for infinite scroll)
  useEffect(() => {
    if (page > 1) {
      fetchVideos(page);
    }
  }, [page, fetchVideos]);

  // --- Gesture Handling with useGesture ---
  useGesture(
    {
      onDrag: ({ last, movement: [, my] }) => {
        const videoHeight = reelContainerRef.current.clientHeight;
        const currentY = -currentVideoIndex * videoHeight; // Current resting Y position

        // Calculate target Y during drag
        const newY = currentY + my;

        if (last) {
          // On drag end, decide whether to go to next/prev video or snap back
          const threshold = videoHeight / 4; // Swipe threshold (e.g., 25% of video height)
          let newIndex = currentVideoIndex;

          if (my < -threshold && currentVideoIndex < videos.length - 1) { // Swiped up enough
            newIndex = currentVideoIndex + 1;
          } else if (my > threshold && currentVideoIndex > 0) { // Swiped down enough
            newIndex = currentVideoIndex - 1;
          }
          setCurrentVideoIndex(newIndex);
        } else {
          // During drag, update spring immediately to follow finger
          api.start({ y: newY, immediate: true });
        }
      },
      onWheel: ({ event, last, delta: [, dy] }) => {
        event.preventDefault(); // Prevent native scroll

        if (wheelTimeout.current) {
          return; // Ignore if already debouncing
        }

        const direction = dy > 0 ? 1 : -1; // 1 for down, -1 for up

        setCurrentVideoIndex(prevIndex => {
          const newIndex = prevIndex + direction;
          return Math.max(0, Math.min(newIndex, videos.length - 1));
        });

        // Set timeout to debounce wheel events
        wheelTimeout.current = setTimeout(() => {
          wheelTimeout.current = null;
        }, WHEEL_DEBOUNCE_TIME);
      },
    },
    {
      target: reelContainerRef, // Attach gestures to the reel container
      eventOptions: { passive: false }, // Allow preventDefault for wheel/touchmove
      drag: {
        filterTaps: true, // Prevent drag from triggering click events
        axis: 'y', // Only vertical drag
        rubberband: true, // Allow rubberband effect at ends
        // Bounds are implicitly handled by setCurrentVideoIndex and spring animation
      },
      wheel: {
        // Wheel sensitivity is implicitly handled by the debounced setCurrentVideoIndex
      }
    }
  );

  return (
    // Container for the meme reel, now with controlled overflow and gesture handlers
    <div
      ref={reelContainerRef} // Attach ref to the container
      className="relative w-full max-w-md h-[calc(100vh-150px)] md:h-[calc(100vh-200px)] overflow-y-hidden rounded-lg shadow-2xl bg-gray-900 hide-scrollbar"
    >
      {videos.length === 0 && loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading GiggleGrid...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 text-lg p-4 text-center">
          <AlertCircle className="mb-2" size={32} /> {error}
        </div>
      )}

      {/* Animated container for the videos */}
      <animated.div
        style={{ y }} // Apply the animated y position
        className="w-full h-full will-change-transform" // will-change-transform for performance
      >
        {videos.map((video, index) => (
          <MemeCard
            key={video.id}
            video={video}
            isActive={index === currentVideoIndex}
            // Preload 2 videos before and 2 videos after the current active video
            isPreloaded={index >= currentVideoIndex - 2 && index <= currentVideoIndex + 2}
            ref={index === videos.length - 1 ? observerTarget : null}
          />
        ))}
      </animated.div>

      {loading && videos.length > 0 && (
        <div className="flex items-center justify-center p-4 text-white">
          <Loader2 className="animate-spin mr-2" size={20} /> Loading more...
        </div>
      )}
    </div>
  );
};

export default MemeReel;
