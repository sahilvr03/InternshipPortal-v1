"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ✅ Dynamically import Lottie only on the client
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import splashAnimation from "../../public/animations/splash.json"; // adjust path if needed

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/Register");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-blue-600 mb-4 tracking-wide">
        Smart City Lab
      </h1>
      <h2 className="text-lg sm:text-2xl md:text-3xl text-gray-800 font-medium mb-2">
        National Centre of Artificial Intelligence
      </h2>
      <p className="text-gray-500 text-base sm:text-lg mb-8">
        Empowering cities through innovation and intelligence.
      </p>

      {/* Lottie Animation */}
      <div className="w-48 sm:w-64 md:w-72">
        <Lottie animationData={splashAnimation} loop={true} />
      </div>
    </div>
  );
}
