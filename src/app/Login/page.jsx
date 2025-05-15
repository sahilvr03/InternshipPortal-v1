"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const newErrors = {};
    if (!email) newErrors.email = "Email or username is required";
    if (!password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    
    // If there are errors, stop form submission
    if (Object.keys(newErrors).length > 0) return;
    
    try {
      setLoading(true);
      
      // Use the login function from AuthContext
      const result = await login(email, password);
      
      // Redirect based on user role
      if (result.success) {
        if (result.role === "admin") {
          router.push("/Admin/dashboard");
        } else {
          router.push("/pages/Student");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ 
        general: error.message || "Login failed. Please check your credentials." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div id="particles-js" className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md bg-gray-800 bg-opacity-90 backdrop-blur-lg p-8 rounded-xl shadow-2xl mx-4 my-8">
          <h1 className="text-4xl h-[44] font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Login
          </h1>

          {errors.general && (
            <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-400 text-red-300 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Email or Username *"
                className="w-full p-3 bg-gray-700 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="text-red-400 text-sm">{errors.email}</span>}
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Password *"
                className="w-full p-3 bg-gray-700 rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <span className="text-red-400 text-sm">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/Register")}
                className="text-blue-400 hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}