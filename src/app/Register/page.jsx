"use client";
import { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { saveAs } from 'file-saver';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InternshipPortal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const downloadRef = useRef(null);

  const particlesConfig = {
    particles: {
      number: { value: 50, density: { enable: true, value_area: 800 } },
      color: { value: ["#4F46E5", "#10B981", "#EF4444"] },
      shape: { type: "circle" },
      opacity: { value: 0.5 },
      size: { value: 3 },
      links: {
        enable: true,
        distance: 100,
        color: "#ffffff",
        opacity: 0.3,
        width: 1
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "repulse" },
        onclick: { enable: true, mode: "push" },
        resize: true
      },
      modes: {
        grab: { distance: 150, links: { opacity: 1 } },
        repulse: { distance: 80, duration: 0.4 },
        push: { particles_nb: 3 }
      }
    },
    retina_detect: true
  };

  useEffect(() => {
    const initializeParticles = () => {
      if (typeof window !== "undefined" && window.particlesJS) {
        window.particlesJS("particles-js", particlesConfig);
      }
    };

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
    script.async = true;
    script.onload = initializeParticles;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      const particlesContainer = document.getElementById("particles-js");
      if (particlesContainer) particlesContainer.innerHTML = "";
    };
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    email: "",
    university: "",
    department: "",
    domain: "",
    linkedin: "",
    profilePic: null,
    resume: null,
    name: "",
    username: "",
    password: "",
    weeks: 8
  });

  const universities = [
    "NED University",
    "Others"
  ];

  const universityDepartments = {
    "NED University": [
      "Mechanical Engineering",
      "Automotive & Marine Engineering",
      "Electrical Engineering",
      "Computer & Information Systems Engineering",
      "Electronic Engineering",
      "Software Engineering",
      "Computer Science & Information Technology",
      "Economics & Management Sciences",
      "Chemical Engineering",
      "Environmental Engineering",
      "Economics & Finance",
    ],
    "Others": ["Computer Science", "Software Engineering", "Information Technology", "Data Engineering", "AI Engineering"]
  };

  const domains = ["AI", "Machine Learning", "Web Development", "Mobile App Development", "Embedded Systems", "Robotics", "Others"];
  const weeksOptions = [8, 9, 10, 11, 12];

  const validatePakistaniNumber = (number) => {
    return /^03\d{9}$/.test(number);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateLinkedIn = (url) => {
    return /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
  };

  const validateName = (name) => {
    return /^[a-zA-Z\s]+$/.test(name);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }

    if (files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(name === 'university' ? { department: '' } : {})
      }));

      if (name === 'firstName' || name === 'lastName') {
        const fullName = name === 'firstName'
          ? `${value} ${formData.lastName}`
          : `${formData.firstName} ${value}`;
        setFormData(prev => ({
          ...prev,
          name: fullName.trim()
        }));
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    maxFiles: 2,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error("Please upload only PDF or image files");
        return;
      }

      for (const file of acceptedFiles) {
        if (file.type.startsWith("image/")) {
          if (file.size > 2 * 1024 * 1024) {
            toast.error("Profile picture should be less than 2MB");
            continue;
          }
          const imageUrl = URL.createObjectURL(file);
          setPreviewImage(imageUrl);
          setFormData(prev => ({ ...prev, profilePic: file }));
        }
        else if (file.type === "application/pdf") {
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Resume should be less than 5MB");
            continue;
          }
          setFormData(prev => ({ ...prev, resume: file }));
          setResumeText(`File selected: ${file.name}`);
        }
      }
    }
  });

  const validateStep = (stepToValidate) => {
    let stepErrors = {};
    let isValid = true;

    if (stepToValidate === 1) {
      if (!formData.firstName.trim()) {
        stepErrors.firstName = "First Name is required";
        isValid = false;
      } else if (!validateName(formData.firstName)) {
        stepErrors.firstName = "First Name should contain only letters";
        isValid = false;
      }

      if (formData.lastName && !validateName(formData.lastName)) {
        stepErrors.lastName = "Last Name should contain only letters";
        isValid = false;
      }

      if (!formData.phone) {
        stepErrors.phone = "Phone Number is required";
        isValid = false;
      } else if (!validatePakistaniNumber(formData.phone)) {
        stepErrors.phone = "Invalid Pakistani number (must start with 03 and be 11 digits)";
        isValid = false;
      }

      if (!formData.email) {
        stepErrors.email = "Email is required";
        isValid = false;
      } else if (!validateEmail(formData.email)) {
        stepErrors.email = "Invalid email format";
        isValid = false;
      }

      if (!formData.linkedin) {
        stepErrors.linkedin = "LinkedIn Profile URL is required";
        isValid = false;
      } else if (!validateLinkedIn(formData.linkedin)) {
        stepErrors.linkedin = "Invalid LinkedIn URL format";
        isValid = false;
      }

      if (!formData.dob) {
        stepErrors.dob = "Date of Birth is required";
        isValid = false;
      } else {
        const dob = new Date(formData.dob);
        const today = new Date();
        if (dob > today) {
          stepErrors.dob = "Date of Birth cannot be in the future";
          isValid = false;
        }
      }
    }

    if (stepToValidate === 2) {
      if (!formData.university) {
        stepErrors.university = "University selection is required";
        isValid = false;
      }
      if (!formData.domain) {
        stepErrors.domain = "Domain is required";
        isValid = false;
      }
      if (!formData.weeks) {
        stepErrors.weeks = "Please select internship duration";
        isValid = false;
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
    }
    return isValid;
  };

  const validateUpToStep = (targetStep) => {
    for (let i = 1; i < targetStep; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementsByName(firstError)[0]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleStepChange = (targetStep) => {
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    if (!validateUpToStep(targetStep)) {
      toast.error(`Please complete all required fields in Step ${step} before proceeding.`);
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementsByName(firstError)[0]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    if (targetStep > step && !validateStep(step)) {
      toast.error(`Please complete all required fields in Step ${step} before proceeding.`);
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementsByName(firstError)[0]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    setStep(targetStep);
  };

  const downloadCredentials = () => {
    const blob = new Blob([
      `NCAI Internship Portal Credentials\n\n` +
      `Name: ${formData.firstName} ${formData.lastName}\n` +
      `Email: ${formData.email}\n` +
      `Username: ${credentials.username}\n` +
      `Password: ${credentials.password}\n\n` +
      `Please save these credentials securely. Your registration is pending admin approval. You will be able to log in once approved.\n` +
      `For security reasons, we recommend changing your password after first login.`
    ], { type: 'text/plain;charset=utf-8' });
    
    saveAs(blob, `NCAI_Credentials_${credentials.username}.txt`);
    setShowDownloadModal(false);
    setCredentials({ username: "", password: "" });
    router.push('/Login');
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setLoading(true);

    try {
      const generatedUsername = formData.firstName.toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      const randomPassword = Math.random().toString(36).slice(-8) +
        Math.floor(Math.random() * 10);

      setFormData(prev => ({
        ...prev,
        username: generatedUsername,
        password: randomPassword
      }));

      setCredentials({ username: generatedUsername, password: randomPassword });

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        username: generatedUsername,
        password: randomPassword,
        contactNumber: formData.phone,
        program: formData.department,
        university: formData.university,
        domain: formData.domain,
        weeks: formData.weeks,
        dob: formData.dob,
        linkedin: formData.linkedin,
        resume: formData.resume ? formData.resume.name : null,
        profilePic: formData.profilePic ? formData.profilePic.name : null,
      };

      const response = await fetch('https://backend-internship-portal.vercel.app/api/student/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Registration failed. Email or username may already be in use.');
        }
        throw new Error('Registration failed. Please try again later.');
      }

      toast.success('Registration submitted successfully! Awaiting admin approval.', { autoClose: 3000 });
      setSuccess('Your registration has been submitted and is awaiting admin approval. You will receive your credentials once approved.');
      setShowDownloadModal(true);

      setFormData({
        firstName: "",
        lastName: "",
        dob: "",
        phone: "",
        email: "",
        university: "",
        department: "",
        domain: "",
        linkedin: "",
        profilePic: null,
        resume: null,
        name: "",
        username: "",
        password: "",
        weeks: 8,
      });

      setPreviewImage("");
      setResumeText("");

    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = error.message || 'Registration failed. Please try again later.';
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden flex flex-col">
      <div id="particles-js" className="absolute inset-0 z-0"></div>
      <ToastContainer position="top-center" autoClose={3000} theme="dark" />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-6 sm:py-8">
        <div className="w-full max-w-3xl bg-gray-800 bg-opacity-95 backdrop-blur-lg p-6 sm:p-8 rounded-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8">
            <div className="w-16 h-12 sm:w-20 sm:h-16 bg-gray-700 rounded-lg flex items-center justify-center mb-4 sm:mb-0">
              <Image width={80} height={80} src={"/scl.png"} alt="NCAI Logo" className="rounded-lg object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              SCL INTERNSHIP PORTAL
            </h1>
          </div>

          {success && (
            <div className="mb-6 bg-green-900 bg-opacity-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-200 text-sm sm:text-base">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <input
                    name="firstName"
                    placeholder="First Name *"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.firstName}
                  />
                  {errors.firstName && <span className="text-red-400 text-xs sm:text-sm">{errors.firstName}</span>}
                </div>
                <div>
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.lastName}
                  />
                  {errors.lastName && <span className="text-red-400 text-xs sm:text-sm">{errors.lastName}</span>}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    className="w-full p-3 bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 peer"
                    onChange={handleChange}
                    value={formData.dob}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <label
                    htmlFor="dob"
                    className={`
                      absolute left-3 transition-all duration-200 pointer-events-none text-gray-400
                      peer-focus:-top-2 peer-focus:text-xs peer-focus:text-gray-300 peer-focus:bg-gray-700 peer-focus:px-1
                      ${formData.dob ? '-top-2 text-xs text-gray-300 bg-gray-700 px-1' : 'top-3 text-sm'}
                    `}
                  >
                    Date of Birth *
                  </label>
                  {errors.dob && (
                    <span className="text-red-400 text-xs sm:text-sm mt-1 block">{errors.dob}</span>
                  )}
                </div>
                <div>
                  <input
                    name="phone"
                    placeholder="Phone Number (03XXXXXXXXX) *"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.phone}
                    maxLength={11}
                  />
                  {errors.phone && <span className="text-red-400 text-xs sm:text-sm">{errors.phone}</span>}
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.email}
                  />
                  {errors.email && <span className="text-red-400 text-xs sm:text-sm">{errors.email}</span>}
                </div>
                <div>
                  <input
                    name="linkedin"
                    placeholder="LinkedIn Profile URL *"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.linkedin}
                    required
                  />
                  {errors.linkedin && <span className="text-red-400 text-xs sm:text-sm">{errors.linkedin}</span>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <select
                    name="university"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.university}
                  >
                    <option value="">Select University *</option>
                    {universities.map(uni => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
                  {errors.university && <span className="text-red-400 text-xs sm:text-sm">{errors.university}</span>}
                </div>
                <div>
                  <select
                    name="department"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.department}
                    disabled={!formData.university}
                  >
                    <option value="">Select Your Department</option>
                    {formData.university && universityDepartments[formData.university]?.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    name="domain"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.domain}
                  >
                    <option value="">Select Domain *</option>
                    {domains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                  {errors.domain && <span className="text-red-400 text-xs sm:text-sm">{errors.domain}</span>}
                </div>
                <div>
                  <select
                    name="weeks"
                    className="w-full p-3 bg-gray-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                    onChange={handleChange}
                    value={formData.weeks}
                  >
                    <option value="">Select Internship Duration (Weeks) *</option>
                    {weeksOptions.map(week => (
                      <option key={week} value={week}>{week} Weeks</option>
                    ))}
                  </select>
                  {errors.weeks && <span className="text-red-400 text-xs sm:text-sm">{errors.weeks}</span>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {/* <div {...getRootProps()} className="border-2 border-dashed border-gray-600 p-6 text-center rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input {...getInputProps()} />
                  <p className="text-gray-300 text-sm sm:text-base">Drag & drop profile picture (max 2MB) and resume (max 5MB) here, or click to select</p>
                  <p className="text-xs text-gray-400 mt-2">Accepted: JPG, PNG, PDF</p>
                  {previewImage && (
                    <div className="mt-4">
                      <Image width={120} height={120} src={previewImage} alt="Profile Preview" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto object-cover" />
                    </div>
                  )}
                  {formData.resume && (
                    <p className="mt-2 text-green-400 text-sm sm:text-base">Resume uploaded: {formData.resume.name}</p>
                  )}
                </div> */}

                {resumeText && (
                  <div className="bg-gray-700/sl p-4 rounded-lg max-h-32 overflow-y-auto">
                    <h3 className="font-bold text-sm sm:text-base mb-2">Resume Preview:</h3>
                    <p className="text-xs sm:text-sm opacity-75">{resumeText.substring(0, 300)}...</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold text-sm sm:text-base mb-2">Personal Information</h3>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">Name:</span> {formData.firstName} {formData.lastName}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">Email:</span> {formData.email}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">Phone:</span> {formData.phone}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">DOB:</span> {formData.dob || 'Not provided'}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">LinkedIn:</span> {formData.linkedin}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold text-sm sm:text-base mb-2">Education Information</h3>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">University:</span> {formData.university || 'Not selected'}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">Department:</span> {formData.department || 'Not selected'}</p>
                    <p className="text-xs sm:text-sm"><span className="text-gray-400">Domain:</span> {formData.domain || 'Not selected'}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold text-sm sm:text-base mb-2">Internship Details</h3>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">Duration:</span> {formData.weeks} weeks</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold text-sm sm:text-base mb-2">Your Login Credentials</h3>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">Username:</span> {credentials.username || formData.username || 'Will be generated'}</p>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">Password:</span> {credentials.password || formData.password ? '••••••••' : 'Will be generated'}</p>
                  <p className="text-yellow-400 text-xs sm:text-sm mt-2">Please save these credentials securely! You can log in after admin approval.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between w-full mt-6 sm:mt-8 space-x-4">
              {step > 1 ? (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition text-sm sm:text-base"
                >
                  Back
                </button>
              ) : (
                <div className="w-20 sm:w-24" />
              )}

              <div className="flex space-x-2 sm:space-x-3">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => handleStepChange(num)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition text-sm sm:text-base
                      ${step === num ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"}
                      ${step > num ? "bg-green-500 text-white" : ""}`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition text-sm sm:text-base"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-400">Registration Submitted!</h2>
            <p className="mb-4 text-sm sm:text-base">Your registration is awaiting admin approval. Please download your credentials for future reference.</p>
            
            <div className="bg-gray-700 p-4 rounded mb-4">
              <p className="font-semibold text-sm sm:text-base">Username: <span className="text-blue-300">{credentials.username}</span></p>
              <p className="font-semibold text-sm sm:text-base">Password: <span className="text-blue-300">{credentials.password}</span></p>
              <p className="text-yellow-400 text-xs sm:text-sm mt-2">You will need these credentials to login once your registration is approved.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setCredentials({ username: "", password: "" });
                  router.push('/Login');
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-sm sm:text-base"
              >
                Skip Download
              </button>
              <button
                ref={downloadRef}
                onClick={downloadCredentials}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
