import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './index.css';


import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';

setupIonicReact();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      const authenticated = !!(token && userData);
      console.log(' Auth check:', { 
        token: !!token, 
        userData: !!userData, 
        authenticated 
      });
      
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

 
    checkAuthStatus();

    
    const handleAuthChange = () => {
      console.log('Auth state change detected');
      checkAuthStatus();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  // Debug
  console.log(' App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <IonApp>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/register">
            {isAuthenticated ? <Redirect to="/home" /> : <Register />}
          </Route>
          <Route exact path="/login">
            {isAuthenticated ? <Redirect to="/home" /> : <Login />}
          </Route>
          <Route exact path="/home">
            {isAuthenticated ? <Home /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/">
            <Redirect to={isAuthenticated ? "/home" : "/login"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;