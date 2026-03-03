import React from "react";
import { FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className="relative overflow-hidden py-16 bg-transparent
      md:border-none border-t-[3px] border-b-[3px]
      border-t-transparent border-b-transparent
      bg-gradient-to-r from-[#7928CA] via-[#FF0080] to-[#7928CA]
      bg-[length:200%_3px] bg-no-repeat
      bg-[0_0,0_100%] animate-borderFlow"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#7700ff_0%,transparent_70%)] opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,#ff00ea_0%,transparent_70%)] opacity-10" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          {/* Logo & About */}
          <div>
            <h3 className="font-orbitron text-2xl text-white mb-6">
              NEC CONFERENCE 2026
            </h3>
            <p className="text-purple-200/90 font-space-grotesk">
              Experience innovation, research excellence, and global collaboration
              at NEC Conference 2026.
            </p>
          </div>

          {/* Quick Links (Corrected According To App.jsx) */}
          <div>
            <h4 className="font-orbitron text-white text-lg mb-6">
              Quick Links
            </h4>

            <nav className="flex flex-col gap-4 font-space-grotesk">

              <Link
                to="/"
                onClick={scrollToTop}
                className="text-purple-200/90 hover:text-white transition"
              >
                Home
              </Link>

              <Link
                to="/contact"
                onClick={scrollToTop}
                className="text-purple-200/90 hover:text-white transition"
              >
                Contact
              </Link>

            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-orbitron text-white text-lg mb-6">
              Contact Us
            </h4>
            <div className="space-y-3 text-purple-200/90 font-space-grotesk">
              <p>National Engineering College</p>
              <p>K.R.Nagar, Kovilpatti</p>
              <p>neccoference2k26@gmail.com</p>
            </div>
          </div>

          {/* Developer Team */}
          <div>
            <h4 className="font-orbitron text-white text-lg mb-6">
              Developer Team
            </h4>
            <div className="space-y-3 text-purple-200/90 font-space-grotesk">
              <p>Ram Balakumaran B – III Year CSE</p>
              <p>Pon Kathir M – III Year CSE</p>
              <p>Aathi Narayanan S – III Year CSE</p>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-purple-500/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-purple-200/90 text-sm font-space-grotesk">
              © 2026 NEC CONFERENCE. All rights reserved.
            </p>

            <div className="flex gap-6">
              <a
                href="https://x.com/NECKVP"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200/90 hover:text-white transition hover:scale-110"
              >
                <FaTwitter className="h-6 w-6" />
              </a>

              <a
                href="https://www.instagram.com/national_engineering_college"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200/90 hover:text-white transition hover:scale-110"
              >
                <FaInstagram className="h-6 w-6" />
              </a>

              <a
                href="https://www.linkedin.com/school/national-engineering-college/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-200/90 hover:text-white transition hover:scale-110"
              >
                <FaLinkedin className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Animated Border */}
      <style>{`
        @keyframes borderFlow {
          0% { background-position: 0 0, 200% 100%; }
          50% { background-position: 200% 0, 0 100%; }
          100% { background-position: 0 0, 200% 100%; }
        }
        .animate-borderFlow {
          animation: borderFlow 3s linear infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
