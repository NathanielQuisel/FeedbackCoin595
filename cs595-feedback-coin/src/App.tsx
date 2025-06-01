// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './Welcome';
import Login from './Login';
import CreateAcc from './CreateAcc';
import Dashboard from './Dashboard'; 
import CreateClass from './CreateClass';
import JoinClass from './JoinClass';
import SubmitFeedback from "./SubmitFeedback";
import CollectCoin from "./CollectCoin";
import EnterDailyPassword from "./EnterDailyPassword";
import ViewFeedback from "./ViewFeedback";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/createAcc" element={<CreateAcc />} />
        <Route path="/dashboard" element={<Dashboard />} /> 
        <Route path="/create-class" element={<CreateClass />} />
        <Route path="/join-class" element={<JoinClass />} />
        <Route path="/submit-feedback" element={<SubmitFeedback />} />
        <Route path="/collect-coin" element={<CollectCoin />} />
        <Route path="/enter-daily-password" element={<EnterDailyPassword />} />
        <Route path="/view-feedback" element={<ViewFeedback />} />
      </Routes>
    </Router>
  );
}

export default App;
