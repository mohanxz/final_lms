import React, { useState, useEffect } from "react";
import API from "../api";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaGraduationCap,
  FaUsers,
  FaBook,
  FaChalkboardTeacher,
  FaUserCircle,
  FaIdCard,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaCheckCircle,
  FaSpinner,
  FaDownload,
  FaChartLine
} from "react-icons/fa";
import { FadeIn, SlideUp } from "../../../shared/LoadingComponents";

const StudentSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 animate-pulse"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-36 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Info = ({ label, value, icon: Icon }) => (
  <div className="group">
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
      {Icon && (
        <div className="mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
            <Icon className="text-white text-sm" />
          </div>
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-gray-800 dark:text-gray-200 mt-1 font-medium break-all">
          {value || "-"}
        </p>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
      {value}
    </p>
    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
      {title}
    </p>
  </div>
);

const Student = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [uniqueBatches, setUniqueBatches] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    batch: "",
    course: "",
    address: "",
  });
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  // Course code to full name mapping
  const courseMapping = {
    FS: "Full Stack Development",
    DS: "Data Science",
    DA: "Data Analytics",
    TT: "Tech Trio",
    FSD: "Full Stack Development",
    MERN: "MERN Stack",
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    updateFilteredBatches();
  }, [selectedCourse, uniqueBatches]);

  useEffect(() => {
    filterStudents();
  }, [searchText, selectedCourse, selectedBatch, selectedYear, students]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStudents(), fetchBatches(), fetchCourses()]);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentList = res.data;

      const sortedStudents = studentList.sort(
        (a, b) => (a.rollNo || 0) - (b.rollNo || 0),
      );

      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);

      const courses = [...new Set(studentList.map((s) => s.course))];
      const batches = [...new Set(studentList.map((s) => s.batch))];

      const years = [
        ...new Set(
          studentList.map((s) => getYearFromBatchName(s.batch)).filter(Boolean),
        ),
      ].sort((a, b) => b.localeCompare(a));

      setUniqueCourses(courses);
      setUniqueBatches(batches);
      setUniqueYears(years);
      setFilteredBatches(batches);
    } catch (err) {
      console.error("Failed to fetch students", err);
      throw err;
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const getYearFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    if (parts.length >= 2) {
      const monthYear = parts[1];
      return monthYear.slice(-2);
    }
    return null;
  };

  const getCourseFromBatchName = (batchName) => {
    if (!batchName) return null;
    const parts = batchName.split("-");
    return parts[0];
  };

  const updateFilteredBatches = () => {
    if (selectedCourse === "All") {
      setFilteredBatches(uniqueBatches);
    } else {
      const courseCode = Object.keys(courseMapping).find(
        (code) => courseMapping[code] === selectedCourse,
      );

      if (courseCode) {
        const courseBatches = uniqueBatches.filter(
          (batch) => getCourseFromBatchName(batch) === courseCode,
        );
        setFilteredBatches(courseBatches);
      } else {
        setFilteredBatches([]);
      }
    }
    setSelectedBatch("All");
  };

  const filterStudents = () => {
    const filtered = students.filter((student) => {
      const nameMatch = student.user?.name
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
      const emailMatch = student.user?.email
        ?.toLowerCase()
        .includes(searchText.toLowerCase());
      const searchMatch = searchText === "" || nameMatch || emailMatch;

      const courseMatch =
        selectedCourse === "All" || student.course === selectedCourse;
      const batchMatch =
        selectedBatch === "All" || student.batch === selectedBatch;

      const studentYear = getYearFromBatchName(student.batch);
      const yearMatch = selectedYear === "All" || studentYear === selectedYear;

      return searchMatch && courseMatch && batchMatch && yearMatch;
    });
    setFilteredStudents(filtered);
  };

  const handleAddClick = () => {
    setModalMode("add");
    setFormData({
      name: "",
      email: "",
      phone: "",
      dob: "",
      batch: "",
      course: "",
      address: "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleEditClick = (student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormData({
      name: student.user?.name || "",
      email: student.user?.email || "",
      phone: student.phone || "",
      dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
      batch: student.batch || "",
      course: student.course || "",
      address: student.address || "",
    });
    setIsAddEditModalOpen(true);
  };

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.dob ||
      !formData.batch
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      if (modalMode === "add") {
        const studentData = [
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            dob: formData.dob,
            address: formData.address || "Not provided",
            batch: formData.batch,
            course: formData.course || "",
          },
        ];

        const res = await API.post("/api/students/save-selected", studentData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (
          res.data.results &&
          res.data.results.added &&
          res.data.results.added.length > 0
        ) {
          const assignedRoll = res.data.results.added[0].rollNo;
          toast.success(`Student ${formData.name} added successfully! Roll No: ${assignedRoll}`);
        } else {
          toast.success(`Student ${formData.name} added successfully!`);
        }

        if (res.data.credentials && res.data.credentials.length > 0) {
          downloadCredentials(res.data.credentials);
        }
      } else {
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          address: formData.address || "Not provided",
          batch: formData.batch,
          course: formData.course || "",
          rollNo: selectedStudent.rollNo,
        };

        await API.put(`/api/students/${selectedStudent._id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Student ${formData.name} updated successfully!`);
      }

      await fetchStudents();
      setIsAddEditModalOpen(false);
    } catch (err) {
      console.error("Error saving student:", err);
      toast.error(err.response?.data?.error || "Error saving student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/api/students/${selectedStudent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Student ${selectedStudent.user?.name} deleted successfully!`);
      await fetchStudents();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Error deleting student:", err);
      toast.error(err.response?.data?.error || "Error deleting student");
    } finally {
      setSaving(false);
    }
  };

  const downloadCredentials = (credentials) => {
    try {
      const csvContent =
        "Name,Email,Password,Roll No\n" +
        credentials
          .map((c) => `${c.name},${c.email},${c.password},${c.rollNo}`)
          .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "student_credentials.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Credentials downloaded successfully!");
    } catch (err) {
      console.error("Error downloading credentials:", err);
      toast.error("Error downloading credentials");
    }
  };

  const getBatchOptions = () => {
    if (selectedCourse === "All") {
      return batches;
    } else {
      const courseCode = Object.keys(courseMapping).find(
        (code) => courseMapping[code] === selectedCourse,
      );
      return batches.filter(
        (b) => getCourseFromBatchName(b.batchName) === courseCode,
      );
    }
  };

  if (loading) {
    return <StudentSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Students</h3>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button onClick={fetchInitialData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-md">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Student Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage and track all student information</p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Minimal Blue Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Students" value={students.length} />
            <StatCard title="Total Batches" value={uniqueBatches.length} />
            <StatCard title="Total Courses" value={uniqueCourses.length} />
            <StatCard title="Active Batches" value={batches.filter((b) => new Date(b.startDate) <= new Date()).length} />
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="relative w-full lg:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Courses</option>
                  {uniqueCourses.map((course, idx) => (
                    <option key={idx} value={course}>{course}</option>
                  ))}
                </select>

                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Batches</option>
                  {filteredBatches.map((batch, idx) => (
                    <option key={idx} value={batch}>{batch}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">All Years</option>
                  {uniqueYears.map((year, idx) => (
                    <option key={idx} value={year}>20{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold">Roll No</th>
                    <th className="p-4 text-left text-sm font-semibold">Student</th>
                    <th className="p-4 text-left text-sm font-semibold">Contact</th>
                    <th className="p-4 text-left text-sm font-semibold">Course</th>
                    <th className="p-4 text-left text-sm font-semibold">Batch</th>
                    <th className="p-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <FaIdCard className="text-blue-600 dark:text-blue-400 text-xs" />
                            </div>
                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{student.rollNo}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{student.user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{student.user?.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-green-500 text-xs" />
                            <span className="text-gray-700 dark:text-gray-300">{student.phone || "-"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {student.course}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {student.batch}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewClick(student)}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                              title="View"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => handleEditClick(student)}
                              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(student)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FaSearch className="text-4xl text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400">No students found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaUserCircle />
                  Student Details
                </h3>
                <button onClick={() => setIsViewModalOpen(false)} className="text-white hover:text-gray-200 transition">
                  <FaTimes size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-xl bg-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {selectedStudent.user?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedStudent.user?.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400">{selectedStudent.user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Roll Number" value={selectedStudent.rollNo} icon={FaIdCard} />
                <Info label="Course" value={selectedStudent.course} icon={FaGraduationCap} />
                <Info label="Batch" value={selectedStudent.batch} icon={FaBook} />
                <Info label="Phone" value={selectedStudent.phone || "-"} icon={FaPhone} />
                <Info label="Date of Birth" value={selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "-"} icon={FaBirthdayCake} />
                <Info label="Address" value={selectedStudent.address || "-"} icon={FaMapMarkerAlt} />
              </div>
            </div>
            <div className="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition shadow-md">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 px-6 py-4 sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  {modalMode === "add" ? <FaPlus /> : <FaEdit />}
                  {modalMode === "add" ? "Add New Student" : "Edit Student"}
                </h3>
                <button onClick={() => setIsAddEditModalOpen(false)} className="text-white hover:text-gray-200 transition">
                  <FaTimes size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={modalMode === "edit"}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Batch</option>
                    {getBatchOptions().map((batch) => (
                      <option key={batch._id} value={batch.batchName}>{batch.batchName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Student address"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6 mt-4 border-t dark:border-gray-700">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={`flex-1 py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all ${
                    saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
                  }`}
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saving ? "Saving..." : (modalMode === "add" ? "Add Student" : "Update Student")}
                </button>
                <button
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FaTrash />
                Confirm Deletion
              </h3>
            </div>
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-600 text-3xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Are you sure you want to delete student
              </p>
              <p className="font-bold text-gray-800 dark:text-white text-lg mb-4">
                {selectedStudent.user?.name}?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                This action cannot be undone!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-md disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Student;