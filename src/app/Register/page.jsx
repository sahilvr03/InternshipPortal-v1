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
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: ["#4F46E5", "#10B981", "#EF4444"] },
      shape: { type: "circle" },
      opacity: { value: 0.7 },
      size: { value: 3 },
      links: {
        enable: true,
        distance: 150,
        color: "#ffffff",
        opacity: 0.4,
        width: 1
      },
      move: {
        enable: true,
        speed: 3,
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
        grab: { distance: 200, links: { opacity: 1 } },
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 }
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
    address: "",
    email: "",
    university: "",
    domain: "",
    department: "",
    gender: "",
    emergencyContact: "",
    linkedin: "",
    profilePic: null,
    resume: null,
    startDate: "",
    endDate: "",
    name: "",
    username: "",
    password: "",
    duration: 3,
    tasks: ""
  });

  const universities = ["Karachi University", "IBA Karachi", "NED University", "FAST Karachi", "SZABIST Karachi", "LUMS", "UET Lahore", "GIKI", "NUST", "COMSATS Islamabad", "UET Peshawar", "UET Taxila", "UET Faisalabad", "UET Gujranwala"];
  const domains = ["AI", "Machine Learning", "Web Development", "Mobile Development", "Data Science"];
  const departments = ["Computer Science", "Software Engineering", "Information Technology", "Data Engineering"];
  const genders = ["Male", "Female", "Other"];

  // Validate Pakistani phone number (03XXXXXXXXX)
  const validatePakistaniNumber = (number) => {
    return /^03\d{9}$/.test(number);
  };

  // Validate email format
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate LinkedIn URL
  const validateLinkedIn = (url) => {
    if (!url) return true;
    return /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(url);
  };

  // Validate name (only letters and spaces)
  const validateName = (name) => {
    return /^[a-zA-Z\s]+$/.test(name);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Clear error when user starts typing
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
        [name]: value
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

      if (name === 'startDate' || name === 'endDate') {
        if (formData.startDate && formData.endDate) {
          let start = new Date(formData.startDate);
          let end = new Date(formData.endDate);

          if (name === 'startDate') {
            start = new Date(value);
          } else {
            end = new Date(value);
          }

          if (start && end && start < end) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const months = Math.ceil(diffDays / 30);

            setFormData(prev => ({
              ...prev,
              duration: months
            }));
          }
        }
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
          // Validate image size (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            toast.error("Profile picture should be less than 2MB");
            continue;
          }

          const imageUrl = URL.createObjectURL(file);
          setPreviewImage(imageUrl);
          setFormData(prev => ({ ...prev, profilePic: file }));
        }
        else if (file.type === "application/pdf") {
          // Validate PDF size (max 5MB)
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
      // First Name validation
      if (!formData.firstName.trim()) {
        stepErrors.firstName = "First Name is required";
        isValid = false;
      } else if (!validateName(formData.firstName)) {
        stepErrors.firstName = "First Name should contain only letters";
        isValid = false;
      }

      // Last Name validation
      if (formData.lastName && !validateName(formData.lastName)) {
        stepErrors.lastName = "Last Name should contain only letters";
        isValid = false;
      }

      // Phone validation
      if (!formData.phone) {
        stepErrors.phone = "Phone Number is required";
        isValid = false;
      } else if (!validatePakistaniNumber(formData.phone)) {
        stepErrors.phone = "Invalid Pakistani number (must start with 03 and be 11 digits)";
        isValid = false;
      }

      // Email validation
      if (!formData.email) {
        stepErrors.email = "Email is required";
        isValid = false;
      } else if (!validateEmail(formData.email)) {
        stepErrors.email = "Invalid email format";
        isValid = false;
      }

      // LinkedIn validation
      if (formData.linkedin && !validateLinkedIn(formData.linkedin)) {
        stepErrors.linkedin = "Invalid LinkedIn URL format";
        isValid = false;
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
      if (!formData.startDate) {
        stepErrors.dates = "Start date is required";
        isValid = false;
      }
      if (!formData.endDate) {
        stepErrors.dates = "End date is required";
        isValid = false;
      }

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 28) {
          stepErrors.dates = "Minimum internship duration is 4 weeks";
          isValid = false;
        }
        if (start > end) {
          stepErrors.dates = "End date must be after start date";
          isValid = false;
        }
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
    }
    return isValid;
  };

  const validateUpToStep = (targetStep) => {
    // Validate all steps up to the target step
    for (let i = 1; i < targetStep; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      // Scroll to the first error
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
    // Allow going back without validation
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    // Prevent going forward if previous steps are incomplete
    if (!validateUpToStep(targetStep)) {
      toast.error(`Please complete all required fields in Step ${step} before proceeding.`);
      // Scroll to the first error in the current step
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementsByName(firstError)[0]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    // Validate the current step before moving to the target step
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
      `Please save these credentials securely. You will need them to login to your account.\n` +
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
      // Generate username and password
      const generatedUsername = formData.firstName.toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      const randomPassword = Math.random().toString(36).slice(-8) +
        Math.floor(Math.random() * 10);

      // Update formData with generated credentials
      setFormData(prev => ({
        ...prev,
        username: generatedUsername,
        password: randomPassword
      }));

      // Store credentials for download
      setCredentials({ username: generatedUsername, password: randomPassword });

      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        username: generatedUsername,
        password: randomPassword,
        duration: formData.duration,
        tasks: formData.tasks,
        university: formData.university,
        department: formData.department,
        phone: formData.phone,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        dob: formData.dob,
        domain: formData.domain,
        gender: formData.gender,
        emergencyContact: formData.emergencyContact,
        linkedin: formData.linkedin,
        resume: formData.resume ? formData.resume.name : null,
        profilePic: formData.profilePic ? formData.profilePic.name : null,
      };

      const response = await fetch('https://backend-internship-portal.vercel.app/api/interns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This email is already registered.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed. Please try again later.');
      }

      const data = await response.json();
      toast.success('Registration successful!', { autoClose: 5000 });
      setSuccess('Your application has been submitted successfully.');
      setShowDownloadModal(true);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        dob: "",
        phone: "",
        address: "",
        email: "",
        university: "",
        domain: "",
        department: "",
        gender: "",
        emergencyContact: "",
        linkedin: "",
        profilePic: null,
        resume: null,
        startDate: "",
        endDate: "",
        name: "",
        username: "",
        password: "",
        duration: 3,
        tasks: ""
      });

      setPreviewImage("");
      setResumeText("");

    } catch (error) {
      console.error('Registration failed:', error);
      let errorMessage = error.message || 'Registration failed. Please try again later.';
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div id="particles-js" className="absolute inset-0 z-0"></div>
      <ToastContainer position="top-center" autoClose={5000} />
      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-4xl bg-gray-800 bg-opacity-90 backdrop-blur-lg p-8 rounded-xl shadow-2xl mx-4 my-8">
          <div className="flex justify-between content-center">
            <div className="w-20 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-sm mb-8">
              <Image width={200} height={200} src={"/ncailogo.png"} alt="NCAI Logo" className="rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              NCAI INTERNSHIP PORTAL
            </h1>
          </div>

          {success && (
            <div className="mb-6 bg-green-900 bg-opacity-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-200">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    name="firstName"
                    placeholder="First Name *"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.firstName}
                  />
                  {errors.firstName && <span className="text-red-400 text-sm">{errors.firstName}</span>}
                </div>
                <div>
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.lastName}
                  />
                  {errors.lastName && <span className="text-red-400 text-sm">{errors.lastName}</span>}
                </div>

             <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white-100 "
                    onChange={handleChange}
                    value={formData.dob}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <span
                    className={`absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-opacity duration-200 ${formData.dob ? 'opacity-0' : 'opacity-100'}`}
                  >
                    Date of Birth
                  </span>
                </div>

                <div>
                  <select
                    name="gender"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.gender}
                  >
                    <option value="">Select Gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    name="phone"
                    placeholder="Phone Number (03XXXXXXXXX) *"
                    className="w-full p-3 bg-gray-700 rounded-lg
                    rounded-lg"
                    onChange={handleChange}
                    value={formData.phone}
                    maxLength={11}
                  />
                  {errors.phone && <span className="text-red-400 text-sm">{errors.phone}</span>}
                </div>

                <div>
                  <input
                    name="emergencyContact"
                    placeholder="Emergency Contact"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.emergencyContact}
                    maxLength={11}
                  />
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.email}
                  />
                  {errors.email && <span className="text-red-400 text-sm">{errors.email}</span>}
                </div>

                <div>
                  <input
                    name="address"
                    placeholder="Address"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.address}
                  />
                </div>

                <div className="md:col-span-2">
                  <input
                    name="linkedin"
                    placeholder="LinkedIn Profile URL (optional)"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.linkedin}
                  />
                  {errors.linkedin && <span className="text-red-400 text-sm">{errors.linkedin}</span>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    name="university"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.university}
                  >
                    <option value="">Select University *</option>
                    {universities.map(uni => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
                  {errors.university && <span className="text-red-400 text-sm">{errors.university}</span>}
                </div>
                <div>
                  <select
                    name="domain"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.domain}
                  >
                    <option value="">Select Domain *</option>
                    {domains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                  {errors.domain && <span className="text-red-400 text-sm">{errors.domain}</span>}
                </div>
                <div>
                  <select
                    name="department"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.department}
                  >
                    <option value="">Select Your Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    name="tasks"
                    placeholder="Previous Experience/Projects"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.tasks}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      if (formData.endDate) {
                        const start = new Date(e.target.value);
                        const end = new Date(formData.endDate);
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays < 28) {
                          const minEndDate = new Date(start);
                          minEndDate.setDate(minEndDate.getDate() + 28);
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                            endDate: minEndDate.toISOString().split('T')[0]
                          });
                        }

                        const months = Math.ceil(diffDays / 30);
                        setFormData(prev => ({
                          ...prev,
                          duration: months
                        }));
                      }
                    }}
                    value={formData.startDate}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    min={formData.startDate
                      ? new Date(new Date(formData.startDate).getTime() + 28 * 24 * 60 * 60 * 1000)
                        .toISOString().split('T')[0]
                      : new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });

                      if (formData.startDate) {
                        const start = new Date(formData.startDate);
                        const end = new Date(e.target.value);
                        const diffTime = Math.abs(end - start);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        const months = Math.ceil(diffDays / 30);
                        setFormData(prev => ({
                          ...prev,
                          duration: months
                        }));
                      }
                    }}
                    value={formData.endDate}
                  />
                </div>

                {errors.dates && (
                  <div className="col-span-2 text-red-400 text-sm">
                    {errors.dates}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div {...getRootProps()} className="border-2 border-dashed border-gray-600 p-8 text-center rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input {...getInputProps()} />
                  <p className="text-gray-300">Drag & drop profile picture (max 2MB) and resume (max 5MB) here, or click to select</p>
                  <p className="text-xs text-gray-400 mt-2">Accepted: JPG, PNG, PDF</p>

                  {previewImage && (
                    <div className="mt-4">
                      <Image width={200} height={200} src={previewImage} alt="Profile Preview" className="w-32 h-32 rounded-full mx-auto object-cover" />
                    </div>
                  )}
                  {formData.resume && (
                    <p className="mt-2 text-green-400">Resume uploaded: {formData.resume.name}</p>
                  )}
                </div>

                {resumeText && (
                  <div className="bg-gray-700 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <h3 className="font-bold mb-2">Resume Preview:</h3>
                    <p className="text-sm opacity-75">{resumeText.substring(0, 500)}...</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Personal Information</h3>
                    <p><span className="text-gray-400">Name:</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="text-gray-400">Email:</span> {formData.email}</p>
                    <p><span className="text-gray-400">Phone:</span> {formData.phone}</p>
                    <p><span className="text-gray-400">Address:</span> {formData.address || 'Not provided'}</p>
                    <p><span className="text-gray-400">Gender:</span> {formData.gender || 'Not specified'}</p>
                    <p><span className="text-gray-400">DOB:</span> {formData.dob || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Education Information</h3>
                    <p><span className="text-gray-400">University:</span> {formData.university || 'Not selected'}</p>
                    <p><span className="text-gray-400">Department:</span> {formData.department || 'Not selected'}</p>
                    <p><span className="text-gray-400">Domain:</span> {formData.domain || 'Not selected'}</p>
                    <p><span className="text-gray-400">Experience:</span> {formData.tasks || 'Not provided'}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Internship Details</h3>
                  <p><span className="text-gray-400">Duration:</span> {formData.duration} months</p>
                  <p><span className="text-gray-400">Period:</span> {formData.startDate || 'Not set'} to {formData.endDate || 'Not set'}</p>
                  <p><span className="text-gray-400">LinkedIn:</span> {formData.linkedin || 'Not provided'}</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Your Login Credentials</h3>
                  <p><span className="text-gray-400">Username:</span> {credentials.username || formData.username || 'Will be generated'}</p>
                  <p><span className="text-gray-400">Password:</span> {credentials.password || formData.password ? '••••••••' : 'Will be generated'}</p>
                  <p className="text-yellow-400 text-sm mt-2">Please save these credentials securely!</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between w-full mt-8 space-x-4">
              {step > 1 ? (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Back
                </button>
              ) : (
                <div className="w-24" />
              )}

              <div className="flex space-x-3">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    onClick={() => handleStepChange(num)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Credentials Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-green-400">Registration Successful!</h2>
            <p className="mb-4">Your account has been created. Please download your credentials for future reference.</p>
            
            <div className="bg-gray-700 p-4 rounded mb-4">
              <p className="font-semibold">Username: <span className="text-blue-300">{credentials.username}</span></p>
              <p className="font-semibold">Password: <span className="text-blue-300">{credentials.password}</span></p>
              <p className="text-sm text-yellow-400 mt-2">You will need these credentials to login to your account.</p>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  setCredentials({ username: "", password: "" });
                  router.push('/Login');
                }}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
              >
                Skip Download
              </button>
              <button
                ref={downloadRef}
                onClick={downloadCredentials}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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