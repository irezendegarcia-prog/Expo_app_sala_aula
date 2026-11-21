import { useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { cores } from './tema';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

export default function Cadastro({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [contaCriada, setContaCriada] = useState(null);
  const cadastroEmAndamento = useRef(false);

  // useEffect para exibir o Alert quando o cadastro for salvo no useState e navegar com navigation.navigate
  useEffect(() => {
    if (contaCriada) {
      mostrarAlerta('Cadastro criado', contaCriada.mensagem);
      navigation.navigate('Home', {
        textoElemento: `Bem-vindo(a), ${contaCriada.nome}! Escolha um gatinho abaixo para adotar!`,
      });
    }
  }, [contaCriada]);

  function mostrarAlerta(titulo, mensagem) {
    if (Platform.OS === 'web') {
      window.alert(`${titulo}\n\n${mensagem}`);
    } else {
      Alert.alert(titulo, mensagem);
    }
  }

  async function finalizarCadastro() {
    if (cadastroEmAndamento.current) return;
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      mostrarAlerta('Campos obrigatórios', 'Preencha nome, e-mail e senha.');
      return;
    }

    cadastroEmAndamento.current = true;
    setEnviando(true);
    try {
      // O Firebase já autentica o usuário ao criar a conta.
      const credencial = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      let mensagem = 'Cadastro criado com sucesso! Você já está conectado.';
      try {
        await updateProfile(credencial.user, { displayName: nome.trim() });
      } catch {
        mensagem += ' Não foi possível salvar seu nome no perfil.';
      }
      setContaCriada({ nome: nome.trim(), email: email.trim(), mensagem });
    } catch (erro) {
      const mensagens = {
        'auth/email-already-in-use': 'Este e-mail já está cadastrado. Entre pela tela de login.',
        'auth/invalid-email': 'Informe um e-mail válido.',
        'auth/weak-password': 'A senha é muito fraca. Use pelo menos 6 caracteres.',
        'auth/password-does-not-meet-requirements': 'A senha não atende aos requisitos de segurança do cadastro.',
        'auth/network-request-failed': 'Falha na conexão. Verifique sua internet e tente novamente.',
        'auth/operation-not-allowed': 'O cadastro por e-mail e senha não está habilitado no Firebase.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
      };
      mostrarAlerta('Erro no cadastro', mensagens[erro.code] || `Não foi possível criar a conta (${erro.code || 'erro desconhecido'}). Tente novamente.`);
    } finally {
      cadastroEmAndamento.current = false;
      setEnviando(false);
    }
  }

  function voltarParaLogin() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Tela de Cadastro</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          onChangeText={setNome}
          value={nome}
          editable={!enviando}
          placeholder="Digite seu nome"
          placeholderTextColor={cores.placeholder}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          editable={!enviando}
          autoCorrect={false}
          placeholder="Digite seu e-mail"
          placeholderTextColor={cores.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          onChangeText={setSenha}
          value={senha}
          editable={!enviando}
          placeholder="Digite sua senha"
          placeholderTextColor={cores.placeholder}
          secureTextEntry
        />

        <View style={styles.botao}>
          <TouchableOpacity
            style={[styles.botaoPrimario, enviando && styles.botaoDesativado]}
            disabled={enviando}
            onPress={finalizarCadastro}
          >
            <Text style={styles.textoBotaoPrimario}>
              {enviando ? 'Criando conta...' : 'Confirmar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.botao}>
          <TouchableOpacity
            style={[styles.botaoSecundario, enviando && styles.botaoDesativado]}
            disabled={enviando}
            onPress={voltarParaLogin}
          >
            <Text style={styles.textoBotaoSecundario}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.preto,
  },
  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.dourado,
    marginBottom: 20,
    textAlign: 'center',
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
  botaoSecundario: {
    backgroundColor: cores.roxo,
    borderWidth: 2,
    borderColor: cores.dourado,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  textoBotaoSecundario: {
    color: cores.branco,
    fontWeight: 'bold',
  },
  botaoDesativado: {
    opacity: 0.5,
  },
});
