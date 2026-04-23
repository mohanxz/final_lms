import { Routes, Route, useParams } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import StudentHome from './pages/StudentHome';
import StudentChat from './pages/StudentChat';
import StudentBatch from './pages/StudentBatch';
import Sidebar from './components/Sidebar';
import { ToastContainer } from 'react-toastify';
import Settings from './pages/Settings';
import AttemptQuiz from './pages/AttemptQuiz';
import AttemptCoding from './pages/AttemptCoding';
import ReportList from './pages/ReportList';
import StudentProject from './pages/StudentProject';
import FinalAssignment from './pages/FinalAssignment';
import FinalQuizAttempt from './pages/FinalQuiz';
import FinalPractical from './pages/FinalPractical';
import AttemptPractical from './pages/AttemptPractical';



function AppRoutes() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Student Dashboard">
                <StudentHome />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/chat/:module/:type"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Chat">
                <StudentChat />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/batch/:batchId"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="My Course">
                <StudentBatch />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Chat">
                <StudentChat />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Settings">
                <Settings />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/quiz/attempt/:noteId"
          element={
            <PrivateRoute>
              <AttemptQuiz />
            </PrivateRoute>
          }
        />

        <Route
          path="/code/attempt/:noteId/:studentId"
          element={
            <PrivateRoute>
              <AttemptCoding />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="QuizReports">
                <ReportList />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/project"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Project">
                <StudentProject />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/theory"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Theory">
                <FinalAssignment />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/final-quiz/:module"
          element={
            <PrivateRoute>
              <FinalQuizAttempt />
            </PrivateRoute>
          }
        />

           <Route
          path="/practical"
          element={
            <PrivateRoute>
              <Sidebar pageTitle="Practical">
                <FinalPractical />
              </Sidebar>
            </PrivateRoute>
          }
        />

        <Route
          path="/practical/attempt/:noteId"
          element={
            <PrivateRoute>
              <AttemptPractical/>
            </PrivateRoute>
          }
        />
        </Routes>
    </>
  );
}

export default AppRoutes;
