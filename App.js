import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Login } from './Login';
import { Home } from './Home';
import Cadastro from './Cadastro';
import { CadastrarGato } from './camera';
import { MapaGatos } from './MapaGatos';
import { cores } from './tema';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: cores.preto,
            borderBottomWidth: 2,
            borderBottomColor: cores.dourado,
          },
          headerTintColor: cores.dourado,
          headerTitleStyle: { fontWeight: 'bold' },
          cardStyle: { backgroundColor: cores.preto },
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
          name="CadastrarGato"
          component={CadastrarGato}
          options={{
            title: 'Cadastrar Gato para Adoção',
          }}
        />

        <Stack.Screen
          name="MapaGatos"
          component={MapaGatos}
          options={{
            title: 'Mapa dos Gatos',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}