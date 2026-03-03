import { useState, useEffect } from "react";

const ScrollingNews = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Updated text for Conference
  const newsMessages = [
    "Call for Participation is Now Open.Join multiple technical conference events across various departments.Register on or before March 25.The conference will be held on March 25.Early registration is recommended to secure your spot."];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setIsVisible(window.scrollY <= 50);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 ${
          isMobile ? "w-full mb-0" : "w-[75%] mb-6"
        } bg-pink-600 text-white py-2 shadow-lg overflow-hidden transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="overflow-hidden whitespace-nowrap">
          <div className="scrolling-text">
            <span>
              {newsMessages.concat(newsMessages).join(" • ")}
            </span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scrollText {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .scrolling-text {
          display: inline-block;
          white-space: nowrap;
          animation: scrollText 30s linear infinite;
          padding-right: 100%;
        }
      `}</style>
    </>
  );
};

export default ScrollingNews;