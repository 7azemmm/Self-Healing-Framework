import Login from './views/auth/Login'; // Adjust the path as needed
import Signup from './views/auth/Signup'; // Adjust the path as needed

const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/signup',
    component: Signup,
  },
//   {
//     path: '/',
//     component: Login,
//   },
  
  // Add other routes here
];

export default routes;