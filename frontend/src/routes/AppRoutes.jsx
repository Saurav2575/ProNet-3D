import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
const Feed = lazy(() => import('../pages/Feed'));
const Profile = lazy(() => import('../pages/Profile'));
const Network = lazy(() => import('../pages/Network'));
const Jobs = lazy(() => import('../pages/Jobs'));

const AppRoutes = () => (
  <BrowserRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}>
    <Suspense fallback={<Box sx={{p:4,textAlign:"center"}}><CircularProgress/></Box>}>
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile/:id?" element={<Profile />} />
          <Route path="/network" element={<Network />} />
          <Route path="/jobs" element={<Jobs />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRoutes;
