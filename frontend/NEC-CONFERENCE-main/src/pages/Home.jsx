import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Rocket, X, User, BookOpen, List, Target, Linkedin, Check } from 'lucide-react';

// Styles & Components
import "../assets/fonts/font.css";
import "../assets/fonts/nusar.css";
import Particle from '../components/Particle';
import CountDown from "../components/CountDown";
import NumberCounter from '../components/NumberTicker.jsx';
import About from "../components/About";
import { Navbar } from "../components/Navbar/Navbar.jsx";
import PricingCards from "../components/PricingCards";
import VisitorCounter from "../components/VisitorCount/index.jsx";
import OnlineEvents from "../components/OnlineEvents";
import ScrollingNews from "../components/ScrollingNews";

// Context
import { useConference } from '../context/ConferenceContext';

const profileImage = (fileName) => `${import.meta.env.BASE_URL}Resource%20Person/${encodeURIComponent(fileName)}`;

// --- DATA: Detailed Conference Tracks ---
const trackData = [
  // --- EEE DEPARTMENT ---
  {
    id: "eee-1",
    dept: "EEE",
    title: "Code and Connect with Arduino and ESP32",
    shortDesc: "Hands-on workshop on embedded systems and IoT development.",
    color: "from-yellow-400 to-orange-500",
    resourcePersons: [
      { name: "Dr. B. Venkatasamy", designation: "AP(SG)/EEE", image: profileImage("Dr.B.Venkatasamy.webp") },
      { name: "Mr. F. Antony Jeffrey Vaz", designation: "AP/EEE", image: profileImage("Mr.F.Antony Jeffrey Vaz.webp") }
    ],
    description: [
      "The Department of Electrical and Electronics Engineering is organizing a One-Day Hands-On Workshop on “Code and connect with Arduino and ESP32” on 25.03.2026 for Engineering College Students.",
      "This workshop is designed to provide practical exposure to embedded systems and IoT development using industry-relevant microcontroller platforms. Arduino and ESP32 are widely used in automation, robotics, IoT, and real-time control applications.",
      "This workshop focuses on strengthening the fundamentals of microcontroller programming while giving participants real-time implementation experience."
    ],
    objectives: [
      "To introduce embedded system concepts and microcontroller architecture",
      "To provide hands-on experience in Arduino and ESP32 programming",
      "To interface sensors, displays, and communication modules",
      "To enhance practical skills in hardware–software integration"
    ],
    topics: [
      "Introduction to Arduino and ESP32 Development Boards",
      "Arduino IDE Setup and Programming Basics",
      "Digital Input and Output Interfacing",
      "Sensor Interfacing Techniques with ESP32",
      "Bluetooth Communication using Arduino",
      "RC Robotic Car Interfacing and Control"
    ]
  },
  {
    id: "eee-2",
    dept: "EEE",
    title: "EV Technology and Battery Management Systems",
    shortDesc: "Comprehensive overview of EV architecture and BMS algorithms.",
    color: "from-yellow-500 to-amber-600",
    resourcePersons: [
      { name: "Mr. Sreeraj", designation: "Director - Technical and Operations, EmCog Solutions Pvt. Ltd., Chennai", image: profileImage("Mr.Sreeraj.webp"), linkedin: "https://www.linkedin.com/in/s-v-sreeraj-8195371a7?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "A structured and practical workshop on EV technology, LFP cell characteristics, battery pack design, and Battery Management System interfacing.",
      "Sessions include cell balancing strategies and State of Charge estimation methods with application-oriented coverage.",
      "The workshop provides structured and practical understanding of LFP cell characteristics, battery pack design methodology, BMS interfacing, cell balancing strategies, and State of Charge estimation techniques."
    ],
    objectives: [
      "Learn fundamentals of EV and battery pack design with BMS interfacing.",
      "Understand key electrical parameters and characteristics of LFP cells.",
      "Explore cell balancing methods and SoC estimation techniques."
    ],
    topics: [
      "Introduction and trends in EV technology and system blocks",
      "LFP Cell Fundamentals: Parameters, Characteristics and Datasheet Analysis",
      "Battery Pack Design: Series-Parallel Configuration and Energy Calculation",
      "Battery Management System: Architecture, Protection and Interfacing",
      "Cell Balancing Techniques: Passive vs Active Methods",
      "State of Charge Estimation: OCV and Coulomb Counting Methods",
      "Practical design considerations for EV and energy storage applications"
    ],
    outcomes: [
      "Interpret LFP cell specifications and datasheets effectively.",
      "Design a basic battery pack for EV or energy storage applications.",
      "Explain the role of BMS and its interface with battery systems.",
      "Differentiate passive and active balancing methods.",
      "Compare different SoC measurement techniques."
    ]
  },

  // --- MECHANICAL DEPARTMENT ---
  {
    id: "mech-1",
    dept: "MECHANICAL",
    title: "Digital Fabrication 4.0: Smart Manufacturing",
    shortDesc: "Integrated, data-driven manufacturing workflow aligned with Industry 4.0.",
    color: "from-red-500 to-rose-600",
    resourcePersons: [
      { name: "Dr. K. Thoufiq Mohammed", designation: "Additive Manufacturing Expert", image: profileImage("Dr.K.Thoufiq Mohammed.webp"), linkedin: "https://www.linkedin.com/in/dr-k-thoufiq-mohammed-1207b1156?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "An integrated, data-driven workshop on the digital thread from design to production in smart manufacturing.",
      "Includes guided practical work in CAD preparation, slicing, build execution, post-processing, and rapid inspection.",
      "Digital Fabrication 4.0 is presented as an integrated, data-driven manufacturing workflow aligned with Industry 4.0. The session combines concise lectures and live demonstrations with professional FDM and DLP systems to show the digital thread from design to production."
    ],
    topics: ["Design for additive manufacturing", "Process parameterization", "FDM and DLP workflow", "Production data capture", "Smart factory analytics"]
  },
  {
    id: "mech-2",
    dept: "MECHANICAL",
    title: "CAD to Cut: Wirecut EDM Workshop",
    shortDesc: "Bridge the gap between digital design and precision manufacturing.",
    color: "from-red-400 to-orange-500",
    resourcePersons: [
      { name: "Dr. I. Sankar", designation: "Precision Engineering Expert", image: profileImage("Dr.I.Sankar.webp"), linkedin: "https://www.linkedin.com/in/dr-i-sankar-4496a7134?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "“CAD to Cut: Wirecut EDM Workshop” is a hands-on technical training program designed to bridge the gap between digital design and precision manufacturing.",
      "This workshop provides participants with a comprehensive understanding of profile creation using CAD software and its practical implementation through Wirecut EDM technology. Attendees will learn the fundamentals of Wire Electrical Discharge Machining.",
      "The session emphasizes converting 2D profile drawings into machine-ready formats and executing accurate cuts on conductive materials with high precision and surface finish."
    ],
    topics: [
      "Fundamentals of Wire Electrical Discharge Machining",
      "Machine setup and parameter selection",
      "Converting 2D profile drawings into machine-ready formats",
      "Execution of accurate cuts on conductive materials"
    ]
  },
  {
    id: "mech-3",
    dept: "MECHANICAL",
    title: "VR/XR in Mechanical Engineering Design",
    shortDesc: "Transformative role of VR and XR technologies in modern engineering.",
    color: "from-red-600 to-pink-600",
    resourcePersons: [
      { name: "Dr. M. Vivekanandan", designation: "Immersive Technology Expert", image: profileImage("Dr.M.Vivekanandan.webp"), linkedin: "https://www.linkedin.com/in/dr-m-vivekanandan-a714504b?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "“Application of VR and XR in Mechanical Engineering Design” focuses on introducing students to the transformative role of Virtual Reality (VR) and Extended Reality (XR) technologies in modern engineering practices.",
      "The session highlights how immersive visualization tools enhance product design, prototyping, simulation, assembly planning, ergonomic analysis, and maintenance training.",
      "Participants will explore how VR/XR integrates with CAD software to create interactive 3D models, enabling real-time design evaluation and collaborative engineering."
    ],
    topics: [
      "Immersive visualization tools",
      "Ergonomic analysis and maintenance training",
      "Integration with CAD software",
      "Interactive 3D models & Virtual testing"
    ]
  },

  // --- CIVIL DEPARTMENT ---
  {
    id: "civil-1",
    dept: "CIVIL",
    title: "Next-Gen Construction Planning 3.0",
    shortDesc: "PlanSwift-Driven Estimation & TILOS-Based Linear Scheduling.",
    color: "from-orange-400 to-amber-500",
    resourcePersons: [
      { name: "Thiruvikraman Aanandha kumar", designation: "Professional Service Consultant | IPMCS", image: profileImage("Mr.Thiruvikraman Aanandha kumar.webp"), linkedin: "https://www.linkedin.com/in/thiruvikraman-aanandha-kumar-7b2288398/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BTRcd%2BGN1TSKx9JxZ9rgsIA%3D%3D" }
    ],
    description: [
      "Next-Gen Construction Planning 3.0: PlanSwift-Driven Estimation & TILOS-Based Linear Scheduling is an industry-focused seminar designed to introduce students and professionals to modern digital construction planning practices.",
      "This workshop is designed to provide practical, industry-oriented training in modern construction planning tools used in infrastructure projects like highways, railways, metros, and pipelines.",
      "The session explores how PlanSwift enhances accuracy and speed in quantity take-off and cost estimation through digital measurement and automated BOQ preparation. By integrating estimation and linear scheduling, this seminar highlights how cost and time can be strategically aligned to improve bidding accuracy, project control, and overall profitability. Participants will gain insights into real-world workflows, industry applications, and the evolving trends shaping Construction Planning 3.0."
    ],
    topics: [
      "PlanSwift for quantity take-off and cost estimation",
      "Automated BOQ preparation",
      "TILOS for linear project planning",
      "Time–distance diagrams for infrastructure projects",
      "Cost-time integration for improved project control",
      "Real-world applications in highways, railways, metros, and pipelines",
      "Bidding accuracy and profitability enhancement"
    ]
  },

  {
    id: "civil-2",
    dept: "CIVIL",
    title: "Sustainable Solutions for Potable Water",
    shortDesc: "Laboratory testing and efficient usage assessment.",
    color: "from-orange-300 to-yellow-500",
    resourcePersons: [
      { name: "Dr. Gagarin Guru", designation: "Environmental and Water Resources Expert", image: profileImage("Mr.Gagarin guru.webp"), linkedin: "https://www.linkedin.com/in/gagarin-guru-5125ab53/" }
    ],
    description: [
      "Sustainable solutions for potable water include regular laboratory testing and efficient usage assessment using water testing kits to ensure safety and long-term resource management.",
      "In laboratories, potable water is evaluated through physical, chemical, and microbiological analysis using standardized water testing kits that measure parameters such as pH, turbidity, TDS, hardness, dissolved oxygen, nitrates, chlorides, and microbial contamination.",
      "Sustainable assessment also involves monitoring consumption patterns, detecting leaks, and evaluating treatment efficiency to minimize waste and energy use."
    ],
    topics: [
      "Physical, chemical, and microbiological analysis",
      "IS 10500 standards for drinking water",
      "Monitoring consumption patterns",
      "Evaluating treatment efficiency"
    ]
  },

  // --- IT DEPARTMENT ---
  {
    id: "it-1",
    dept: "IT",
    title: "Predictive Analytics Using ML in IoT",
    shortDesc: "Forecast future events using real-time sensor data.",
    color: "from-blue-400 to-cyan-400",
    resourcePersons: [
      { name: "Ms. Santhi Sankarappan", designation: "Intelligent Systems Expert", image: profileImage("Ms.S.Santhi.webp"), linkedin: "https://www.linkedin.com/in/santhi-sankarappan?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "Predictive Analytics Using Machine Learning in IoT is an exciting workshop designed for B.Tech students to explore how intelligent systems can forecast future events using real-time sensor data.",
      "With the rapid growth of IoT devices in smart homes, healthcare, agriculture, manufacturing, and smart cities, massive amounts of data are generated every second. This workshop introduces students to how Machine Learning algorithms analyze this data to predict outcomes such as equipment failures, energy consumption, health risks, and traffic patterns.",
      "Participants will gain foundational knowledge of IoT architecture, data preprocessing, and basic ML model development using popular tools like Python and Scikit-learn."
    ],
    topics: [
      "IoT Architecture & Data Preprocessing",
      "Machine Learning Algorithms for IoT",
      "Predicting Equipment Failures & Energy Consumption",
      "Hands-on with Python and Scikit-learn"
    ]
  },
  {
    id: "it-2",
    dept: "IT",
    title: "Predictive Analytics Using Machine Learning in IoT",
    shortDesc: "Forecast future events using real-time IoT sensor data.",
    color: "from-blue-500 to-indigo-500",
    resourcePersons: [
      { name: "AI Architect", designation: "Generative AI Lead", image: profileImage("Dr.Krishnamoorthy Dinesh.webp") }
    ],
    description: [
      "This track focuses on the practical aspects of building autonomous AI Agents that can perceive, reason, and act to solve complex problems.",
      "Participants will learn about the architecture of Agentic AI, exploring frameworks like LangChain and AutoGPT. The session covers prompting strategies, memory management, and tool usage.",
      "Attendees will build a simple autonomous agent capable of browsing the web or interacting with APIs to complete multi-step tasks."
    ],
    topics: [
      "Fundamentals of Agentic AI",
      "LangChain & AutoGPT Frameworks",
      "Prompt Engineering for Agents",
      "Building Multi-step Reasoning Systems"
    ]
  },

  // --- ECE DEPARTMENT ---
      {
    id: "ece-1",
    dept: "ECE",
    title: "From Arrays to Intelligence: Evolving Antenna Technologies - Massive MIMO, RIS, and Beyond",
    shortDesc: "Antenna arrays are groups of antennas working together to improve wireless communication",
    color: "from-green-600 to-cyan-600",
    resourcePersons: [
      { name: "Dr. V. Lingasamy", designation: "ME, PhD, MSc Yoga", image: profileImage("Dr.V.Lingasamy.webp"), linkedin: "" }
    ],
    description: [
      "Antenna arrays are groups of antennas working together to improve wireless communication. Instead of radiating energy in all directions like a single antenna, arrays use wave interference to focus signals where they are needed. This enables beam steering, higher signal strength, reduced interference, and higher data rates, which are essential for today's mobile networks.",
      "By adjusting the phase of signals at each antenna element, arrays can form directed beams, similar to focusing a flashlight. When signals add constructively, the received power increases; when they cancel, interference is reduced. The overall radiation behavior is described by the array factor, and an array with N antennas can form up to N independent beams or data streams.",
      "Over time, antenna arrays have evolved to meet growing demands. Phased arrays were first used in radar to steer beams electronically. Later, smart antennas introduced adaptive beamforming to track users and suppress interference. A major breakthrough came with MIMO (Multiple-Input Multiple-Output) systems, where multiple antennas at both the transmitter and receiver improve reliability and increase data rates. MIMO is now widely used in Wi-Fi, 4G, and 5G systems.",
      "Massive MIMO extends this idea by using hundreds of antennas at the base station. This allows very narrow beams, higher capacity, better coverage, and improved energy efficiency. Massive MIMO is a key technology in 5G, especially at high frequencies where signal loss is severe.",
      "Looking ahead, Reconfigurable Intelligent Surfaces (RIS) offer a new approach. RIS are passive surfaces that reflect and shape radio waves intelligently, improving coverage and reducing power consumption. While still under research, RIS is expected to play an important role in 6G networks.",
      "In summary, antenna arrays form the backbone of modern wireless systems, enabling the performance gains required for 5G today and 6G in the future."
    ],
    topics: [
      "Semiconductor advancements for defense and aerospace",
      "Extreme environmental operating conditions and reliability",
      "Advanced fabrication techniques and innovative packaging",
      "2nm technology and miniaturization trends",
      "Gate-All-Around (GAA) transistor architectures",
      "System-on-Chip (SoC) integration and design",
      "Neural Processing Units (NPUs) and edge AI",
      "Mission-critical applications in radar, avionics, and satellites",
      "Power efficiency and thermal management in embedded systems"
    ],
    speakerBio: "Raja Subramanian brings 27 years of specialized experience to his leadership role at Mistral Solutions (an AXISCADES Technologies Company). He has been a pivotal force in the \"Chip-to-Product\" journey for dozens of high-stakes projects, from complex hardware board design to sophisticated embedded software stacks. His expertise makes him a leading voice for engineers and stakeholders navigating the intersection of semiconductor innovation and mission-critical deployment."
  },
  {
    id: "ece-2",
    dept: "ECE",
    title: "Emerging Trends in Semiconductors & Embedded Systems",
    shortDesc: "High-performance, energy-efficient systems for defense and aerospace applications.",
    color: "from-green-600 to-cyan-600",
    resourcePersons: [
      { name: "Raja Subramanian", designation: "Director of Leadership in Semiconductor Innovation, Mistral Solutions (an AXISCADES Technologies Company)", image: profileImage("Mr.Raja Subramanian.webp"), linkedin: "https://www.linkedin.com/in/raja-subramanian-1390479?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "The semiconductor industry is undergoing transformative advancements that are significantly influencing next-generation defense and aerospace technologies. Modern semiconductor shifts focus on delivering high-performance, energy-efficient, and highly reliable systems capable of operating under extreme environmental conditions such as radiation exposure and temperature variations. Advanced fabrication techniques, innovative packaging methods, and secure chip architectures are enabling compact, durable, and mission-critical electronic systems for applications including radar, avionics, satellite communication, and autonomous defense platforms.",
      "A major milestone in this evolution is the transition to 2nm technology and beyond, representing a new era of semiconductor miniaturization. This advancement enables higher transistor density, faster processing speeds, and improved power efficiency, while also introducing challenges related to fabrication complexity and quantum-level effects. To address these challenges, innovative transistor architectures such as Gate-All-Around (GAA) structures are being implemented, paving the way for ultra-compact and high-speed processors suitable for advanced computing and embedded systems.",
      "Simultaneously, the evolution of System-on-Chip (SoC) architecture has revolutionized electronic system integration by combining processors, memory, communication interfaces, and specialized accelerators onto a single silicon platform. This integration reduces system size, lowers power consumption, and enhances operational efficiency across multiple industries. Furthermore, the incorporation of on-chip Artificial Intelligence accelerators, known as Neural Processing Units (NPUs), enables real-time data processing and intelligent decision-making at the edge. Collectively, these advancements are driving the development of smarter, faster, and more autonomous electronic systems for future technological applications."
    ],
    topics: [
      "Semiconductor advancements for defense and aerospace",
      "Extreme environmental operating conditions and reliability",
      "Advanced fabrication techniques and innovative packaging",
      "2nm technology and miniaturization trends",
      "Gate-All-Around (GAA) transistor architectures",
      "System-on-Chip (SoC) integration and design",
      "Neural Processing Units (NPUs) and edge AI",
      "Mission-critical applications in radar, avionics, and satellites",
      "Power efficiency and thermal management in embedded systems"
    ],
    speakerBio: "Raja Subramanian brings 27 years of specialized experience to his leadership role at Mistral Solutions (an AXISCADES Technologies Company). He has been a pivotal force in the \"Chip-to-Product\" journey for dozens of high-stakes projects, from complex hardware board design to sophisticated embedded software stacks. His expertise makes him a leading voice for engineers and stakeholders navigating the intersection of semiconductor innovation and mission-critical deployment."
  },

  // --- CSE DEPARTMENT ---
  {
    id: "cse-1",
    dept: "CSE",
    title: "Quantum Computing: Concepts & Applications",
    shortDesc: "Unlocking the future of computational power.",
    color: "from-purple-500 to-indigo-500",
    resourcePersons: [
      { name: "Dr. Krishnamoorthy Dinesh", designation: "Assistant Professor, IIT Palakkad", image: profileImage("Dr.Krishnamoorthy Dinesh.webp"), linkedin: "https://www.linkedin.com/in/dinesh-krishnamoorthy-21bb641b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
    ],
    description: [
      "Quantum Computing represents the next frontier in computational capability. This workshop demystifies the principles of superposition, entanglement, and qubits.",
      "Attendees will learn about quantum algorithms such as Grover's and Shor's algorithm, and how they threaten current cryptographic standards while offering breakthroughs in drug discovery and optimization problems.",
      "The session includes hands-on experience with IBM Qiskit, allowing students to write and simulate basic quantum circuits."
    ],
    topics: [
      "Qubits, Superposition, and Entanglement",
      "Quantum Gates and Circuits",
      "Introduction to IBM Qiskit",
      "Quantum Cryptography Basics"
    ]
  },
  {
    id: "cse-2",
    dept: "CSE",
    title: "Augmented Reality Systems",
    shortDesc: "Creating immersive digital overlays for the physical world.",
    color: "from-purple-400 to-fuchsia-500",
    resourcePersons: [
      { name: "Mr. Karthikeyan", designation: "AR/XR Developer", image: profileImage("Mr.J.Karthikeyan.webp"), linkedin: "https://www.linkedin.com/in/karthikeyanmecse?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
    ],
    description: [
      "Explore the creation of Augmented Reality (AR) experiences that blend digital content with the real world. This session covers the hardware and software ecosystems driving AR adoption.",
      "Participants will gain hands-on experience with development platforms like Unity and AR foundation, learning to track images, planes, and objects.",
      "The workshop emphasizes practical applications in education, retail, and industrial maintenance."
    ],
    topics: [
      "Unity 3D & AR Foundation",
      "Marker-based vs Marker-less Tracking",
      "UI/UX Design for AR",
      "Deploying to Mobile Devices"
    ]
  },
  {
    id: "cse-3",
    dept: "CSE",
    title: "Geospatial Applications in Computing",
    shortDesc: "Analyzing spatial data for real-world insights.",
    color: "from-purple-600 to-violet-600",
    resourcePersons: [
      { name: "Dr. Kandasamy S", designation: "Geospatial AI Expert", image: profileImage("Mr.Vignesh Kandasamy.webp"), linkedin: "https://www.linkedin.com/in/kandasamy-s-98149057?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "This track introduces the intersection of Computer Science and Geography through Geospatial technologies. Learn how to analyze, manipulate, and visualize spatial data.",
      "The session covers Geographic Information Systems (GIS), remote sensing data processing, and location-based services.",
      "Students will work with tools like QGIS and Python libraries (Geopandas) to solve problems related to urban planning, environmental monitoring, and logistics."
    ],
    topics: [
      "Introduction to GIS & Remote Sensing",
      "Spatial Data Analysis with Python",
      "Mapping & Visualization Techniques",
      "Location-Based Services Algorithms"
    ]
  },

  // --- AI & DS DEPARTMENT ---
  {
    id: "aids-1",
    dept: "AI & DS",
    title: "N8n: AI-Driven Visual Workflow Automation",
    shortDesc: "Building autonomous agents and workflows.",
    color: "from-pink-600 to-purple-600",
    resourcePersons: [
      { name: "Mr. Mahadevan B", designation: "Automation Architect", image: profileImage("Mr.B.Mahadevan.webp"), linkedin: "https://www.linkedin.com/in/mahadevan-b-5b617622?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }
    ],
    description: [
      "In the rapidly evolving landscape of SaaS, automation is key. This workshop focuses on N8n, a powerful workflow automation tool that integrates seamlessly with AI agents.",
      "Participants will learn to build node-based visual workflows that connect various apps and services, embedding AI capabilities to handle complex decision-making tasks without writing extensive code."
    ],
    topics: [
      "Introduction to N8n and Node-based Automation",
      "Integrating LLMs into Workflows",
      "Building Autonomous AI Agents",
      "API Integration Strategies"
    ]
  },
  {
    id: "aids-2",
    dept: "AI & DS",
    title: "Challenges of Emerging AI Agents in SaaS",
    shortDesc: "Navigating ethics, scalability, and integration in AI SaaS.",
    color: "from-pink-500 to-rose-500",
    resourcePersons: [
      { name: "Ms. Anitha V", designation: "Data Analytics Expert", image: profileImage("Ms.V.Anitha.webp"), linkedin: "https://www.linkedin.com/in/anitha-v-?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
    ],
    description: [
      "As AI Agents become central to SaaS platforms, unique challenges arise in terms of reliability, security, and user trust. This session explores the current landscape of AI-infused SaaS.",
      "Discussions will focus on the 'Hallucination' problem, data privacy concerns in multi-tenant architectures, and the cost implications of running large-scale agentic workflows.",
      "Participants will analyze case studies of successful and failed AI feature rollouts in major SaaS products."
    ],
    topics: [
      "Reliability & Hallucination Mitigation",
      "Data Privacy in AI SaaS",
      "Cost Optimization for LLM Calls",
      "User Trust & Explainability"
    ]
  },

  // --- S&H DEPARTMENT ---
  {
    id: "sh-1",
    dept: "S&H",
    title: "Mathematics in the Age of AI",
    shortDesc: "How mathematics forms the structural backbone of modern AI systems.",
    color: "from-pink-500 to-rose-400",
    resourcePersons: [
      { name: "Dr. Panchatcharam Mariappan", designation: "Mathematics and AI Foundations", image: profileImage("Mr.Panchatcharam Mariappan.webp"), linkedin: "https://www.linkedin.com/in/panchatcharam-mariappan-a2846587" }
    ],
    description: [
      "AI is often portrayed as a triumph of data and computing power. But, in reality, its foundations are profoundly mathematical. This lecture highlights how mathematics forms the structural backbone of modern AI systems.",
      "Data is the fuel of AI. Linear algebra is the engine, shaping neural networks through vectors and matrices. Probability is the steering system, guiding models under uncertainty. Statistics serves as the safety system ensuring reliability. Calculus acts as the navigation system, driving learning through optimization.",
      "In the age of AI, mathematics is not replaced, but it is amplified. A strong mathematical foundation is essential for building reliable, interpretable, and innovative intelligent systems."
    ],
    topics: [
      "Linear Algebra: The engine of Neural Networks",
      "Probability: Reasoning under uncertainty",
      "Statistics: Validation and hypothesis testing",
      "Calculus: Gradient-based optimization"
    ]
  },
  {
    id: "sh-2",
    dept: "S&H",
    title: "AI for Placements: Vibe Coding & Interview Readiness",
    shortDesc: "Mastering 'Vibe Coding', Resume Building & Interview Readiness.",
    color: "from-pink-400 to-fuchsia-400",
    resourcePersons: [
      { name: "Mr. Murali", designation: "Career Coach and Placement Mentor", image: profileImage("Mr.Murali Dharan Rajasekar.webp"), linkedin: "https://www.linkedin.com/in/connectmurali?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "In the competitive landscape of engineering placements, AI is a game-changer. This session introduces 'Vibe Coding'—the art of collaborating with AI to solve complex coding problems efficiently while understanding the underlying logic.",
      "Participants will learn to use AI tools for crafting ATS-friendly resumes that stand out to recruiters. The workshop also covers AI-driven mock interviews to refine communication skills and technical answers.",
      "Prepare for the future of recruitment where understanding how to leverage AI is just as important as core technical skills."
    ],
    topics: [
      "Vibe Coding: AI-Assisted Problem Solving",
      "Building ATS-Proof Resumes with AI",
      "AI Mock Interviews & Feedback",
      "Prompt Engineering for Career Prep"
    ]
  }
];

const detailedTrackOverrides = {
  "eee-2": {
    resourcePersons: [
        { name: "Raja Subramanian", designation: "Director of Leadership in Semiconductor Innovation, Mistral Solutions (an AXISCADES Technologies Company)", image: profileImage("Mr.Raja Subramanian.webp"), linkedin: "https://www.linkedin.com/in/raja-subramanian-1390479?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
      ],
    description: [
      "The Department of Electrical and Electronics Engineering is organizing a one-day hands-on workshop on EV Technology and Battery Management Systems on March 25, 2026 for engineering students.",
      "The workshop provides structured and practical understanding of LFP cell characteristics, battery pack design methodology, BMS interfacing, cell balancing strategies, and State of Charge estimation techniques."
    ],
    objectives: [
      "Learn fundamentals of EV and battery pack design with BMS interfacing.",
      "Understand key electrical parameters and characteristics of LFP cells.",
      "Explore cell balancing methods and SoC estimation techniques."
    ],
    topics: [
      "Introduction and trends in EV technology and system blocks",
      "LFP Cell Fundamentals: Parameters, Characteristics and Datasheet Analysis",
      "Battery Pack Design: Series-Parallel Configuration and Energy Calculation",
      "Battery Management System: Architecture, Protection and Interfacing",
      "Cell Balancing Techniques: Passive vs Active Methods",
      "State of Charge Estimation: OCV and Coulomb Counting Methods",
      "Practical design considerations for EV and energy storage applications"
    ],
    outcomes: [
      "Interpret LFP cell specifications and datasheets effectively.",
      "Design a basic battery pack for EV or energy storage applications.",
      "Explain the role of BMS and its interface with battery systems.",
      "Differentiate passive and active balancing methods.",
      "Compare different SoC measurement techniques."
    ]
  },
  "eee-1": {
    title: "Embedded Systems using Arduino & ESP32",
    resourcePersons: [
      { name: "Dr. B. Venkatasamy", designation: "AP(SG)/EEE", image: profileImage("Dr.B.Venkatasamy.webp"), linkedin: "" },
      { name: "Mr. F. Antony Jeffrey Vaz", designation: "AP/EEE", image: profileImage("Mr.F.Antony Jeffrey Vaz.webp"), linkedin: "" }
    ],
    description: [
      "This one-day workshop provides practical exposure to embedded systems and IoT development using Arduino and ESP32.",
      "It strengthens microcontroller programming fundamentals through real-time implementation for automation, robotics, IoT, and control applications."
    ],
    objectives: [
      "Introduce embedded system concepts and microcontroller architecture.",
      "Provide hands-on experience in Arduino and ESP32 programming.",
      "Interface sensors, displays, and communication modules.",
      "Enhance practical skills in hardware-software integration."
    ]
  },
  "mech-1": { resourcePersons: [{ name: "Dr. K. Thoufiq Mohammed", designation: "Additive Manufacturing Expert", image: profileImage("Dr.K.Thoufiq Mohammed.webp"), linkedin: "https://www.linkedin.com/in/dr-k-thoufiq-mohammed-1207b1156?utm_source=share_via&utm_content=profile&utm_medium=member_android" }] },
  "mech-2": { resourcePersons: [{ name: "Dr. I. Sankar", designation: "Precision Engineering Expert", image: profileImage("Dr.I.Sankar.webp"), linkedin: "https://www.linkedin.com/in/dr-i-sankar-4496a7134?utm_source=share_via&utm_content=profile&utm_medium=member_android" }] },
  "mech-3": { resourcePersons: [{ name: "Dr. M. Vivekanandan", designation: "Immersive Technology Expert", image: profileImage("Dr.M.Vivekanandan.webp"), linkedin: "https://www.linkedin.com/in/dr-m-vivekanandan-a714504b?utm_source=share_via&utm_content=profile&utm_medium=member_android" }] },
  "civil-2": { resourcePersons: [{ name: "Dr. Gagarin Guru", designation: "Environmental and Water Resources Expert", image: profileImage("Mr.Gagarin guru.webp"), linkedin: "https://www.linkedin.com/in/gagarin-guru-5125ab53/" }] },
  "it-1": {
    title: "Predictive Analytics for Sustainable and Intelligent Systems",
    resourcePersons: [
      { name: "Ms. Anitha V", designation: "Data Analytics Expert", image: profileImage("Ms.V.Anitha.webp"), linkedin: "https://www.linkedin.com/in/anitha-v-?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
      { name: "Ms. Santhi Sankarappan", designation: "Intelligent Systems Expert", image: profileImage("Ms.S.Santhi.webp"), linkedin: "https://www.linkedin.com/in/santhi-sankarappan?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ]
  },
  "it-2": { resourcePersons: [{ name: "Dr. Dinesh Raj", designation: "IoT and ML Specialist", image: profileImage("Dr.Dinesh Raj.webp"), linkedin: "https://www.linkedin.com/in/dr-dinesh-raj-5aa7676a?utm_source=share_via&utm_content=profile&utm_medium=member_android" }] },
  "cse-1": {
    title: "Quantum Computing: From Qubits to Contemporary Applications",
    resourcePersons: [{ name: "Dr. Krishnamoorthy Dinesh", designation: "Assistant Professor, IIT Palakkad", image: profileImage("Dr.Krishnamoorthy Dinesh.webp"), linkedin: "https://www.linkedin.com/in/dinesh-krishnamoorthy-21bb641b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }]
  },
  "cse-2": {
    title: "AI in Earth Observation (EO): Deep Learning and Geospatial Intelligence",
    resourcePersons: [{ name: "Dr. Kandasamy S", designation: "Geospatial AI Expert", image: profileImage("Mr.Vignesh Kandasamy.webp"), linkedin: "https://www.linkedin.com/in/kandasamy-s-98149057?utm_source=share_via&utm_content=profile&utm_medium=member_android" }]
  },
  "cse-3": {
    title: "AR Unlocked: Creating Immersive Experiences with Vuforia & Unity",
    resourcePersons: [{ name: "Mr. Karthikeyan", designation: "AR/XR Developer", image: profileImage("Mr.J.Karthikeyan.webp"), linkedin: "https://www.linkedin.com/in/karthikeyanmecse?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }]
  },
  "aids-1": { resourcePersons: [{ name: "Mr. Mahadevan B", designation: "Automation Architect", image: profileImage("Mr.B.Mahadevan.webp"), linkedin: "https://www.linkedin.com/in/mahadevan-b-5b617622?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }] },
  "aids-2": {
    title: "Innovative IoT Design Using Advanced Intelligent Simulation Tools",
    resourcePersons: [{ name: "Dr. Naskath Jahangeer", designation: "IoT Simulation Expert", image: profileImage("Dr.J.Naskath.webp"), linkedin: "https://www.linkedin.com/in/naskath-jahangeer-31a3b6280?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }]
  },
  "sh-1": { resourcePersons: [{ name: "Dr. Panchatcharam Mariappan", designation: "Mathematics and AI Foundations", image: profileImage("Mr.Panchatcharam Mariappan.webp"), linkedin: "https://www.linkedin.com/in/panchatcharam-mariappan-a2846587" }] },
  "sh-2": { resourcePersons: [{ name: "Mr. Murali", designation: "Career Coach and Placement Mentor", image: profileImage("Mr.Murali Dharan Rajasekar.webp"), linkedin: "https://www.linkedin.com/in/connectmurali?utm_source=share_via&utm_content=profile&utm_medium=member_android" }] },
  "ece-1": {
    title: "From Arrays to Intelligence: Evolving Antenna Technologies - Massive MIMO, RIS, and Beyond",
    resourcePersons: [
      { name: "Dr. V. Lingasamy", designation: "ME, PhD, MSc Yoga", image: profileImage("Dr.V.Lingasamy.webp"), linkedin: "" }
    ]
  },
  "ece-2":{resourcePersons: [
        { name: "Raja Subramanian", designation: "Director of Leadership in Semiconductor Innovation, Mistral Solutions (an AXISCADES Technologies Company)", image: profileImage("Mr.Raja Subramanian.webp"), linkedin: "https://www.linkedin.com/in/raja-subramanian-1390479?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
      ]}
};

function Home() {
  const { user } = useConference(); 
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const mergedTrackData = trackData.map((track) => ({
    ...track,
    ...(detailedTrackOverrides[track.id] || {}),
    resourcePersons: detailedTrackOverrides[track.id]?.resourcePersons || track.resourcePersons
  }));

  useEffect(() => {
    sessionStorage.clear();
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      
      {/* Particle Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particle />
      </div>
      
      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">

        {/* Logos */}
        <div className="lg:hidden flex items-center absolute top-2.5 left-2 z-[50] gap-2">
          <img src={`/necconference2k26/logos/NEC-LOGO.webp`} className="w-8 sm:w-10 h-auto" alt="logo" />
          <img src={`/necconference2k26/logos/Founder-Logo.webp`} className="w-12 sm:w-14 h-auto" alt="logo" />
        </div>
        <div className="hidden lg:block absolute top-2.5 left-4 z-[50]">
          <img src={`/necconference2k26/logos/NEC-LOGO.webp`} className="w-14 h-auto" alt="logo" />
        </div>
        <div className="hidden lg:block absolute top-0.5 right-0 z-[50]">
          <img src={`/necconference2k26/logos/Founder-Logo.webp`} className="w-20 h-auto" alt="logo" />
        </div>

        {/* Hero Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(109,40,217,0.2)] via-transparent to-[rgba(139,92,246,0.2)] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#7700ff_0%,transparent_25%),radial-gradient(circle_at_80%_80%,#7700FF_0%,transparent_25%)] blur-[60px]" />
        </div>

        {/* HERO SECTION */}
        <div className="relative min-h-[70vh] sm:min-h-screen flex items-center justify-center flex-col z-10 backdrop-blur-xs pb-0 pt-32 sm:pt-40">
          <div className="container mx-auto text-center px-4 relative z-20"> 
            
            <motion.div
              className="font-netron text-[45px] sm:text-[45px] md:text-[60px] lg:text-[75px] text-white mb-2 sm:mb-4 animate-glow"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              ICoDSES - NEC <br></br>Pre-CONFERENCE '26
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 1, duration: 1.2 }}
              className="mb-4"
            >
              <div className="text-[18px] sm:text-[25px] font-['Orbitron'] bg-gradient-to-b from-[#edeffd] to-[#524d57] bg-clip-text text-transparent font-bold">
                Advancing Frontiers in Technology
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-[18px] sm:text-[22px] font-['Orbitron'] text-gray-300"
            >
              25<sup>th</sup> March 2k&apos;26
            </motion.p>

            {/* SHOW ONLY WHEN NOT LOGGED IN */}
            {!user && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 1.5 }}
                className="relative z-50 mt-12 bg-gradient-to-b from-purple-900/40 to-black/60 backdrop-blur-md border border-purple-500/50 p-8 rounded-2xl max-w-2xl mx-auto shadow-[0_0_40px_rgba(168,85,247,0.2)]"
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full shadow-lg border-4 border-black">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>

                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-200 mb-3 font-orbitron mt-4">
                  Unlock the Full Experience
                </h3>
                
                <p className="text-purple-200 mb-8 text-lg leading-relaxed">
                  Join hundreds of researchers and innovators. <br/>
                  <span className="text-white font-semibold">Log in</span> to explore exclusive Department Tracks, Keynote Sessions, and Paper Presentations.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-50">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="cursor-pointer group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] flex items-center justify-center gap-2"
                  >
                    <Rocket size={20} /> Register Now
                  </button>
                  
                  <button 
                    onClick={() => navigate('/login')}
                    className="cursor-pointer px-8 py-3 border border-purple-500/50 bg-purple-900/20 rounded-xl font-bold text-white hover:bg-purple-800/40 transition-colors flex items-center justify-center gap-2 hover:border-purple-400"
                  >
                    Login to Dashboard <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* STATS ALWAYS VISIBLE */}
          <div className="w-full max-w-[1200px] mx-auto mt-12 md:mt-16 px-4 relative z-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              <NumberCounter />
            </motion.div>
          </div>
        </div>

        {/* PRE-CONFERENCE WORKSHOP SECTION START */}
        <motion.section 
          className="relative mt-24 mb-10 z-10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4 relative z-10">
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-black/40 backdrop-blur-sm p-8 md:p-12">
              
              {/* Background Glows for this section */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-6xl font-iceland font-bold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent mb-4">
                  PRE-CONFERENCE WORKSHOP
                </h2>
                <h3 className="text-xl md:text-2xl font-orbitron text-purple-200">
                  International Conference on Deep Tech and Sustainable Engineering Solutions
                </h3>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="space-y-6 text-gray-300 text-lg leading-relaxed font-sans text-center">
                  <p>
                    As part of the International Conference on Deep Tech and Sustainable Engineering Solutions, 
                    our pre-conference workshop will provide an immersive experience, showcasing the latest advancements 
                    in technology, engineering, and sustainability. This hands-on event brings together experts, 
                    innovators, and industry leaders to explore the intersection of cutting-edge technologies 
                    and sustainable practices shaping the future of engineering.
                  </p>
                  <p>
                    Participants will engage in <strong>Wirecut EDM</strong> and <strong>Arduino & Code Programming</strong>, 
                    gaining practical skills in IoT and modern engineering. Experts will lead discussions on 
                    <strong> AR/XR in Design</strong>, <strong>AI for SaaS platforms</strong>, and preparing engineers 
                    for the evolving tech landscape. Join us for a transformative learning experience at the forefront 
                    of technology and sustainability.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </motion.section>
        {/* PRE-CONFERENCE WORKSHOP SECTION END */}
        
        <VisitorCounter />
        <ScrollingNews />
        <OnlineEvents />
        
        {/* ABOUT SECTION */}
        <motion.section className="relative mt-20 sm:mt-32 z-10">
          <div className="container mx-auto px-4 relative z-10">
            <About />
          </div>
        </motion.section>


        {/* CONFERENCE TRACKS - UPDATED GRID SECTION */}
        <motion.section className="relative mt-24 mb-24 z-10">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-7xl font-iceland font-bold bg-gradient-to-b from-[#e0aaff] to-[#5a189a] bg-clip-text text-transparent mb-2">
              CONFERENCE TRACKS
            </h1>
            <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-[#9d4edd] to-transparent mx-auto mt-4 mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mergedTrackData.map((track) => (
                <motion.div
                  key={track.id}
                  onClick={() => setSelectedTrack(track)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer relative overflow-hidden group rounded-2xl p-0.5 bg-gradient-to-b from-white/10 to-transparent hover:from-purple-500/50 hover:to-pink-500/50 transition-all duration-300"
                >
                  <div className="bg-black/80 backdrop-blur-md h-full rounded-2xl p-6 flex flex-col items-start text-left relative z-10">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${track.color} opacity-10 blur-2xl rounded-bl-full group-hover:opacity-30 transition-opacity`} />
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-orbitron font-bold mb-4 border bg-white/5 text-gray-300 border-white/20`}>
                      {track.dept} TRACK
                    </span>

                    <h3 className="text-xl font-bold font-sans mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all">
                      {track.title}
                    </h3>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                      {track.shortDesc}
                    </p>

                    <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                      View Event Details <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TRACK DETAIL MODAL */}
        <AnimatePresence>
          {selectedTrack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            >
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-md" 
                onClick={() => setSelectedTrack(null)} 
              />

              {/* Modal Content */}
              <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="relative w-full max-w-4xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden max-h-[85vh] flex flex-col"
              >
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${selectedTrack.color} relative overflow-hidden flex-shrink-0`}>
                  <div className="absolute inset-0 bg-black/40" />
                  <button 
                    onClick={() => setSelectedTrack(null)}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-20"
                  >
                    <X size={20} />
                  </button>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20">
                        {selectedTrack.dept}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white font-sans pr-8">{selectedTrack.title}</h2>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
                  
                  {/* Resource Persons Section - With Photo Placeholders */}
                  {selectedTrack.resourcePersons && (
                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="flex items-center gap-2 text-sm font-orbitron font-bold text-purple-300 uppercase tracking-wider mb-4">
                        <User size={16} /> Resource Persons
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTrack.resourcePersons.map((person, idx) => (
                          <div key={idx} className="flex items-start gap-4 bg-black/30 p-3 rounded-lg border border-white/5">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border border-white/10 flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                              {person.image ? (
                                <>
                                  <img
                                    src={person.image}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-full h-full hidden items-center justify-center text-sm font-bold text-white">
                                    {(person.name || 'RP').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                                  {(person.name || 'RP').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-base leading-tight">{person.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{person.designation}</p>
                              {person.linkedin && (
                                <a
                                  href={person.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                                >
                                  <Linkedin size={12} /> LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Left Column: Description */}
                    <div className="md:col-span-2 space-y-6">
                      <div>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3 font-orbitron">
                          <BookOpen size={18} className="text-blue-400" /> About the Workshop
                        </h3>
                        <div className="space-y-4 text-gray-300 text-sm leading-relaxed text-justify">
                          {selectedTrack.description.map((para, idx) => (
                            <p key={idx}>{para}</p>
                          ))}
                        </div>
                      </div>

                      {/* Objectives (if available) */}
                      {selectedTrack.objectives && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3 font-orbitron">
                            <Target size={18} className="text-red-400" /> Objectives
                          </h3>
                          <ul className="space-y-2">
                            {selectedTrack.objectives.map((obj, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-purple-500 mt-1">•</span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedTrack.outcomes && (
                        <div>
                          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3 font-orbitron">
                            <Check size={18} className="text-emerald-400" /> Outcomes
                          </h3>
                          <ul className="space-y-2">
                            {selectedTrack.outcomes.map((outcome, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="text-emerald-400 mt-1">•</span>
                                {outcome}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Topics */}
                    <div className="md:col-span-1">
                       {selectedTrack.topics && (
                        <div className="bg-white/5 rounded-xl p-5 border border-white/10 h-full">
                          <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 font-orbitron">
                            <List size={18} className="text-green-400" /> Topics
                          </h3>
                          <ul className="space-y-3">
                            {selectedTrack.topics.map((topic, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-gray-300 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0" />
                                <span className="leading-snug">{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
                
                {/* Footer / CTA */}
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedTrack(null)}
                    className="px-4 py-2 rounded-lg text-gray-400 text-sm font-bold hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTrack(null);
                      navigate(user ? '/dashboard' : '/signup');
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(219,39,119,0.4)] transition-all flex items-center gap-2"
                  >
                    Register Now <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        <motion.section className="relative z-10">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-7xl font-iceland font-bold bg-gradient-to-b from-[#FF0080] to-[#7928CA] bg-clip-text text-transparent mb-2">
              REGISTRATION FEES
            </h1>
            <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-[#FF0080] to-transparent mx-auto mt-4 mb-8" />
            <PricingCards />
          </div>
        </motion.section>

        <div className="relative z-10 pb-0">
          <div className="relative">
            <motion.h1 className="relative mx-auto text-center font-iceland font-bold text-[35px] md:text-[55px] py-[35px] text-white">
              REGISTRATION DEADLINE
            </motion.h1>
            <div className="w-full md:w-3/5 mx-auto pb-8">
              <CountDown />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default Home;
