import { Route, Routes } from 'react-router-dom';
import Booking from './pages/Booking/Booking';
import Confirmation from './pages/Booking/Confirmation';
import Home from './pages/Home/Home';
import Services from './pages/Home/Services';
import Pricing from './pages/Home/Pricing';
import Profile from './pages/User/Profile';
import Appointments from './pages/User/Appointments';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/services' element={<Services />} />
      <Route path='/pricing' element={<Pricing />} />
      <Route path='/booking' element={<Booking />} />
      <Route path='/user/profile' element={<Profile />} />
      <Route path='/user/appointments' element={<Appointments />} />
      <Route path='/confirmation/:id' element={<Confirmation />} />
    </Routes>
  );
}

export default App;
