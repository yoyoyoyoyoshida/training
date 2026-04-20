import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PracticeHubPage from './pages/PracticeHubPage';
import NameLearnPage from './pages/NameLearnPage';
import QuizPage from './pages/QuizPage';
import TimeAttackPage from './pages/TimeAttackPage';
import ReviewPage from './pages/ReviewPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import Layout from './layouts/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice" element={<PracticeHubPage />} />
        <Route path="/practice/name-learn" element={<NameLearnPage />} />
        <Route path="/practice/quiz" element={<QuizPage />} />
        <Route path="/practice/time-attack" element={<TimeAttackPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
