import { Route, Routes } from 'react-router-dom';
import Booking from './pages/Booking/Booking';
import Confirmation from './pages/Booking/Confirmation';
import Home from './pages/Home/Home';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/booking' element={<Booking />} />
      <Route path='/confirmation/:id' element={<Confirmation />} />
    </Routes>
  );
}

export default App;
