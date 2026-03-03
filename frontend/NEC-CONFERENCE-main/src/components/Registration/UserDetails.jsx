import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { X, Upload, BookOpen, User } from 'lucide-react';

const UserDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const [userData, setUserData] = useState({
    name: location.state?.name || "",
    email: location.state?.email || "",
    college: location.state?.college || "",
    phone: location.state?.phone || "",
    department: "",
    city: "",
    year: "",
    role: "Listener", // Default role
    track: "",
    paperTitle: "",
    abstract: "",
    accommodation: "No"
  });

  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const conferenceTracks = [
    "Computer Science & AI",
    "Electronics & Communication",
    "Mechanical & Civil Systems",
    "Electrical & Power Systems",
    "Science & Humanities"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!userData.name) newErrors.name = "Name is required.";
    if (!userData.email) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(userData.email)) newErrors.email = "Invalid email format.";
    if (!userData.college) newErrors.college = "Institution/Organization is required.";
    if (!userData.phone) newErrors.phone = "Phone number is required.";
    else if (userData.phone.length !== 10 || !/^\d+$/.test(userData.phone)) newErrors.phone = "Phone must be 10 digits.";
    if (!userData.city) newErrors.city = "City is required.";
    if (!userData.department) newErrors.department = "Department is required.";
    
    // Author specific validation
    if (userData.role === "Author") {
      if (!userData.track) newErrors.track = "Please select a conference track.";
      if (!userData.paperTitle) newErrors.paperTitle = "Paper title is required.";
      if (!userData.abstract) newErrors.abstract = "Abstract is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setModalMessage("Please fill all required fields correctly.");
      setShowModal(true);
      return;
    }

    // Determine Fee based on Role
    const feeAmount = userData.role === "Author" ? 10 : 200;
    
    // Prepare data for next screen
    const registrationData = {
      userData: userData,
      amount: feeAmount
    };

    window.scrollTo(0, 0);
    // Skip EventSelection, go straight to Payment for Conference
    navigate("/registration/payment", { state: registrationData });
  };

  return (
    <>
      <motion.div className="min-h-screen flex flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-[#1E0F2D] via-[#2A1B3D] to-[#14092A] text-purple-200">
        <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 py-12">
          <motion.div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-400 to-purple-100 text-transparent bg-clip-text mb-4">
              Conference Registration
            </h1>
            <p className="text-purple-300">Join us for a day of innovation and research.</p>
          </motion.div>

          <motion.div className="bg-[#2A1B3D] rounded-xl p-6 sm:p-8 shadow-2xl border border-purple-700/30">
            
            {/* Role Selection Toggles */}
            <div className="flex justify-center mb-8 bg-[#1E0F2D] p-1 rounded-lg w-fit mx-auto border border-purple-800">
              <button
                type="button"
                onClick={() => setUserData({ ...userData, role: "Listener" })}
                className={`px-6 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${
                  userData.role === "Listener" 
                    ? "bg-purple-600 text-white shadow-lg" 
                    : "text-purple-400 hover:text-white"
                }`}
              >
                <User size={18} /> Listener (₹200)
              </button>
              <button
                type="button"
                onClick={() => setUserData({ ...userData, role: "Author" })}
                className={`px-6 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${
                  userData.role === "Author" 
                    ? "bg-pink-600 text-white shadow-lg" 
                    : "text-purple-400 hover:text-white"
                }`}
              >
                <BookOpen size={18} /> Author (₹10)
              </button>
            </div>

            <form className="space-y-6">
              {/* Personal Details Section */}
              <h3 className="text-xl font-bold text-purple-100 border-b border-purple-700/50 pb-2">Personal Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-purple-300 font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-2">Institution / Organization</label>
                  <input
                    type="text"
                    name="college"
                    value={userData.college}
                    onChange={handleChange}
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {errors.college && <p className="text-red-500 text-sm mt-1">{errors.college}</p>}
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-2">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handleChange}
                    maxLength="10"
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-2">Department</label>
                  <select
                    name="department"
                    value={userData.department}
                    onChange={handleChange}
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Department</option>
                    {["CSE", "IT", "AI&DS", "EEE", "ECE", "MECH", "CIVIL", "MBA", "Others"].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-purple-300 font-semibold mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={userData.city}
                    onChange={handleChange}
                    className="w-full bg-[#3B2A4F] border border-purple-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>

              {/* Author Specific Section */}
              {userData.role === "Author" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-6 pt-4"
                >
                  <h3 className="text-xl font-bold text-pink-200 border-b border-pink-700/50 pb-2">Paper Submission Details</h3>
                  
                  <div>
                    <label className="block text-pink-300 font-semibold mb-2">Conference Track</label>
                    <select
                      name="track"
                      value={userData.track}
                      onChange={handleChange}
                      className="w-full bg-[#3B2A4F] border border-pink-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    >
                      <option value="">Select a Track</option>
                      {conferenceTracks.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                    {errors.track && <p className="text-red-500 text-sm mt-1">{errors.track}</p>}
                  </div>

                  <div>
                    <label className="block text-pink-300 font-semibold mb-2">Paper Title</label>
                    <input
                      type="text"
                      name="paperTitle"
                      value={userData.paperTitle}
                      onChange={handleChange}
                      placeholder="Enter the title of your research paper"
                      className="w-full bg-[#3B2A4F] border border-pink-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    {errors.paperTitle && <p className="text-red-500 text-sm mt-1">{errors.paperTitle}</p>}
                  </div>

                  <div>
                    <label className="block text-pink-300 font-semibold mb-2">Abstract (Max 300 words)</label>
                    <textarea
                      name="abstract"
                      value={userData.abstract}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Paste your abstract here..."
                      className="w-full bg-[#3B2A4F] border border-pink-700/50 rounded-lg px-4 py-3 text-purple-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    {errors.abstract && <p className="text-red-500 text-sm mt-1">{errors.abstract}</p>}
                  </div>
                </motion.div>
              )}

              {/* Accommodation Section */}
              <div className="pt-4 border-t border-purple-700/50">
                <label className="block text-purple-300 font-semibold mb-3">Do you require accommodation? (Additional charges apply)</label>
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accommodation"
                      value="Yes"
                      checked={userData.accommodation === "Yes"}
                      onChange={handleChange}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <span className="text-purple-200">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accommodation"
                      value="No"
                      checked={userData.accommodation === "No"}
                      onChange={handleChange}
                      className="w-5 h-5 accent-purple-500"
                    />
                    <span className="text-purple-200">No</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 px-6 rounded-xl text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all shadow-lg"
              >
                Proceed to Payment (₹{userData.role === "Author" ? 300 : 200})
              </button>
            </form>
          </motion.div>
        </div>

        {/* Error Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
              <h3 className="text-xl font-bold text-red-600">Action Required</h3>
              <p className="text-gray-700 mt-2">{modalMessage}</p>
              <button onClick={() => setShowModal(false)} className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black">
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default UserDetails;