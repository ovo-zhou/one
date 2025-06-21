import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from '../pages/home';
export default function RouterMap(){
  return <Router>
    <Routes>
      <Route path='/' element={<Home/>}/>
    </Routes>
  </Router>
}