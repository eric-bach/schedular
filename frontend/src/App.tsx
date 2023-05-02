import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home/Home';
import { Header } from './Header';
import { Login } from './components/Login';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdminAuth } from './components/RequireAdminAuth';
import Services from './pages/Home/Services';
import Pricing from './pages/Home/Pricing';
import Booking from './pages/Booking/Booking';
import Confirmation from './pages/Booking/Confirmation';
import UserAppointments from './pages/User/UserAppointments';
import Profile from './pages/User/Profile';
import Appointments from './pages/Admin/Appointments';
import Schedule from './pages/Admin/Schedule';
import Test from './pages/Admin/Test';

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
                  <UserAppointments />
                </RequireAuth>
              }
            />
            <Route
              path='/admin/appointments'
              element={
                <RequireAdminAuth>
                  <Appointments />
                </RequireAdminAuth>
              }
            />
            <Route
              path='/admin/schedule'
              element={
                <RequireAdminAuth>
                  <Schedule />
                </RequireAdminAuth>
              }
            />
            <Route
              path='/admin/test'
              element={
                <RequireAdminAuth>
                  <Test />
                </RequireAdminAuth>
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
