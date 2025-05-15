import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const Form = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    // Submit to API or handle form logic
  };

  return (
    <div className="w-full md:max-w-xl mx-auto p-6 bg-white shadow-md mt-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        Internship Details Form
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="e.g. 3rd Year"
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (Weeks)</label>
            <input
              type="number"
              name="durationWeeks"
              value={formData.durationWeeks}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              required
            />
          </div>

          {/* Domain */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Internship Domain</label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="e.g. Web Development, AI, Networking"
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:outline-none"
            placeholder="Write a brief about your internship experience..."
            required
          ></textarea>
        </div>

        {/* Start & End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <DatePicker
              selected={formData.startDate ? new Date(formData.startDate) : null}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: date ? format(date, "dd MMM yyyy") : "",
                }))
              }
              dateFormat="dd MMM yyyy"
              placeholderText="Select Start Date"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
          <div>
            <DatePicker
              selected={formData.endDate ? new Date(formData.endDate) : null}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  endDate: date ? format(date, "dd MMM yyyy") : "",
                }))
              }
              dateFormat="dd MMM yyyy"
              placeholderText="Select End Date"
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default Form;
