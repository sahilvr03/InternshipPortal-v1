"use client"
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import axios from 'axios';


export default function InternshipPortal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

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
    // Fields needed for backend registration
    name: "",
    username: "",
    password: "",
    duration: 3,
    tasks: ""
  });

  const universities = ["Karachi University", "IBA Karachi", "NED University", "FAST Karachi", "SZABIST Karachi", "LUMS", "UET Lahore", "GIKI", "NUST", "COMSATS Islamabad", "UET Peshawar", "UET Taxila", "UET Faisalabad", "UET Gujranwala"];
  const domains = ["AI", "Machine Learning", "Web Development", "Mobile Development", "Data Science"];
  const departments = ["Computer Science", "Software Engineering", "Information Technology", "Data Engineering"];

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

  const handleChange = (e) => {
    const { name, value, files } = e.target;

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

      // Update the 'name' field for backend registration when firstName changes
      if (name === 'firstName' || name === 'lastName') {
        const fullName = name === 'firstName'
          ? `${value} ${formData.lastName}`
          : `${formData.firstName} ${value}`;

        setFormData(prev => ({
          ...prev,
          name: fullName.trim()
        }));
      }

      if (name === 'tasks') {
        setFormData(prev => ({
          ...prev,
          tasks: value
        }));
      }

      // Calculate duration from start and end dates
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
      'image/*': ['.jpeg', '.png']
    },
    onDrop: async ([file]) => {
      if (!file) return;

      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        setPreviewImage(imageUrl);
        setFormData(prev => ({ ...prev, profilePic: file }));
      }
      else if (file.type === "application/pdf") {
        // Handle resume upload
        setFormData(prev => ({ ...prev, resume: file }));

        try {
          // Optional: Parse PDF content if you have that API endpoint
          const formData = new FormData();
          formData.append("file", file);

          try {
            const response = await fetch("/api/parse-pdf", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();
            if (data.text) {
              setResumeText(data.text);
            }
          } catch (error) {
            // If PDF parsing fails, just show filename
            setResumeText(`File selected: ${file.name}`);
          }
        } catch (error) {
          console.error("Error processing PDF:", error);
        }
      }
    }
  });

  const validateStep = () => {
    let stepErrors = {};

    if (step === 1) {
      if (!formData.firstName) stepErrors.firstName = "First Name is required";
      if (!formData.phone) stepErrors.phone = "Phone Number is required";
      if (!formData.email) stepErrors.email = "Email is required";
      if (!formData.email.match(/^[\w-]+@[\w-]+\.[\w-]+$/)) stepErrors.email = "Invalid email";
      if (!formData.phone.match(/^\d{11}$/)) stepErrors.phone = "Invalid phone number";

      // Always generate username and password when validating step 1
      const generatedUsername = formData.firstName.toLowerCase().replace(/\s+/g, '') +
        Math.floor(Math.random() * 1000);
      const randomPassword = Math.random().toString(36).slice(-8);

      setFormData(prev => ({
        ...prev,
        username: generatedUsername,
        password: randomPassword
      }));
    }

    if (step === 2) {
      if (!formData.university) stepErrors.university = "University selection is required";
      if (!formData.domain) stepErrors.domain = "Domain is required";
      if (!formData.startDate) stepErrors.dates = "Start date is required";
      if (!formData.endDate) stepErrors.dates = "End date is required";

      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 28) {
          stepErrors.dates = "Minimum internship duration is 4 weeks";
        }
        if (start > end) {
          stepErrors.dates = "End date must be after start date";
        }
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateDates = () => {
    if (!formData.startDate || !formData.endDate) {
      setErrors({ ...errors, dates: "Both dates are required" });
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 28) {
      setErrors({ ...errors, dates: "Minimum internship duration is 4 weeks" });
      return false;
    }

    if (start > end) {
      setErrors({ ...errors, dates: "End date must be after start date" });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleSubmit = async () => {
    if (!validateDates()) return;
    setLoading(true);
    setErrors({});

 try {
  const payload = {
    name: `${formData.firstName} ${formData.lastName}`.trim(),
    email: formData.email,
    username: formData.username,
    password: formData.password,
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
    // If you're not uploading files, these can be omitted or handled as URLs/strings if available
    resume: null,
    profilePic: null,
  };

  const response = await axios.post(
    'https://backend-internship-portal.vercel.app/api/interns',
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Registration successful:', response.data);
  setSuccess('Registration successful! Your application has been submitted. Redirecting to login page...');

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

  setTimeout(() => {
    router.push('/Login');
  }, 3000);

} catch (error) {
  console.error('Registration failed:', error);
  setError('Registration failed. Please try again later.');
}
finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div id="particles-js" className="absolute inset-0 pointer-events-none" />

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

          {errors.submit && (
            <div className="mb-6 bg-red-900 bg-opacity-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-200">{errors.submit}</p>
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
                <input
                  name="lastName"
                  placeholder="Last Name"
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  onChange={handleChange}
                  value={formData.lastName}
                />

                <div>
                  <input
                    name="phone"
                    placeholder="Phone Number *"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    onChange={handleChange}
                    value={formData.phone}
                  />
                  {errors.phone && <span className="text-red-400 text-sm">{errors.phone}</span>}
                </div>
                <input
                  name="address"
                  placeholder="Address"
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  onChange={handleChange}
                  value={formData.address}
                />
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

                <input
                  name="linkedin"
                  placeholder="LinkedIn Profile URL"
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  onChange={handleChange}
                  value={formData.linkedin}
                />

                {/* Hidden fields for username/password - these will be auto-generated */}
                <input type="hidden" name="username" value={formData.username} />
                <input type="hidden" name="password" value={formData.password} />
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

                <input
                  name="tasks"
                  placeholder="Previouse Experience"
                  className="w-full p-3 bg-gray-700 rounded-lg"
                  onChange={handleChange}
                  value={formData.tasks}
                />

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

                        // Calculate duration in months
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

                        // Calculate duration in months
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
                <div {...getRootProps()} className="border-2 border-dashed border-gray-600 p-8 text-center rounded-lg cursor-pointer">
                  <input {...getInputProps()} />
                  <p>Drag & drop profile picture and resume here, or click to select</p>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Personal Information</h3>
                    <p>{formData.firstName} {formData.lastName}</p>
                    <p>{formData.email}</p>
                    <p>{formData.phone}</p>

                    <div className="mt-4 p-2 bg-gray-600 rounded">
                      <p className="text-xs text-green-300">Your login credentials will be:</p>
                      <p className="text-xs">Username: {formData.username || 'Not generated yet'}</p>
                      <p className="text-xs">Password: {formData.password || 'Not generated yet'}</p>
                      <p className="text-xs mt-1 text-yellow-300">Please save these details!</p>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Education Information</h3>
                    <p>{formData.university}</p>
                    <p>{formData.department}</p>
                    <p>{formData.domain}</p>
                    {/* Display tasks */}
                    <p className="mt-1">Tasks: {formData.tasks}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Internship Period</h3>
                  <p>
                    {formData.startDate} to {formData.endDate} (
                    {Math.ceil(
                      (new Date(formData.endDate) - new Date(formData.startDate)) /
                      (1000 * 60 * 60 * 24 * 7)
                    )} weeks)
                  </p>
                  <p className="mt-1">Duration: {formData.duration} months</p>
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
                    onClick={() => setStep(num)}
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
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}