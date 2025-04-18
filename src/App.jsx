import './styles/index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Loginpage from './pages/Loginpage';
import Registerpage from './pages/Registerpage';
import Destinationpage from './pages/Destinationpage';
import Vacationpage from './pages/Vacationpage';
import Userpage from './pages/Userpage';
import Bookingpage from './pages/Bookingpage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/login' element={<Loginpage />} />
        <Route path='/register' element={<Registerpage />} />
        <Route path='/dest' element={<Destinationpage />} />
        <Route path='/vac' element={<Vacationpage />} />
        <Route path='/usr' element={<Userpage />} />
        <Route path='/book' element={<Bookingpage />} />
      </Routes>
    </Router>
  );
}

export default App;
