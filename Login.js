import { StatusBar } from 'expo-status-bar';

import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';

import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from './firebase'
import { useState } from 'react';
import {Cabecalho,} from './Componente';

import { useNavigation } from '@react-navigation/native';

const imagemGatinho = `https://cataas.com/cat?width=260&height=260&random=${Date.now()}`;

export function Login() {
  const navigation = useNavigation();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  async function fazerLogin() {
    setErroLogin('');
    try {
      await signInWithEmailAndPassword(auth, login.trim(), senha);
      navigation.navigate('Home');
    } catch {
      setErroLogin('Não foi possível entrar. Verifique seu e-mail, senha e conexão.');
    }
  }

  return (
    <View style={styles.container}>

      <StatusBar style="dark" />

      
      <Cabecalho />

      
      <View style={styles.areaScroll}>

        <ScrollView contentContainerStyle={styles.scrollContent}>


          <Image
            source={{ uri: imagemGatinho }}
            style={styles.imagem}
          />

          <Text style={styles.titulo}>
            Bem-vindo!
          </Text>


          <Text style={styles.subtitulo}>
            Faça login para conhecer os gatinhos disponíveis para adoção!
          </Text>
          
          <View style={styles.formulario}>

           
            <Text style={styles.label}>
              E-mail
            </Text>

            <TextInput
              style={styles.input}
              onChangeText={setLogin}
              value={login}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#555"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

           
            <Text style={styles.label}>
              Senha
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#555"
              onChangeText={setSenha}
              value={senha}
              secureTextEntry
            />

            {erroLogin ? <Text accessibilityRole="alert">{erroLogin}</Text> : null}

            <View style={styles.botao}>
              <Button
                color="black"
                onPress={fazerLogin}
                title="Login "
              />
            </View>
            
            <View style={styles.botao}>
              <TouchableOpacity
                style={styles.criarConta}
                accessibilityRole="button"
                onPress={() => navigation.navigate('Cadastro')}
              >
                <Text style={styles.textoCriarConta}>Criar uma conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.espacoFinal} />
        </ScrollView>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f6efef',
  },


  areaScroll: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },

  scroll: {
    flex: 1,
    width: '100%',
  },


  scrollContent: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 100,
    paddingHorizontal: 20,


    flexGrow: 1,
  },

  /*
   * IMAGEM
   */
  imagem: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: 20,
  },


  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 400,
  },


  formulario: {
    width: '100%',
    maxWidth: 400,
  },


  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },

  
  input: {
    borderWidth: 2,
    borderColor: 'black',
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    color: 'black',
    width: '100%',
  },


  botao: {
    marginTop: 15,
    borderRadius: 5,
    overflow: 'hidden',
  },


  criarConta: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },

  textoCriarConta: {
    color: 'white',
    fontWeight: 'bold',
  },

  espacoFinal: {
    height: 200,
  },

});
