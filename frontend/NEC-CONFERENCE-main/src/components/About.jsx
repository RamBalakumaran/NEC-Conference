import React from "react";
import { TimelineCard } from "./TimelineCards";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { FaUniversity, FaChalkboardTeacher, FaUsers, FaHandsHelping, FaRegLightbulb } from 'react-icons/fa';

function About() {
    const timeline = [
        {
          id: 1,
          title: "Conference Schedule", 
          description: "ICoDSES 2026 is structured into pre-conference workshops on March 25, 2026 and main conference sessions on March 26-27, 2026.",
          date: "March 25-27, 2026",
          icon: <FaUniversity size={30} color="white" />
        },
        {
          id: 2,
          title: "Pre-Conference Workshops",
          description: "March 25 features department-wise hands-on workshops across EEE, Mechanical, Civil, IT, ECE, CSE, AI & DS, and S&H tracks.",
          date: "March 25, 2026",
          icon: <FaChalkboardTeacher size={30} color="white" />
        },
        {
          id: 3,
          title: "Main Conference Days", 
          description: "March 26-27 hosts ICoDSES-2026 main conference sessions with keynote talks, technical presentations, committee sessions, and networking.",
          date: "March 26-27, 2026",
          icon: <FaUsers size={30} color="white" />
        },
        {
          id: 4,
          title: "Resource Persons & Networking", 
          description: "Participants engage with expert resource persons from academia and industry through interactive sessions and professional networking.",
          date: "All Conference Days",
          icon: <FaHandsHelping size={30} color="white" />
        },
        {
          id: 5,
          title: "Registration & Participation", 
          description: "Pricing preference: one event Rs.10, pre-conference more than one event Rs.20, and pre-conference more than one event + 26th & 27th full access Rs.25.",
          date: "Open Now",
          icon: <FaRegLightbulb size={30} color="white" />
        },
   
      ];
  
    return (
      <div className="relative">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl text-center font-orbitron font-bold mb-4 sm:mb-8">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse"> About </span>
            <span className="bg-gradient-to-r from-[#f112ba] via-[#ff00ea] to-[#ff00d9] text-transparent bg-clip-text animate-gradient">NEC</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse"> Conference 2026</span>
          </h1>

          <p className="text-base sm:text-xl text-center font-space-grotesk text-purple-200/90 mb-8 sm:mb-16 max-w-3xl mx-auto leading-relaxed">
            Welcome to ICoDSES 2026. Here is your complete conference timeline from the March 25 pre-conference workshops to the March 26-27 main conference sessions.
          </p>
  
          <div className="relative">
            <VerticalTimeline 
              animate={true} 
              lineColor={'rgba(139, 92, 246, 0.4)'}
              className="vertical-timeline-custom-line"
            >
              {timeline.map((element) => (
                <VerticalTimelineElement
                  key={element.id}
                  date={element.date} // Note: Your timeline array above doesn't have a 'date' property, but keeping this as per your original code.
                  dateClassName="text-purple-300 font-space-grotesk text-sm sm:text-base"
                  // REMOVED: The @media query inside iconStyle
                  iconStyle={{ 
                    background: 'rgb(30, 41, 59)',
                    color: '#fff',
                    // The library handles basic sizing, but we can set defaults here.
                    // If you need specific sizes for mobile vs desktop, use CSS in index.css
                  }}
                  icon={element.icon}
                  // REMOVED: The @media query inside contentStyle
                  contentStyle={{
                    background: 'transparent',
                    boxShadow: 'none',
                    padding: '0 1rem',
                  }}
                >
                  <TimelineCard
                    title={element.title}
                    description={element.description}
                    icon={element.icon}
                  />
                </VerticalTimelineElement>
              ))}
            </VerticalTimeline>
          </div>
        </div>
      </div>
    );
  }
  
  export default About;

