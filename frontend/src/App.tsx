import { Route, Routes } from 'react-router-dom';
import Booking from './Booking';
import Home from './Home';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/booking' element={<Booking />} />
    </Routes>
  );
}

export default App;
