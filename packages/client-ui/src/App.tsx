import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Copilot from './pages/copilot';
import JsonParse from './pages/jsonParse';
import Hosts from './pages/hosts';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Copilot />} />
        <Route path="/json-parse" element={<JsonParse />} />
        <Route path="/hosts" element={<Hosts />} />
      </Routes>
    </Router>
  );
}

export default App;
