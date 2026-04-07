import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation/index';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const App: React.FC = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '766157273309-sgmv3spto8skbmkn81kp0atcgprha8ol.apps.googleusercontent.com',
      iosClientId:
        '766157273309-64gqragq2b6e3pde2m72i73c4mi327er.apps.googleusercontent.com',
    });
  }, []);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default App;
