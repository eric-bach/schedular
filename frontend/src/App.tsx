import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home/Home';
import { Header } from './Header';
import { Login } from './components/Login';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdminAuth } from './components/RequireAdminAuth';
import Calendar from './pages/Booking/Calendar';
import Confirmation from './pages/Booking/Confirmation';
import Pricing from './pages/Home/Pricing';
import Services from './pages/Home/Services';
import Bookings from './pages/User/Bookings';
import Profile from './pages/User/Profile';
import ManageBookings from './pages/Admin/ManageBookings';
import ManageCustomer from './pages/Admin/ManageCustomer';
import ManageCustomers from './pages/Admin/ManageCustomers';
import ManageSchedule from './pages/Admin/ManageSchedule';

import './style.css';

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
              path='/calendar'
              element={
                <RequireAuth>
                  <Calendar />
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
              path='/user/bookings'
              element={
                <RequireAuth>
                  <Bookings />
                </RequireAuth>
              }
            />
            <Route
              path='/admin/customers'
              element={
                <RequireAdminAuth>
                  <ManageCustomers />
                </RequireAdminAuth>
              }
            />
            <Route
              path='/admin/customer/:id'
              element={
                <RequireAdminAuth>
                  <ManageCustomer />
                </RequireAdminAuth>
              }
            />
            <Route
              path='/admin/bookings'
              element={
                <RequireAdminAuth>
                  <ManageBookings />
                </RequireAdminAuth>
              }
            />
            <Route
              path='/admin/schedule'
              element={
                <RequireAdminAuth>
                  <ManageSchedule />
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
