import { StatusBar } from 'expo-status-bar';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'
import { useState } from 'react';
import { Cabecalho, } from './Componente';

import { useNavigation } from '@react-navigation/native';
import { cores } from './tema';

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

      <StatusBar style="light" />


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
              placeholderTextColor={cores.placeholder}
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
              placeholderTextColor={cores.placeholder}
              onChangeText={setSenha}
              value={senha}
              secureTextEntry
            />

            {erroLogin ? <Text accessibilityRole="alert" style={styles.erro}>{erroLogin}</Text> : null}

            <View style={styles.botao}>
              <TouchableOpacity
                style={styles.botaoPrimario}
                accessibilityRole="button"
                onPress={fazerLogin}
              >
                <Text style={styles.textoBotaoPrimario}>Login</Text>
              </TouchableOpacity>
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
    backgroundColor: cores.preto,
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
  imagem: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: cores.dourado,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.dourado,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: cores.roxoClaro,
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
    color: cores.dourado,
    marginBottom: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: cores.roxo,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: cores.pretoCard,
    borderRadius: 5,
    color: cores.branco,
    width: '100%',
  },
  erro: {
    color: cores.dourado,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  botao: {
    marginTop: 15,
    borderRadius: 5,
    overflow: 'hidden',
  },
  botaoPrimario: {
    backgroundColor: cores.dourado,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  textoBotaoPrimario: {
    color: cores.preto,
    fontWeight: 'bold',
    fontSize: 16,
  },
  criarConta: {
    backgroundColor: cores.roxo,
    borderWidth: 2,
    borderColor: cores.dourado,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  textoCriarConta: {
    color: cores.branco,
    fontWeight: 'bold',
  },
  espacoFinal: {
    height: 200,
  },
});
