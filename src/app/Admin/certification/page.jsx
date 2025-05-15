"use client";

import React, { useState } from "react";
import footer from "../../../../public/footer.jpg";
import header from "../../../../public/header.jpg";
import logo from "../../../../public/logo-copy.png";
import sign from "../../../../public/sign.jpg";
import Form from "../../components/Form";
import Navbar from "../../components/navbar";
import Sidebar from "../../components/sidebar";

// Default form data
const defaultFormData = {
  name: "",
  year: "",
  department: "",
  durationWeeks: "",
  domain: "",
  description: "",
  startDate: "",
  endDate: "",
};

export default function Page() {
  const [formData, setFormData] = useState(defaultFormData);

  const handleReset = () => {
    setFormData(defaultFormData);
  };

  const handlePrint = () => {
    const certificateElement = document.getElementById("certificate");
    if (!certificateElement) return;

    const certificateHTML = certificateElement.innerHTML;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .sign {
                width: 40%;
                height: auto;
              }
            }
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="certificate p-5">
            ${certificateHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = function () {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="w-full flex flex-row justify-center items-center gap-4 mr-2 mb-10 mt-4">
          <button
            onClick={handlePrint}
            className="h-10 bg-[#183B4E] text-white font-semibold rounded-lg p-2 hover:shadow-xl hover:scale-[1.04] duration-200 ease-in text-[12px] md:text-[16px]"
          >
            Download PDF
          </button>
          <button
            onClick={handleReset}
            className="h-10 bg-[#183B4E] rounded-lg text-white font-semibold p-2 hover:shadow-xl hover:scale-[1.04] duration-200 ease-in"
          >
            New certificate
          </button>
        </div>

        <div className="h-[88%] w-full flex flex-col md:flex-row justify-center items-center mb-4">
          {/* Certificate Preview */}
          <div className="w-full h-full flex flex-col justify-between items-center p-1 md:w-[70%]">
            <div
              className="h-full w-full md:w-[65%] shadow-xl flex flex-col"
              id="certificate"
            >
              <img src={header.src} alt="Header" className="w-full h-auto" />

              <div className="flex-grow text-[12px] p-10 pt-3 pb-3 bg-white">
                <p className="text-justify">
                  This is to certify that{" "}
                  <span className="font-semibold">{formData.name}</span>, a{" "}
                  {formData.year} student enrolled in the Department of{" "}
                  {formData.department} at NED University of Engineering & Technology,
                  has successfully completed {formData.durationWeeks} week internship
                  at Smart City Lab, NCAI, NEDUET.
                </p>

                <p className="text-justify mt-3">
                  During this period,{" "}
                  <span className="font-semibold">Mr. {formData.name}</span>{" "}
                  contributed as a {formData.domain} intern.
                  {formData.description}
                </p>

                <p className="mt-3">
                  The internship spanned from {formData.startDate} to{" "}
                  {formData.endDate}.
                </p>

                <div className="flex flex-col w-[45%] ml-2 text-[12px] mt-4">
                  <img src={sign.src} alt="Signature" className="sign" />
                  <div className="font-semibold">Fatima Shah</div>
                  <div>Team Lead</div>
                  <div>Smart City Lab, NCAI, NEDUET</div>
                </div>
              </div>

              <img src={footer.src} alt="Footer" className="w-full h-auto" />
            </div>
          </div>

          {/* Form Editor */}
          <div className="w-full md:w-[50%] h-full mr-7">
            <Form formData={formData} setFormData={setFormData} />
          </div>
        </div>
      </div>
    </div>
  );
}
