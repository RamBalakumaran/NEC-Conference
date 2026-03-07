import React, { useState, useEffect } from 'react';
import { useConference } from '../context/ConferenceContext';
import { Navbar } from '../components/Navbar/Navbar';
import { useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, Clock, Calendar, X, Sparkles, User, BookOpen, List, ArrowRight, MapPin, Globe, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Particle from '../components/Particle'; 

const profileImage = (fileName) => `${import.meta.env.BASE_URL}Resource%20Person/${encodeURIComponent(fileName)}`;
const preloadImage = (src) => {
  if (!src) return;
  const img = new Image();
  img.src = src;
};

// --- 1. PRE-CONFERENCE WORKSHOP DATA (MARCH 25) ---
const workshopData = [
  {
    id: "eee-1",
    dept: "EEE",
    title: "Embedded Systems using Arduino & ESP32",
    shortDesc: "Hands-on workshop on embedded systems and IoT development.",
    color: "from-yellow-400 to-orange-500",
    date: "March 25, 2026",
    time: "09:00 AM - 11:00 AM",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T11:00:00",
    resourcePersons: [
      { name: "Dr. B. Venkatasamy", designation: "AP(SG)/EEE", image: profileImage("Dr.B.Venkatasamy.webp"), linkedin: "" },
      { name: "Mr. F. Antony Jeffrey Vaz", designation: "AP/EEE", image: profileImage("Mr.F.Antony Jeffrey Vaz.webp"), linkedin: "" }
    ],
    description: [
      "This one-day hands-on workshop provides practical exposure to embedded systems and IoT development using Arduino and ESP32.",
      "Participants learn microcontroller architecture, real-time interfacing, and implementation of automation and robotics use cases."
    ],
    topics: [
      "Introduction to Arduino and ESP32 boards",
      "Arduino IDE setup and programming basics",
      "Digital and analog I/O interfacing",
      "LCD and sensor interfacing with ESP32",
      "Bluetooth communication with app development",
      "RC robotic car interfacing and control"
    ]
  },
  {
    id: "eee-2",
    dept: "EEE",
    title: "EV Technology and Battery Management Systems",
    shortDesc: "LFP cells, battery pack design, and BMS interfacing.",
    color: "from-yellow-500 to-amber-600",
    date: "March 25, 2026",
    time: "11:15 AM - 01:15 PM",
    start: "2026-03-25T11:15:00",
    end: "2026-03-25T13:15:00",
    resourcePersons: [
      { name: "Mr. Sreeraj", designation: "Director - Technical and Operations, EmCog Solutions Pvt. Ltd., Chennai", image: profileImage("Mr.Sreeraj.webp"), linkedin: "https://www.linkedin.com/in/s-v-sreeraj-8195371a7" }
    ],
    description: [
      "A structured and practical workshop on EV technology, LFP cell characteristics, battery pack design, and Battery Management System interfacing.",
      "Sessions include cell balancing strategies and State of Charge estimation methods with application-oriented coverage."
    ],
    topics: [
      "Introduction and trends in EV technology",
      "LFP cell fundamentals and datasheet analysis",
      "Battery pack series-parallel design and energy calculation",
      "BMS architecture, protection, and interfacing",
      "Passive and active cell balancing",
      "SoC estimation: OCV and Coulomb counting"
    ]
  },
  {
    id: "mech-1",
    dept: "MECHANICAL",
    title: "Digital Fabrication 4.0: Smart Manufacturing",
    shortDesc: "Data-driven manufacturing workflow aligned with Industry 4.0.",
    color: "from-red-500 to-rose-600",
    date: "March 14, 2026",
    time: "09:30 AM - 11:00 AM",
    start: "2026-03-14T09:30:00",
    end: "2026-03-14T11:00:00",
    resourcePersons: [
      { name: "Dr. K. Thoufiq Mohammed", designation: "Additive Manufacturing Expert", image: profileImage("Dr.K.Thoufiq Mohammed.webp"), linkedin: "https://www.linkedin.com/in/dr-k-thoufiq-mohammed-1207b1156" }
    ],
    description: [
      "An integrated, data-driven workshop on the digital thread from design to production in smart manufacturing.",
      "Includes guided practical work in CAD preparation, slicing, build execution, post-processing, and rapid inspection."
    ],
    topics: ["Design for additive manufacturing", "Process parameterization", "FDM and DLP workflow", "Production data capture", "Smart factory analytics"],
    venue: "CAD Lab - Mechanical Engineering Department"
  },
  {
    id: "mech-2",
    dept: "MECHANICAL",
    title: "CAD to Cut: Wirecut EDM Workshop",
    shortDesc: "Bridge the gap between digital design and precision manufacturing.",
    color: "from-red-400 to-orange-500",
    date: "March 14, 2026",
    time: "02:00 PM - 03:30 PM",
    start: "2026-03-14T14:00:00",
    end: "2026-03-14T15:30:00",
    
    resourcePersons: [
      { name: "Dr. I. Sankar", designation: "Precision Engineering Expert", image: profileImage("Dr.I.Sankar.webp"), linkedin: "https://www.linkedin.com/in/dr-i-sankar-4496a7134" }
    ],
    description: [
      "Hands-on technical training to convert CAD profiles into machine-ready programs for Wirecut EDM.",
      "Covers machine setup, parameter selection, and accurate cutting of conductive materials."
    ],
    topics: ["Wire EDM working principle", "CAD profile creation", "Machine setup and parameters", "Programming workflow", "High-precision cutting"],
    venue: "Workshop - Mechanical Engineering Department"
  },
  {
    id: "mech-3",
    dept: "MECHANICAL",
    title: "Application of VR and XR in Mechanical Engineering Design",
    shortDesc: "Immersive technologies for design, simulation, and collaboration.",
    color: "from-red-600 to-pink-600",
    date: "March 25, 2026",
    time: "09:00 AM - 11:00 AM",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T11:00:00",
    resourcePersons: [
      { name: "Dr. M. Vivekanandan", designation: "Immersive Technology Expert", image: profileImage("Dr.M.Vivekanandan.webp"), linkedin: "https://www.linkedin.com/in/dr-m-vivekanandan-a714504b" }
    ],
    description: [
      "Workshop on how VR/XR transforms product design, virtual prototyping, assembly planning, and maintenance training.",
      "Demonstrates integration with CAD for interactive 3D models, virtual testing, and collaborative engineering."
    ],
    topics: ["VR/XR fundamentals", "CAD integration", "Virtual prototyping", "Ergonomic analysis", "Industry use cases in automotive/aerospace"]
  },
  {
    id: "civil-1",
    dept: "CIVIL",
    title: "Next-Gen Construction Planning 3.0",
    shortDesc: "PlanSwift-driven estimation and TILOS-based linear scheduling.",
    color: "from-orange-400 to-amber-500",
    date: "March 25, 2026",
    time: "11:15 AM - 01:15 PM",
    start: "2026-03-25T11:15:00",
    end: "2026-03-25T13:15:00",
    resourcePersons: [{ name: "Planning Engineer", designation: "Infrastructure Planning Specialist", image: profileImage("Mr.Gagarin guru.webp"), linkedin: "" }],
    description: [
      "Industry-oriented workshop on modern construction planning tools for highways, railways, metros, and pipelines.",
      "Shows how estimation and linear scheduling can be aligned to improve bidding accuracy and project control."
    ],
    topics: ["PlanSwift digital take-off", "Automated BOQ preparation", "TILOS time-distance diagrams", "Linear project planning", "Cost-time integration"]
  },
  {
    id: "civil-2",
    dept: "CIVIL",
    title: "Sustainable Solutions for Potable Water",
    shortDesc: "Laboratory testing and sustainable usage assessment.",
    color: "from-orange-300 to-yellow-500",
    date: "March 25, 2026",
    time: "01:30 PM - 03:30 PM",
    start: "2026-03-25T13:30:00",
    end: "2026-03-25T15:30:00",
    resourcePersons: [{ name: "Dr. Gagarin Guru", designation: "Environmental and Water Resources Expert", image: profileImage("Mr.Gagarin guru.webp"), linkedin: "https://www.linkedin.com/in/gagarin-guru-5125ab53/" }],
    description: [
      "Focuses on potable water safety through physical, chemical, and microbiological analysis using standardized kits and methods.",
      "Covers sustainable monitoring, leak detection, treatment efficiency, and compliance with IS 10500 and WHO guidance."
    ],
    topics: ["Water quality parameters", "IS 10500 standards", "Microbial testing basics", "Consumption and leak monitoring", "Sustainable potable water management"]
  },
  {
    id: "it-1",
    dept: "IT",
    title: "Predictive Analytics for Sustainable and Intelligent Systems",
    shortDesc: "Data-driven forecasting and decision support.",
    color: "from-blue-400 to-cyan-400",
    date: "March 25, 2026",
    time: "03:45 PM - 05:45 PM",
    start: "2026-03-25T15:45:00",
    end: "2026-03-25T17:45:00",
    resourcePersons: [
      { name: "Ms. Anitha V", designation: "Data Analytics Expert", image: profileImage("Ms.V.Anitha.webp"), linkedin: "https://www.linkedin.com/in/anitha-v-?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
      { name: "Ms. Santhi Sankarappan", designation: "Intelligent Systems Expert", image: profileImage("Ms.S.Santhi.webp"), linkedin: "https://www.linkedin.com/in/santhi-sankarappan?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "Introduces predictive analytics for sustainable and intelligent systems across energy, climate, agriculture, and smart infrastructure.",
      "Includes model design, evaluation, explainability, and ethical AI for data-rich environments."
    ],
    topics: ["Predictive analytics foundations", "Data pipelines and preprocessing", "Forecasting methods", "Sustainability use cases", "Model explainability"]
  },
  {
    id: "it-2",
    dept: "IT",
    title: "Predictive Analytics Using Machine Learning in IoT",
    shortDesc: "Forecast future events using real-time IoT sensor data.",
    color: "from-blue-500 to-indigo-500",
    date: "March 25, 2026",
    time: "09:00 AM - 11:00 AM",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T11:00:00",
    resourcePersons: [{ name: "Dr. Dinesh Raj", designation: "IoT and ML Specialist", image: profileImage("Dr.Dinesh Raj.webp"), linkedin: "https://www.linkedin.com/in/dr-dinesh-raj-5aa7676a?utm_source=share_via&utm_content=profile&utm_medium=member_android" }],
    description: [
      "An introductory and practical workshop on using machine learning for prediction in IoT systems.",
      "Covers real-time sensor data workflows and applications in smart homes, healthcare, agriculture, and smart cities."
    ],
    topics: ["IoT architecture", "Data preprocessing", "ML model basics", "Python and Scikit-learn", "Predictive maintenance and energy forecasting"]
  },
  {
    id: "ece-1",
    dept: "ECE",
    title: "From Arrays to Intelligence: Evolving Antenna Technologies",
    shortDesc: "Massive MIMO, RIS, and beyond for future wireless systems.",
    color: "from-green-400 to-emerald-600",
    date: "March 25, 2026",
    time: "11:15 AM - 01:15 PM",
    start: "2026-03-25T11:15:00",
    end: "2026-03-25T13:15:00",
    resourcePersons: [{ name: "Dr.V.lingasamy ME,PhD,Msc Yoga", designation: "Open RAN Standardization Engineer", image: profileImage("Mr.Sreeraj.webp"), linkedin: "" }],
    description: [
      "Covers the evolution of antenna arrays from phased arrays and smart antennas to MIMO and Massive MIMO.",
      "Introduces Reconfigurable Intelligent Surfaces as a key enabler for future 6G networks."
    ],
    topics: ["Array factor and beam steering", "Interference suppression", "MIMO and Massive MIMO", "RIS fundamentals", "5G/6G applications"]
  },
    {
      id: "ece-2",
      dept: "ECE",
      title: "Emerging Trends in Semiconductors & Embedded Systems",
      shortDesc: "High-performance, energy-efficient systems for defense and aerospace applications.",
      color: "from-green-600 to-cyan-600",
      date: "March 25, 2026",
      time: "03:45 PM - 05:45 PM",
      start: "2026-03-25T15:45:00",
      end: "2026-03-25T17:45:00",
      resourcePersons: [{ name: "Mr. Raja Subramanian", designation: "Leadership in Semiconductor Innovation and Mission-Critical Deployment, Mistral Solutions (an AXISCADES Technologies Company)", image: profileImage("Mr.Raja Subramanian.webp"), linkedin: "https://www.linkedin.com/in/raja-subramanian-1390479?utm_source=share_via&utm_content=profile&utm_medium=member_android" }],
      description: [
        "The semiconductor industry is undergoing transformative advancements that are significantly influencing next-generation defense and aerospace technologies. Modern semiconductor shifts focus on delivering high-performance, energy-efficient, and highly reliable systems capable of operating under extreme environmental conditions such as radiation exposure and temperature variations. Advanced fabrication techniques, innovative packaging methods, and secure chip architectures are enabling compact, durable, and mission-critical electronic systems for applications including radar, avionics, satellite communication, and autonomous defense platforms.",
        "A major milestone in this evolution is the transition to 2nm technology and beyond, representing a new era of semiconductor miniaturization. This advancement enables higher transistor density, faster processing speeds, and improved power efficiency, while also introducing challenges related to fabrication complexity and quantum-level effects. To address these challenges, innovative transistor architectures such as Gate-All-Around (GAA) structures are being implemented, paving the way for ultra-compact and high-speed processors suitable for advanced computing and embedded systems.",
        "Simultaneously, the evolution of System-on-Chip (SoC) architecture has revolutionized electronic system integration by combining processors, memory, communication interfaces, and specialized accelerators onto a single silicon platform. This integration reduces system size, lowers power consumption, and enhances operational efficiency across multiple industries. Furthermore, the incorporation of on-chip Artificial Intelligence accelerators, known as Neural Processing Units (NPUs), enables real-time data processing and intelligent decision-making at the edge. Collectively, these advancements are driving the development of smarter, faster, and more autonomous electronic systems for future technological applications."
      ],
      topics: ["Semiconductor advancements for defense and aerospace", "Extreme environmental operating conditions and reliability", "Advanced fabrication techniques and innovative packaging", "2nm technology and miniaturization trends", "Gate-All-Around (GAA) transistor architectures", "System-on-Chip (SoC) integration and design", "Neural Processing Units (NPUs) and edge AI", "Mission-critical applications in radar, avionics, and satellites", "Power efficiency and thermal management in embedded systems"],
      speakerBio: "Raja Subramanian brings 27 years of specialized experience to his leadership role at Mistral Solutions (an AXISCADES Technologies Company). He has been a pivotal force in the \"Chip-to-Product\" journey for dozens of high-stakes projects, from complex hardware board design to sophisticated embedded software stacks. His expertise makes him a leading voice for engineers and stakeholders navigating the intersection of semiconductor innovation and mission-critical deployment."
    },
  {
    id: "cse-1",
    dept: "CSE",
    title: "Quantum Computing: From Qubits to Contemporary Applications (Virtual Session)",
    shortDesc: "Quantum foundations, technologies, and practical applications.",
    color: "from-purple-500 to-indigo-500",
    date: "March 25, 2026",
    time: "03:45 PM - 05:45 PM",
    start: "2026-03-25T15:45:00",
    end: "2026-03-25T17:45:00",
    resourcePersons: [{ name: "Dr. Krishnamoorthy Dinesh", designation: "Assistant Professor, IIT Palakkad", image: profileImage("Dr.Krishnamoorthy Dinesh.webp"), linkedin: "https://www.linkedin.com/in/dinesh-krishnamoorthy-21bb641b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }],
    description: [
      "Structured introduction to quantum computing from bits to qubits, quantum gates, and modern frameworks.",
      "Discusses practical applications in secure communication, optimization, simulation, and advanced analytics."
    ],
    topics: ["Superposition and entanglement", "Quantum circuits", "Quantum programming foundations", "Applications and limitations"]
  },
  {
    id: "cse-2",
    dept: "CSE",
    title: "AI in Earth Observation: Deep Learning and Geospatial Intelligence",
    shortDesc: "Automated analysis of large-scale satellite and remote sensing data.",
    color: "from-purple-400 to-fuchsia-500",
    date: "March 25, 2026",
    time: "09:00 AM - 11:00 AM",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T11:00:00",
    resourcePersons: [{ name: "Dr. Kandasamy S", designation: "Geospatial AI Expert", image: profileImage("Mr.Vignesh Kandasamy.webp"), linkedin: "https://www.linkedin.com/in/kandasamy-s-98149057?utm_source=share_via&utm_content=profile&utm_medium=member_android" }],
    description: [
      "Shows how AI transforms Earth Observation with faster and more accurate analysis of geospatial data.",
      "Includes practical exposure to CNN-based object classification from satellite imagery."
    ],
    topics: ["Deep learning for EO", "CNN object classification", "Geospatial intelligence workflows", "Real-world applications"]
  },
  {
    id: "cse-3",
    dept: "CSE",
    title: "AR Unlocked: Creating Immersive Experiences with Vuforia and Unity",
    shortDesc: "Hands-on AR development from tracking to Android deployment.",
    color: "from-purple-600 to-violet-600",
    date: "March 25, 2026",
    time: "11:15 AM - 01:15 PM",
    start: "2026-03-25T11:15:00",
    end: "2026-03-25T13:15:00",
    resourcePersons: [{ name: "Mr. Karthikeyan", designation: "AR/XR Developer", image: profileImage("Mr.J.Karthikeyan.webp"), linkedin: "https://www.linkedin.com/in/karthikeyanmecse?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }],
    description: [
      "Beginner-friendly AR workshop covering core concepts and practical Unity + Vuforia integration.",
      "Participants build real-time AR applications with image targets and camera tracking."
    ],
    topics: ["AR fundamentals", "Vuforia setup", "Image targets", "3D object interaction", "Android build and deployment"]
  },
  {
    id: "aids-1",
    dept: "AI & DS",
    title: "n8n: AI-Driven Visual Workflow Automation",
    shortDesc: "Build practical AI-powered automations without heavy coding.",
    color: "from-pink-600 to-purple-600",
    date: "March 25, 2026",
    time: "01:30 PM - 03:30 PM",
    start: "2026-03-25T13:30:00",
    end: "2026-03-25T15:30:00",
    resourcePersons: [{ name: "Mr. Mahadevan B", designation: "Automation Architect", image: profileImage("Mr.B.Mahadevan.webp"), linkedin: "https://www.linkedin.com/in/mahadevan-b-5b617622?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }],
    description: [
      "Introduces n8n for visual workflow automation with API integrations and AI services.",
      "Also discusses real deployment challenges for AI agents in SaaS: reliability, security, privacy, cost, and trust."
    ],
    topics: ["n8n workflows", "API and database integration", "LLM-enabled automation", "AI agents in SaaS", "Production reliability"]
  },
  {
    id: "aids-2",
    dept: "AI & DS",
    title: "Innovative IoT Design Using Advanced Intelligent Simulation Tools",
    shortDesc: "Design and test IoT systems virtually before deployment.",
    color: "from-pink-500 to-rose-500",
    date: "March 25, 2026",
    time: "03:45 PM - 05:45 PM",
    start: "2026-03-25T15:45:00",
    end: "2026-03-25T17:45:00",
    resourcePersons: [{ name: "Dr. Naskath Jahangeer", designation: "IoT Simulation Expert", image: profileImage("Dr.J.Naskath.webp"), linkedin: "https://www.linkedin.com/in/naskath-jahangeer-31a3b6280?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }],
    description: [
      "Covers virtual prototyping of IoT systems including sensors, communication networks, and intelligent decision modules.",
      "Emphasizes early design validation, optimization, and reduced development cost."
    ],
    topics: ["IoT architecture", "Network simulation", "Performance and delay analysis", "Power consumption modeling", "AI integration in simulations"]
  },
  {
    id: "sh-1",
    dept: "S&H",
    title: "Mathematics in the Age of AI",
    shortDesc: "Mathematics as the structural backbone of modern AI.",
    color: "from-pink-500 to-rose-400",
    date: "March 25, 2026",
    time: "09:00 AM - 11:00 AM",
    start: "2026-03-25T09:00:00",
    end: "2026-03-25T11:00:00",
    resourcePersons: [{ name: "Dr. Panchatcharam Mariappan", designation: "Mathematics and AI Foundations", image: profileImage("Mr.Panchatcharam Mariappan.webp"), linkedin: "https://www.linkedin.com/in/panchatcharam-mariappan-a2846587" }],
    description: [
      "This session explains the foundational role of mathematics in AI: linear algebra, probability, statistics, and calculus.",
      "Participants gain perspective on building reliable, interpretable, and innovative intelligent systems."
    ],
    topics: ["Linear algebra in neural networks", "Probability under uncertainty", "Statistical validation", "Gradient-based optimization"]
  },
  {
    id: "sh-2",
    dept: "S&H",
    title: "AI for Sustainable Careers: Vibe Coding and Interview Readiness",
    shortDesc: "AI-powered placements, resumes, projects, and interview preparation.",
    color: "from-pink-400 to-fuchsia-400",
    date: "March 25, 2026",
    time: "11:15 AM - 01:15 PM",
    start: "2026-03-25T11:15:00",
    end: "2026-03-25T13:15:00",
    resourcePersons: [{ name: "Mr. Murali", designation: "Career Coach and Placement Mentor", image: profileImage("Mr.Murali Dharan Rajasekar.webp"), linkedin: "https://www.linkedin.com/in/connectmurali?utm_source=share_via&utm_content=profile&utm_medium=member_android" }],
    description: [
      "Hands-on session on using AI for placement preparation, resume optimization, and interview readiness.",
      "Shows how vibe coding can help students build practical showcase projects with minimal traditional coding."
    ],
    topics: ["AI placement workflows", "ATS resume optimization", "AI mock interviews", "Vibe coding for project building", "Future skill stacks"]
  }
];

// --- 2. MAIN CONFERENCE DATA (MARCH 26 & 27) ---
const mainConferenceData = {
  id: "icodses-2026",
  dept: "MAIN CONFERENCE",
  title: "ICoDSES-2026: International Conference on Deep Tech and Sustainable Engineering Solutions",
  shortDesc: "Innovating for a Sustainable Future: Bridging Deep Tech and Environmental Impact.",
  color: "from-amber-500 to-orange-600",
  date: "March 26 & 27, 2026",
  time: "09:00 AM - 05:00 PM",
  start: "2026-03-26T09:00:00",
  end: "2026-03-27T17:00:00",
  price: 1500,
  mode: "Hybrid",
  location: "National Engineering College, K.R. Nagar, Kovilpatti - 628503",
  contact: "icodses2026@nec.edu.in",
  
  description: [
    "The International Conference on Deep Tech and Sustainable Engineering Solutions (ICoDSES-2026) is set to be a hub of expertise, knowledge sharing, and collaboration.",
    "This peer-reviewed conference will focus on the critically important theme: Innovating for a Sustainable Future: Bridging Deep Tech and Environmental Impact.",
    "The core objective is to foster a comprehensive dialogue between researchers, industry leaders, and policymakers. ICoDSES-2026 will spotlight how deep technologies – including AI, robotics, blockchain, and advanced materials – are harnessed to create sustainable solutions.",
    "The review status of the submitted manuscripts was duly communicated to the authors on 10.02.2026."
  ],
  committee: [
    { role: "CHIEF PATRON", name: "Dr. S. Shanmugavel", title: "Director, NEC" },
    { role: "PATRON", name: "Dr. K. Kalidasa Murugavel", title: "Principal, NEC" },
    { role: "CHAIRMAN", name: "Tmt. Chennammal Ramasamy", title: "" },
    { role: "VICE CHAIRMAN", name: "Thiru. K.R. Krishnamoorthy", title: "" },
    { role: "CORRESPONDENT", name: "Thiru K. R. Arunachalam", title: "" }
  ],
  topics: [
    "Deep Tech & Sustainability", 
    "AI & Robotics in Environment", 
    "Green Energy Solutions",
    "Ethical Technology Deployment"
  ]
};

const detailedWorkshopOverrides = {
  "eee-2": {
    resourcePersons: [
      {
        name: "Mr. Sreeraj",
        designation: "Director - Technical and Operations, EmCog Solutions Pvt. Ltd., Chennai",
        image: profileImage("Mr.Sreeraj.webp"),
        linkedin: "https://www.linkedin.com/in/s-v-sreeraj-8195371a7?utm_source=share_via&utm_content=profile&utm_medium=member_android"
      }
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
    ],
    topics: [
      "Introduction to Arduino and ESP32 development boards",
      "Arduino IDE setup and programming basics",
      "Digital input-output interfacing",
      "Analog input-output interfacing",
      "LCD display interfacing",
      "Sensor interfacing with ESP32",
      "Bluetooth communication with app development",
      "RC robotic car interfacing and control"
    ],
    outcomes: [
      "Build basic embedded applications independently.",
      "Understand Arduino and ESP32 applications in IoT, automation, and robotics."
    ]
  },
  "mech-1": {
    resourcePersons: [
      { name: "Dr. I. Sankar", designation: "Precision Engineering Expert", image: profileImage("Dr.I.Sankar.webp"), linkedin: "https://www.linkedin.com/in/dr-i-sankar-4496a7134?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "Digital Fabrication 4.0 is presented as an integrated, data-driven manufacturing workflow aligned with Industry 4.0.",
      "The session combines concise lectures and live demonstrations with professional FDM and DLP systems to show the digital thread from design to production.",
      "Participants practice CAD preparation, slicing, build execution, post-processing, rapid inspection, and analytics-backed decision making."
    ]
  },
  "mech-2": {
    
    resourcePersons: [
      { name: "Dr. K. Thoufiq Mohammed", designation: "Additive Manufacturing Expert", image: profileImage("Dr.K.Thoufiq Mohammed.webp"), linkedin: "https://www.linkedin.com/in/dr-k-thoufiq-mohammed-1207b1156?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "CAD to Cut: Wirecut EDM Workshop is a hands-on training program that bridges digital design and precision manufacturing.",
      "Participants learn profile creation with CAD, Wire EDM principles, machine setup, parameter selection, and conversion of 2D drawings into machine-ready formats.",
      "The workshop emphasizes accurate cutting and real-world exposure relevant to tool and die, aerospace, automotive, and precision engineering industries."
    ]
  },
  "mech-3": {
    resourcePersons: [
      { name: "Dr. M. Vivekanandan", designation: "Immersive Technology Expert", image: profileImage("Dr.M.Vivekanandan.webp"), linkedin: "https://www.linkedin.com/in/dr-m-vivekanandan-a714504b?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "Application of VR and XR in Mechanical Engineering Design introduces immersive technologies in product design, prototyping, simulation, assembly planning, ergonomic analysis, and maintenance training.",
      "It demonstrates integration of VR/XR with CAD for interactive 3D models, virtual testing, and collaborative engineering across remote teams.",
      "Industry applications across automotive, aerospace, and manufacturing are highlighted for cost reduction, faster cycles, and improved safety."
    ]
  },
  "civil-1": {
    resourcePersons: [
      { name: "Thiruvikraman Aanandha kumar", designation: "Professional Service Consultant | IPMCS", image: profileImage("Mr.Thiruvikraman Aanandha kumar.webp"), linkedin: "https://www.linkedin.com/in/thiruvikraman-aanandha-kumar-7b2288398/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BTRcd%2BGN1TSKx9JxZ9rgsIA%3D%3D" }
    ],
    description: [
      "Next-Gen Construction Planning 3.0 is an industry-focused seminar designed to introduce students and professionals to modern digital construction planning practices.",
      "The session explores how PlanSwift enhances accuracy and speed in quantity take-off and cost estimation through digital measurement and automated BOQ preparation. It further demonstrates how TILOS enables effective linear project planning using time–distance diagrams, making it ideal for infrastructure projects such as highways, railways, and pipelines.",
      "By integrating estimation and linear scheduling, this seminar highlights how cost and time can be strategically aligned to improve bidding accuracy, project control, and overall profitability. Participants will gain insights into real-world workflows, industry applications, and the evolving trends shaping Construction Planning 3.0."
    ],
    topics: [
      "PlanSwift digital measurement and quantity take-off",
      "Automated BOQ preparation",
      "TILOS-based linear scheduling",
      "Time-distance diagrams for infrastructure projects",
      "Cost-time integration for improved project control",
      "Real-world applications in highways, railways, metros, and pipelines",
      "Bidding accuracy and profitability enhancement"
    ]
  },
  "civil-2": {
    resourcePersons: [
      { name: "Dr. Gagarin Guru", designation: "Environmental and Water Resources Expert", image: profileImage("Mr.Gagarin guru.webp"), linkedin: "https://www.linkedin.com/in/gagarin-guru-5125ab53/" }
    ],
    description: [
      "Sustainable solutions for potable water include regular laboratory testing and efficient usage assessment for long-term resource management.",
      "Laboratory analysis covers physical, chemical, and microbiological parameters such as pH, turbidity, TDS, hardness, dissolved oxygen, nitrates, chlorides, and coliform contamination.",
      "The session references WHO guidance and BIS IS 10500 standards, and emphasizes leak detection, treatment efficiency, and responsible water-use practices."
    ]
  },
  "sh-1": {
    resourcePersons: [
      { name: "Dr. Panchatcharam Mariappan", designation: "Mathematics and AI Foundations", image: profileImage("Mr.Panchatcharam Mariappan.webp"), linkedin: "https://www.linkedin.com/in/panchatcharam-mariappan-a2846587" }
    ],
    description: [
      "AI is often seen as data and computing power, but its foundations are deeply mathematical.",
      "This lecture explains data as fuel, linear algebra as the engine, probability as steering under uncertainty, statistics as reliability assurance, and calculus as optimization navigation.",
      "Participants gain a strong foundation on why mathematics is essential for reliable, interpretable, and innovative AI systems."
    ]
  },
  "sh-2": {
    resourcePersons: [
      { name: "Mr. Murali", designation: "Career Coach and Placement Mentor", image: profileImage("Mr.Murali Dharan Rajasekar.webp"), linkedin: "https://www.linkedin.com/in/connectmurali?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "This immersive hands-on session shows how AI reshapes placements, resumes, interviews, and application development.",
      "Students learn AI-powered resume optimization, vibe coding for real projects, and interview readiness aligned with current hiring expectations.",
      "The session also covers future-ready career planning, emerging roles, required skill stacks, and practical ways to use AI as a career accelerator."
    ]
  },
  "it-1": {
    title: "Predictive Analytics for Sustainable and Intelligent Systems",
    resourcePersons: [
      { name: "Ms. Anitha V", designation: "Data Analytics Expert", image: profileImage("Ms.V.Anitha.webp"), linkedin: "https://www.linkedin.com/in/anitha-v-?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
      { name: "Ms. Santhi Sankarappan", designation: "Intelligent Systems Expert", image: profileImage("Ms.S.Santhi.webp"), linkedin: "https://www.linkedin.com/in/santhi-sankarappan?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "This workshop introduces predictive analytics practices for sustainable and intelligent systems in energy, climate, agriculture, and urban infrastructure.",
      "It combines conceptual foundations, modeling methods, case studies, and explainable AI principles for data-rich decision systems.",
      "Participants learn how to design, evaluate, and interpret forecasting models for real engineering applications."
    ],
    topics: [
      "Foundations of predictive analytics in sustainable systems",
      "Data pipelines and preprocessing strategies",
      "Forecasting and predictive modeling methods",
      "Sustainability applications and intelligent system integration",
      "Model evaluation, validation, and explainability",
      "Case study: energy load forecasting",
      "Hands-on session"
    ]
  },
  "it-2": {
    resourcePersons: [
      { name: "Dr. Dinesh Raj", designation: "IoT and ML Specialist", image: profileImage("Dr.Dinesh Raj.webp"), linkedin: "https://www.linkedin.com/in/dr-dinesh-raj-5aa7676a?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "Predictive Analytics Using ML in IoT introduces how intelligent systems forecast events from real-time sensor data.",
      "Participants learn foundational IoT architecture, data preprocessing, and ML model basics using Python and Scikit-learn.",
      "Applications include predictive maintenance, energy consumption, health risk analysis, and traffic forecasting."
    ]
  },
  "cse-1": {
    title: "Quantum Computing: From Qubits to Contemporary Applications (Virtual Session)",
    resourcePersons: [
      { name: "Dr. Krishnamoorthy Dinesh", designation: "Assistant Professor, IIT Palakkad", image: profileImage("Dr.Krishnamoorthy Dinesh.webp"), linkedin: "https://www.linkedin.com/in/dinesh-krishnamoorthy-21bb641b?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
    ],
    description: [
      "This session introduces the evolution from classical bits to qubits and how quantum gates and circuits power quantum computation.",
      "It connects core quantum concepts with contemporary technologies, practical applications, current limitations, and research directions.",
      "Participants gain perspective on opportunities in secure communication, simulation, optimization, and data analysis in the quantum era."
    ]
  },
  "cse-2": {
    title: "AI in Earth Observation (EO): Deep Learning and Geospatial Intelligence",
    resourcePersons: [
      { name: "Dr. Kandasamy S", designation: "Geospatial AI Expert", image: profileImage("Mr.Vignesh Kandasamy.webp"), linkedin: "https://www.linkedin.com/in/kandasamy-s-98149057?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
    ],
    description: [
      "This topic highlights how AI enables automated, accurate, and scalable analysis of satellite and remote sensing data.",
      "It covers applications in environmental monitoring, urban planning, agriculture, disaster management, and climate studies.",
      "Participants also explore CNN-based object classification with practical exposure to geospatial intelligence workflows."
    ]
  },
  "cse-3": {
    title: "AR Unlocked: Creating Immersive Experiences with Vuforia & Unity",
    resourcePersons: [
      { name: "Mr. Karthikeyan", designation: "AR/XR Developer", image: profileImage("Mr.J.Karthikeyan.webp"), linkedin: "https://www.linkedin.com/in/karthikeyanmecse?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" }
    ],
    description: [
      "This hands-on workshop introduces Augmented Reality fundamentals and practical app development using Unity with Vuforia.",
      "Participants build real-time AR experiences using image targets, markers, camera tracking, and deploy to Android devices."
    ],
    objectives: [
      "Understand core AR concepts and tracking methods.",
      "Set up Vuforia with Unity.",
      "Create and configure image targets.",
      "Place and animate 3D objects in AR.",
      "Build and deploy AR apps to Android."
    ]
  },
  "aids-1": {
    resourcePersons: [
      { name: "Mr. Mahadevan B", designation: "Automation Architect", image: profileImage("Mr.B.Mahadevan.webp"), linkedin: "https://www.linkedin.com/in/mahadevan-b-5b617622?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }
    ],
    description: [
      "This workshop introduces n8n, a node-based automation platform for visual workflow design without heavy coding.",
      "Participants learn API integration, repetitive task automation, and practical AI-enabled pipelines for real use cases.",
      "It also examines challenges in emerging AI agents for SaaS including reliability, security, privacy, cost, and user trust."
    ],
    outcomes: [
      "Understand visual workflow automation fundamentals.",
      "Build AI-powered automation pipelines.",
      "Integrate APIs, databases, and AI tools.",
      "Deploy practical automation use cases."
    ]
  },
  "aids-2": {
    title: "Innovative IoT Design Using Advanced Intelligent Simulation Tools",
    resourcePersons: [
      { name: "Dr. Naskath Jahangeer", designation: "IoT Simulation Expert", image: profileImage("Dr.J.Naskath.webp"), linkedin: "https://www.linkedin.com/in/naskath-jahangeer-31a3b6280?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" }
    ],
    description: [
      "This workshop focuses on designing and testing IoT systems using intelligent simulation before real deployment.",
      "Participants model sensors, communication networks, and smart decision systems to evaluate performance and reliability.",
      "The session emphasizes reduced development cost, early defect detection, and faster optimization through virtual prototyping."
    ],
    outcomes: [
      "Understand IoT architecture from sensors to analytics.",
      "Design and simulate IoT networks before hardware implementation.",
      "Evaluate power usage, delays, and reliability.",
      "Integrate AI models in simulation workflows.",
      "Reduce cost and development time via virtual prototyping."
    ]
  },
  "ece-1": {
    title: "From Arrays to Intelligence: Evolving Antenna Technologies - Massive MIMO, RIS, and Beyond",
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
    ]
    },
    "ece-2": {
      title: "Emerging Trends in Semiconductors & Embedded Systems",
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
  }
};

const AllTracks = () => {
  const { user, cart, addToCart } = useConference();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState('success');
  const closeModal = () => setSelectedEvent(null);

  // 1. Process Workshop Data with specific Date/Time for Logic
const formattedWorkshops = workshopData.map(track => ({
  ...track,
  ...(detailedWorkshopOverrides[track.id] || {}),
  price: 300
}));

  // ✅ SCROLL LOCK
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden'; 
      document.body.classList.add('alltracks-modal-open');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('alltracks-modal-open');
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('alltracks-modal-open');
    };
  }, [selectedEvent]);

  useEffect(() => {
    // Preload speaker avatars so modal opens without waiting for image fetch.
    const avatarUrls = Array.from(
      new Set(
        workshopData.flatMap((event) =>
          (event.resourcePersons || []).map((person) => person.image).filter(Boolean)
        )
      )
    );

    avatarUrls.forEach(preloadImage);
  }, []);

  if (!user) return null;

  useEffect(() => {
    if (!selectedEvent) return undefined;

    const onEsc = (e) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [selectedEvent]);

  // ✅ CONFLICT LOGIC
  const handleRegister = (newEvent) => {
    const newStart = new Date(newEvent.start).getTime();
    const newEnd = new Date(newEvent.end).getTime();

    const conflict = cart.find(item => {
      const existingStart = new Date(item.start).getTime();
      const existingEnd = new Date(item.end).getTime();
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (conflict) {
      setAlertType('conflict');
      setAlertMsg(`Conflict: You are busy with "${conflict.title || conflict.name}" at this time.`);
      setTimeout(() => setAlertMsg(''), 4000);
    } else {
      addToCart({
        ...newEvent,
        name: newEvent.title || newEvent.name || "Event",
        title: newEvent.title || newEvent.name || "Event"
      });
      setAlertType('success');
      setAlertMsg(`Registered: ${newEvent.title || newEvent.name}`);
      setTimeout(() => setAlertMsg(''), 2500);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const ResourceAvatar = ({ person }) => {
    const [hasError, setHasError] = useState(false);
    const initials = (person?.name || "RP")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return person?.image && !hasError ? (
      <div className="w-20 h-20 rounded-full p-[2px] bg-indigo-200/80">
        <img
          src={person.image}
          alt={person.name}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={80}
          height={80}
          onError={() => setHasError(true)}
          className="w-full h-full rounded-full object-cover bg-slate-100"
        />
      </div>
    ) : (
      <div className="w-20 h-20 rounded-full bg-purple-600/40 border border-purple-400/40 flex items-center justify-center text-base font-bold text-white">
        {initials}
      </div>
    );
  };

  // --- REUSABLE CARD COMPONENTS ---

  const WorkshopCard = ({ event }) => {
    const isInCart = cart.some(item => item.id === event.id);
    const displayTitle = event.title || event.name || 'Untitled Event';
    return (
        <motion.div 
          variants={itemVariants}
          className="group relative bg-[#0f0518]/60 backdrop-blur-xl border border-purple-500/20 hover:border-purple-500/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1 overflow-hidden flex flex-col h-full"
        >
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${event.color} opacity-10 blur-2xl rounded-bl-full group-hover:opacity-20 transition-opacity pointer-events-none`} />

          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="cursor-pointer" onClick={() => setSelectedEvent(event)}>
              <div className="flex justify-between items-start mb-4">
                <span className="font-iceland text-xl text-purple-300 bg-purple-900/30 px-3 py-1 rounded-md border border-purple-500/20">
                  {event.dept}
                </span>
                <div className="text-right">
                    <div className="text-pink-400 font-bold text-xs flex items-center justify-end gap-1 font-orbitron">
                        <Calendar size={12}/> {event.date.split(',')[0]}
                    </div>
                    <div className="text-gray-400 text-[10px] flex items-center justify-end gap-1 font-orbitron mt-1">
                        <Clock size={10}/> {event.time}
                    </div>
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-bold font-orbitron text-white mb-2 group-hover:text-purple-300 transition-colors uppercase tracking-tight leading-tight line-clamp-2">
                {displayTitle}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {event.shortDesc || event.description?.[0] || ''}
              </p>
              
              <button className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300 mb-6 font-orbitron uppercase tracking-widest">
                <ArrowRight size={14} /> View Details
              </button>
            </div>

            {/* Removed register button from card; registration happens in detail modal */}
          </div>
        </motion.div>
    );
  };

  const MainEventCard = ({ event }) => {
    const isInCart = cart.some(item => item.id === event.id);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-b from-[#1a0f0a] to-[#0f0505] border border-amber-500/40 rounded-3xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="md:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-500/30 rounded-full text-amber-400 text-sm font-bold font-orbitron tracking-wider">
              <Sparkles size={16} /> MAIN CONFERENCE
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold font-iceland text-white leading-tight">
              {event.title}
            </h2>
            
            <div className="flex flex-wrap gap-4 text-gray-300 text-sm md:text-base">
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md"><Calendar className="text-amber-400" size={18} /> {event.date}</span>
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md"><Globe className="text-blue-400" size={18} /> {event.mode}</span>
              <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md"><MapPin className="text-red-400" size={18} /> National Engineering College</span>
            </div>

            <p className="text-gray-400 leading-relaxed border-l-2 border-amber-500/50 pl-4">
              "Innovating for a Sustainable Future: Bridging Deep Tech and Environmental Impact."
            </p>

            <button onClick={() => setSelectedEvent(event)} className="text-amber-400 hover:text-amber-300 flex items-center gap-2 font-bold uppercase tracking-widest text-sm transition-colors">
              Read More About ICoDSES-2026 <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-col justify-center items-center md:items-end gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            {/* Details button only, registration in modal */}
            <button onClick={() => setSelectedEvent(event)} className="w-full md:w-auto px-8 py-4 rounded-xl font-bold font-orbitron tracking-widest flex items-center justify-center gap-2 transition-all duration-300 text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-500 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <ArrowRight size={20}/> VIEW DETAILS
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Navbar />
      
      {/* 1. PARTICLE BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Particle />
      </div>

      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
        
        {/* 2. BACKGROUND GLOW */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(109,40,217,0.2)] via-transparent to-[rgba(139,92,246,0.2)] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#7700ff_0%,transparent_25%),radial-gradient(circle_at_80%_80%,#7700FF_0%,transparent_25%)] blur-[60px]" />
        </div>

        {/* 3. PAGE CONTENT */}
        <div className="relative z-10 pt-32 pb-48 px-4 sm:px-6">
          
          {/* HEADER SECTION */}
          <div className="max-w-7xl mx-auto mb-16 text-center relative z-20">
            <motion.div
              className="font-netron text-[35px] sm:text-[45px] md:text-[60px] lg:text-[75px] text-white mb-2 sm:mb-4 animate-glow"
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              CONFERENCE TRACKS
            </motion.div>
          </div>

          {/* --- SECTION 1: PRE-CONFERENCE WORKSHOPS --- */}
          <div className="max-w-7xl mx-auto mb-24">
            <h2 className="text-3xl md:text-4xl font-bold font-iceland text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8 border-l-4 border-purple-500 pl-4 tracking-wider flex items-center gap-3">
              MARCH 25 <span className="text-lg text-white/50 font-sans tracking-normal font-normal">- PRE-CONFERENCE WORKSHOPS</span>
            </h2>
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10"
            >
                {formattedWorkshops.map((event) => (
                    <WorkshopCard key={event.id} event={event} />
                ))}
            </motion.div>
          </div>

          {/* --- SECTION 2: MAIN CONFERENCE --- */}
          <div className="max-w-7xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-iceland text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-8 border-l-4 border-amber-500 pl-4 tracking-wider flex items-center gap-3">
              MARCH 26 & 27 <span className="text-lg text-white/50 font-sans tracking-normal font-normal">- MAIN EVENT</span>
            </h2>
            <MainEventCard event={mainConferenceData} />
          </div>

        </div>
      </div>

      {/* --- RICH DETAILS MODAL --- */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black p-2 sm:p-4"
            onClick={closeModal}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f0f13] border border-white/10 rounded-2xl w-full max-w-4xl shadow-[0_0_50px_rgba(168,85,247,0.2)] relative h-[calc(100vh-1.5rem)] max-h-[900px] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`p-6 bg-gradient-to-r ${selectedEvent.color} relative overflow-hidden flex-shrink-0`}>
                 <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                 <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-black/30 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 mb-3">
                        {selectedEvent.dept}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold font-sans text-white leading-tight pr-8">
                        {selectedEvent.title}
                    </h2>
                    {/* Modal Price & Date Display */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm font-orbitron font-bold text-white/90">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {selectedEvent.date}</span>
                        <span className="flex items-center gap-1"><Clock size={14}/> {selectedEvent.time}</span>
                        {selectedEvent.location && <span className="flex items-center gap-1"><MapPin size={14}/> Kovilpatti</span>}
                    </div>
                 </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto custom-scrollbar p-6 space-y-8 bg-[#0f0f13]">
                  
                  {/* Notification for Main Conference */}
                  {selectedEvent.id === 'icodses-2026' && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-full"><Sparkles className="text-blue-400" size={16}/></div>
                        <p className="text-sm text-blue-200">The review status of the submitted manuscripts was duly communicated to the authors on 10.02.2026.</p>
                    </div>
                  )}

                  {/* Resource Persons Section (same style as Home popup) */}
                  {selectedEvent.resourcePersons && !selectedEvent.committee && (
                    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="flex items-center gap-2 text-sm font-orbitron font-bold text-purple-300 uppercase tracking-wider mb-4">
                        <User size={16} /> Resource Persons
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedEvent.resourcePersons.map((person, idx) => (
                          <div key={idx} className="flex items-start gap-4 bg-black/30 p-3 rounded-lg border border-white/5">
                            <div className="shrink-0">
                              <ResourceAvatar person={person} />
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

                  <div className="grid gap-6 md:grid-cols-3">
                      {/* Description & Objectives */}
                      <div className="md:col-span-2 space-y-6">
                         <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3 font-orbitron">
                                <BookOpen size={18} className="text-blue-400" /> About the Workshop
                            </h3>
                            <div className="space-y-3 text-gray-300 text-sm leading-relaxed text-justify">
                                {selectedEvent.description?.map((p, i) => <p key={i}>{p}</p>)}
                            </div>
                         </div>

                         {selectedEvent.speakerBio && (
                            <div>
                               <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-3 font-orbitron">
                                   <User size={18} className="text-amber-400" /> About the Speaker
                               </h3>
                               <div className="text-gray-300 text-sm leading-relaxed text-justify">
                                   {selectedEvent.speakerBio}
                               </div>
                            </div>
                         )}
                         
                         {selectedEvent.contact && (
                             <div className="mt-4 p-4 bg-white/5 rounded-lg">
                                <h4 className="font-bold text-white mb-1">Contact Us</h4>
                                <p className="text-gray-400 text-sm">For further queries, please write to: <span className="text-purple-400">{selectedEvent.contact}</span></p>
                             </div>
                         )}

                         {selectedEvent.objectives && selectedEvent.objectives.length > 0 && (
                             <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                 <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 font-orbitron">
                                     <List size={18} className="text-cyan-400" /> Objectives
                                 </h3>
                                 <ul className="space-y-2">
                                     {selectedEvent.objectives.map((item, i) => (
                                         <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                             <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                                             {item}
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                         )}

                         {selectedEvent.outcomes && selectedEvent.outcomes.length > 0 && (
                              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                  <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 font-orbitron">
                                      <Check size={18} className="text-emerald-400" /> Outcomes
                                  </h3>
                                  <ul className="space-y-2">
                                      {selectedEvent.outcomes.map((item, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                              {item}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>

                      {/* Right Column: Topics / Committee */}
                      <div className="md:col-span-1 space-y-6">
                          {/* Committee (Specific for Main Conf) */}
                          {selectedEvent.committee && (
                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 font-orbitron">
                                    <User size={18} className="text-yellow-400" /> Committee
                                </h3>
                                <div className="space-y-4">
                                    {selectedEvent.committee.map((c, i) => (
                                        <div key={i} className="text-sm border-b border-white/5 pb-2 last:border-0">
                                            <p className="text-purple-400 text-xs font-bold uppercase">{c.role}</p>
                                            <p className="text-white font-semibold">{c.name}</p>
                                            {c.title && <p className="text-gray-500 text-xs">{c.title}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                          )}

                          {/* Topics */}
                          {selectedEvent.topics && (
                              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                  <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4 font-orbitron">
                                      <List size={18} className="text-pink-400" /> Topics
                                  </h3>
                                  <ul className="space-y-2">
                                      {selectedEvent.topics.map((t, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0" />
                                              {t}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-[#0b0b10] flex flex-col sm:flex-row sm:justify-end gap-3 shrink-0">
                  <button onClick={() => setSelectedEvent(null)} className="w-full sm:w-auto px-5 py-2 rounded-lg text-gray-400 text-sm font-bold hover:text-white hover:bg-white/5 transition-colors">
                      Close
                  </button>
                  <button 
                      onClick={() => {
                          const isInCart = cart.some(item => item.id === selectedEvent.id);
                          if (!isInCart) handleRegister(selectedEvent);
                      }}
                      disabled={cart.some(item => item.id === selectedEvent?.id)}
                      className={`w-full sm:w-auto px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          cart.some(item => item.id === selectedEvent?.id)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : selectedEvent.id === 'icodses-2026'
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-[0_0_15px_rgba(219,39,119,0.4)]'
                      }`}
                  >
                     {cart.some(item => item.id === selectedEvent?.id) ? "Registered" : "Register"} <ArrowRight size={14} />
                  </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALERT BANNER (TOP-LEVEL so it always stays above popup) */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-0 right-0 z-[2147483647] flex justify-center pointer-events-none px-3"
          >
            <div className={`${alertType === 'conflict' ? 'bg-red-900/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-emerald-900/90 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]'} backdrop-blur-md border text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center gap-3 pointer-events-auto w-full max-w-5xl`}>
              {alertType === 'conflict' ? (
                <AlertTriangle className="text-red-400 animate-pulse shrink-0" size={24} />
              ) : (
                <Check className="text-emerald-300 shrink-0" size={24} />
              )}
              <span className="font-bold font-orbitron tracking-wide uppercase text-xs sm:text-sm">{alertMsg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AllTracks;
