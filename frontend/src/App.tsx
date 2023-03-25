import { Route, Routes } from 'react-router-dom';
import Booking from './pages/Booking/Booking';
import Home from './pages/Home/Home';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/booking' element={<Booking />} />
    </Routes>
  );
}

export default App;
