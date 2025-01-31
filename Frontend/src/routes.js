import Login from './views/auth/Login'; // Adjust the path as needed
import Signup from './views/auth/Signup'; // Adjust the path as needed
import Dashboard from './views/maindashboard/Dashboard.jsx'
import Documents from './views/maindashboard/Documents.jsx'

const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/signup',
    component: Signup,
  },
  {
    path :'/dashboard',
    component :Dashboard,
  },
  {
    path :'/documents',
    component :Documents
  }
//   {
//     path: '/',
//     component: Login,
//   },
  
  // Add other routes here
];

export default routes;