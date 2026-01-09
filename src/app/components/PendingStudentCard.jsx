"use client";

export default function PendingStudentCard({
  student,
  onAccept,
  onReject,
  loading,
  isExpanded,
  onToggleExpand,
}) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Compact View */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Student Avatar & Basic Info */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {student.name?.charAt(0) || "S"}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                  {student.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {student.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                 
                  <span className="text-xs text-gray-500">
                    Applied: {formatDate(student.createdAt || new Date())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Program */}
          <div className="md:col-span-2">
            <div className="md:hidden text-sm text-gray-500 mb-1">Program</div>
            <div className="font-medium text-gray-700 dark:text-gray-200">
              {student.program}
            </div>
          </div>

          {/* University */}
          <div className="md:col-span-3">
            <div className="md:hidden text-sm text-gray-500 mb-1">University</div>
            <div className="font-medium text-gray-700 dark:text-gray-200 truncate">
              {student.university}
            </div>
          </div>
         

          {/* Status */}
          <div className="md:col-span-2">
            <div className="md:hidden text-sm text-gray-500 mb-1">Status</div>
            <div className="inline-flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Pending Review
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-between md:justify-end gap-2">
              <button
                onClick={onToggleExpand}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => onAccept(student._id)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                
                <button
                  disabled={loading}
                  onClick={() => onReject(student._id)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Personal Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                Personal Details
              </h4>
              <div className="space-y-2">
                <DetailItem label="Phone" value={student.phone || "Not provided"} />
                <DetailItem label="Date of Birth" value={formatDate(student.dateOfBirth) || "Not provided"} />
                <DetailItem label="Gender" value={student.gender || "Not specified"} />
                <DetailItem label="Address" value={student.address || "Not provided"} />
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                Academic Details
              </h4>
              <div className="space-y-2">
                <DetailItem label="Student ID" value={student.studentId || "Not provided"} />
                <DetailItem label="Year Level" value={student.yearLevel || "Not specified"} />
                <DetailItem label="GPA" value={student.gpa || "Not provided"} />
                <DetailItem label="Faculty" value={student.faculty || "Not specified"} />
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                Additional Information
              </h4>
              <div className="space-y-2">
                <DetailItem label="Emergency Contact" value={student.emergencyContact || "Not provided"} />
                <DetailItem label="Registration Date" value={formatDate(student.registrationDate)} />
                <DetailItem label="Document Status" value={
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    student.documentsVerified 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}>
                    {student.documentsVerified ? "Verified" : "Pending Verification"}
                  </span>
                } />
              </div>
            </div>
          </div>

          {/* Notes (if any) */}
          {student.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide mb-2">
                Notes
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                {student.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for detail items
function DetailItem({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {value}
      </span>
    </div>
  );
}