import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Chat from "./pages/chat";
import Setting from "./pages/setting";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/setting" element={<Setting />}></Route>
      </Routes>
    </Router>
  );
}

export default App
