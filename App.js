import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Login } from './Login';
import { Home } from './Home';
import Cadastro from './Cadastro';
import { Camera } from './camera';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: true,
        }}
        
      >
        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            title: 'Login',
          }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="Cadastro"
          component={Cadastro}
          options={{
            title: 'Cadastro',
          }}
        />

        <Stack.Screen 
          name="camera"
          component={Camera}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
