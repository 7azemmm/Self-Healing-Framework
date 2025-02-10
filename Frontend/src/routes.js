import Login from './views/auth/login.jsx'; // Adjust the path as needed
import Signup from './views/auth/Signup'; // Adjust the path as needed
import Dashboard from './views/maindashboard/Dashboard.jsx';
import Documents from './views/maindashboard/Documents.jsx';
import Execute from './views/maindashboard/Execute.jsx';
import Settings from './views/maindashboard/Settings.jsx';
import AddScenario from './views/addScenario/addScenarioPage.jsx';
import CreateProject from './views/maindashboard/CreateProject.jsx'; // Add this line

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
    path: '/dashboard',
    component: Dashboard,
  },
  {
    path: '/documents',
    component: Documents,
  },
  {
    path: '/execute',
    component: Execute,
  },
  {
    path: '/settings',
    component: Settings,
  },
  {
    path: '/',
    component: Login,
  },
  {
    path: '/add-scenario',
    component: AddScenario,
  },
  {
    path: '/create-project', // Add this route
    component: CreateProject,
  },
];

export default routes;