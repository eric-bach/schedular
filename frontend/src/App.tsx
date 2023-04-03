import { Authenticator } from '@aws-amplify/ui-react';

import { RequireAuth } from './RequireAuth';
import { Login } from './components/Login';
import Home from './pages/Home/Home';
import { Header } from './Header';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Services from './pages/Home/Services';
import Pricing from './pages/Home/Pricing';
import Booking from './pages/Booking/Booking';
import Confirmation from './pages/Booking/Confirmation';
import Appointments from './pages/User/Appointments';
import Profile from './pages/User/Profile';

function App() {
  return (
    <Authenticator.Provider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Header />}>
            <Route index element={<Home />} />
            <Route path='/services' element={<Services />} />
            <Route path='/pricing' element={<Pricing />} />
            <Route
              path='/booking'
              element={
                <RequireAuth>
                  <Booking />
                </RequireAuth>
              }
            />
            <Route
              path='/confirmation/:id'
              element={
                <RequireAuth>
                  <Confirmation />
                </RequireAuth>
              }
            />
            <Route
              path='/user/profile'
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path='/user/appointments'
              element={
                <RequireAuth>
                  <Appointments />
                </RequireAuth>
              }
            />
            <Route path='/login' element={<Login />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Authenticator.Provider>
  );
}

export default App;
