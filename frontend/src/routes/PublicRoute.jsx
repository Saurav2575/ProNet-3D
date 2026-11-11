import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? <Navigate to="/feed" replace /> : children;
};

export default PublicRoute;
