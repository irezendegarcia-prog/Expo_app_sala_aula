import { useState, useEffect } from 'react';
import {
  Alert,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ElementoHome } from './Componente';
import { auth, database } from './firebase';
import { signOut } from 'firebase/auth';
import { ref, push, set, onValue } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';

// Coloque sua API Key do Resend aqui (crie gratuitamente em https://resend.com/api-keys)
const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY;

const NOMES_GATOS = ['Mingau', 'Frajola', 'Luna', 'Simba', 'Nina', 'Thor', 'Mel', 'Bolinha'];
const PERSONALIDADES = [
  'Muito carinhoso e adora colo',
  'Brincalhão e cheio de energia',
  'Calmo, dócil e ótimo para apartamento',
  'Curioso e companheiro',
  'Ronrona alto e adora sachê',
  'Sociável com crianças e outros pets',
];

function mostrarAlerta(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export function Home({ route }) {
  const textoElemento = route?.params?.textoElemento ?? 'Escolha um gatinho abaixo para adotar!';
  const gatoRecemCadastrado = route?.params?.gatoRecemCadastrado ?? null;
  const navigation = useNavigation();
  const usuario = auth.currentUser;

  // Estados da API 1: TheCatAPI + Gatos cadastrados com foto/upload no Firebase
  const [gatosDisponiveis, setGatosDisponiveis] = useState([]);
  const [gatosCadastrados, setGatosCadastrados] = useState([]);
  const [carregandoGatos, setCarregandoGatos] = useState(false);
  const [gatoSelecionado, setGatoSelecionado] = useState(null);

  // Estados do formulário e Firebase + API 2: Resend
  const [emailConfirmacao, setEmailConfirmacao] = useState(usuario?.email || '');
  const [mensagemAdocao, setMensagemAdocao] = useState('');
  const [enviandoAdocao, setEnviandoAdocao] = useState(false);
  const [listaAdocoes, setListaAdocoes] = useState([]);

  // Busca os gatos na TheCatAPI (API 1)
  async function buscarGatosAPI() {
    setCarregandoGatos(true);
    try {
      const resposta = await fetch('https://api.thecatapi.com/v1/images/search?limit=6');
      const dados = await resposta.json();

      const gatosFormatados = dados.map((item, index) => ({
        id: item.id || String(index),
        url: item.url,
        nome: NOMES_GATOS[index % NOMES_GATOS.length],
        descricao: PERSONALIDADES[index % PERSONALIDADES.length],
      }));

      setGatosDisponiveis(gatosFormatados);
    } catch (erro) {
      mostrarAlerta('Erro', 'Não foi possível carregar os gatinhos da TheCatAPI.');
    } finally {
      setCarregandoGatos(false);
    }
  }

  useEffect(() => {
    buscarGatosAPI();

    // Escuta os gatos cadastrados pela tela de Upload/Câmera no Firebase
    const gatosUploadRef = ref(database, 'gatosParaAdocao');
    const cancelarGatos = onValue(gatosUploadRef, (snapshot) => {
      const dados = snapshot.val() || {};
      const lista = Object.entries(dados)
        .map(([id, item]) => ({ id, ...item }))
        .reverse();
      setGatosCadastrados(lista);
    });

    return cancelarGatos;
  }, []);

  // Carrega o histórico de adoções do usuário no Firebase Realtime Database
  useEffect(() => {
    if (!usuario) {
      setListaAdocoes([]);
      return undefined;
    }

    const adocoesRef = ref(database, `anotacoes/${usuario.uid}`);
    const cancelar = onValue(
      adocoesRef,
      (snapshot) => {
        const dados = snapshot.val() || {};
        const lista = Object.entries(dados).map(([id, item]) => ({ id, ...item }));
        setListaAdocoes(lista);
      },
      () => mostrarAlerta('Erro', 'Não foi possível carregar suas adoções do Firebase.')
    );

    return cancelar;
  }, [usuario]);

  // Envia e-mail de confirmação via API do Resend (API 2)
  async function enviarEmailResend(destinatario, gato, motivo) {
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_SUA_CHAVE_AQUI') {
      return {
        enviado: false,
        aviso: 'Adoção salva no Firebase! Para disparar o e-mail real, insira sua chave na constante RESEND_API_KEY em Home.js.',
      };
    }

    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AdoteUmMiau <onboarding@resend.dev>',
        to: [destinatario],
        subject: `Adoção Confirmada: ${gato.nome} 🐾`,
        html: `
          <div style="font-family: sans-serif; color: #222;">
            <h2>Parabéns pela adoção do(a) ${gato.nome}! 🐱</h2>
            <p>Seu pedido de adoção foi registrado com sucesso no <strong>AdoteUmMiau</strong>.</p>
            <p><strong>Perfil do gatinho:</strong> ${gato.descricao}</p>
            <p><strong>Sua mensagem:</strong> ${motivo}</p>
            <img src="${gato.url}" alt="${gato.nome}" style="width: 240px; border-radius: 12px; margin-top: 10px;" />
          </div>
        `,
      }),
    });

    if (!resposta.ok) {
      const erroDados = await resposta.json().catch(() => ({}));
      throw new Error(erroDados?.message || 'Falha ao enviar e-mail pelo Resend.');
    }

    return { enviado: true };
  }

  // Confirma a adoção: salva no Firebase e dispara o e-mail no Resend
  async function confirmarAdocao() {
    if (!usuario) {
      mostrarAlerta('Sessão encerrada', 'Faça login novamente para confirmar uma adoção.');
      navigation.replace('Login');
      return;
    }
    if (!gatoSelecionado) {
      mostrarAlerta('Escolha um gatinho', 'Toque em "Escolher este" em um dos gatinhos da lista acima.');
      return;
    }
    if (!emailConfirmacao.trim() || !mensagemAdocao.trim()) {
      mostrarAlerta('Campos obrigatórios', 'Preencha o e-mail de confirmação e o motivo da adoção.');
      return;
    }

    setEnviandoAdocao(true);
    try {
      // 1. Salva no Firebase Realtime Database
      const listaRef = ref(database, `anotacoes/${usuario.uid}`);
      const novaAdocaoRef = push(listaRef);
      await set(novaAdocaoRef, {
        titulo: `Gato: ${gatoSelecionado.nome}`,
        descricao: mensagemAdocao.trim(),
        fotoUrl: gatoSelecionado.url,
        email: emailConfirmacao.trim(),
      });

      // 2. Envia o e-mail pela API do Resend
      try {
        const resultadoEmail = await enviarEmailResend(
          emailConfirmacao.trim(),
          gatoSelecionado,
          mensagemAdocao.trim()
        );

        if (resultadoEmail.enviado) {
          mostrarAlerta(
            'Adoção Confirmada! 🐾',
            `Você adotou ${gatoSelecionado.nome}! Um e-mail de confirmação foi enviado para ${emailConfirmacao.trim()}.`
          );
        } else {
          mostrarAlerta('Adoção Registrada! 🐾', resultadoEmail.aviso);
        }
      } catch (erroEmail) {
        mostrarAlerta(
          'Adoção salva no banco!',
          `O registro foi salvo no Firebase, mas houve um detalhe no envio do e-mail via Resend: ${erroEmail.message}`
        );
      }

      setGatoSelecionado(null);
      setMensagemAdocao('');
    } catch {
      mostrarAlerta('Erro', 'Não foi possível salvar a adoção no Firebase.');
    } finally {
      setEnviandoAdocao(false);
    }
  }

  async function voltarParaLogin() {
    try {
      await signOut(auth);
    } catch {
      // Continua para a tela de login mesmo se o signOut falhar
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.texto}>Central de Adoção 🐱</Text>
      <ElementoHome texto={textoElemento} />

      {/* Card em destaque quando o usuário acabou de cadastrar um gato via navigation.navigate */}
      {gatoRecemCadastrado && (
        <View style={styles.destaqueRecemCadastrado}>
          <Text style={styles.tituloDestaque}>Último Gato Cadastrado por Você ✨</Text>
          <Image source={{ uri: gatoRecemCadastrado.url }} style={styles.fotoDestaque} />
          <Text style={styles.nomeGato}>{gatoRecemCadastrado.nome}</Text>
          <Text style={styles.detalheDestaque}>Idade: {gatoRecemCadastrado.idade} | Sexo: {gatoRecemCadastrado.sexo}</Text>
          <Text style={styles.detalheDestaque}>Raça/Cor: {gatoRecemCadastrado.racaCor}</Text>
          <Text style={styles.detalheDestaque}>Saúde: {gatoRecemCadastrado.saude}</Text>
          <Text style={styles.detalheDestaque}>História: {gatoRecemCadastrado.temperamento}</Text>
        </View>
      )}

      <View style={styles.acoesTopo}>
        <TouchableOpacity style={styles.botaoSecundario} onPress={buscarGatosAPI}>
          <Text style={styles.textoBotaoSecundario}>Carregar Novos Gatos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => navigation.navigate('CadastrarGato')}
        >
          <Text style={styles.textoBotaoSecundario}>Cadastrar Gato para Adoção</Text>
        </TouchableOpacity>
      </View>

      {/* Catálogo juntando gatos cadastrados pelo usuário + TheCatAPI */}
      <Text style={styles.subtituloSecao}>1. Gatinhos Disponíveis para Adoção</Text>
      {carregandoGatos ? (
        <ActivityIndicator size="large" color="black" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.gradeGatos}>
          {[...gatosCadastrados, ...gatosDisponiveis].map((gato) => {
            const selecionado = gatoSelecionado?.id === gato.id;
            return (
              <View
                key={gato.id}
                style={[styles.cardGato, selecionado && styles.cardGatoSelecionado]}
              >
                <Image source={{ uri: gato.url }} style={styles.fotoGato} />
                <Text style={styles.nomeGato}>{gato.nome}</Text>
                <Text style={styles.descricaoGato}>{gato.descricao}</Text>
                <TouchableOpacity
                  style={[styles.botaoEscolher, selecionado && styles.botaoEscolherAtivo]}
                  onPress={() => setGatoSelecionado(gato)}
                >
                  <Text style={styles.textoBotaoEscolher}>
                    {selecionado ? 'Selecionado ✓' : 'Escolher este'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Formulário de confirmação com Resend + Firebase */}
      <View style={styles.formularioAdocao}>
        <Text style={styles.subtituloSecao}>2. Confirmar Adoção (Firebase + Resend)</Text>

        <Text style={styles.gatoEscolhidoTexto}>
          Gatinho escolhido:{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {gatoSelecionado ? gatoSelecionado.nome : 'Nenhum selecionado ainda'}
          </Text>
        </Text>

        <Text style={styles.label}>E-mail para receber a confirmação (Resend)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          value={emailConfirmacao}
          onChangeText={setEmailConfirmacao}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Por que você quer adotar este gatinho?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Tenho apartamento telado e muito carinho para dar!"
          value={mensagemAdocao}
          onChangeText={setMensagemAdocao}
        />

        <TouchableOpacity
          style={styles.botaoPrincipal}
          onPress={confirmarAdocao}
          disabled={enviandoAdocao}
        >
          <Text style={styles.textoBotaoPrincipal}>
            {enviandoAdocao ? 'Confirmando e enviando e-mail...' : 'Confirmar Adoção e Enviar E-mail'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de adoções salvas no Firebase */}
      <View style={styles.secaoHistorico}>
        <Text style={styles.subtituloSecao}>Minhas Adoções Registradas</Text>
        {listaAdocoes.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma adoção registrada ainda.</Text>
        ) : (
          listaAdocoes.map((item) => (
            <View key={item.id} style={styles.itemHistorico}>
              {item.fotoUrl ? (
                <Image source={{ uri: item.fotoUrl }} style={styles.miniaturaHistorico} />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloHistorico}>{item.titulo}</Text>
                <Text style={styles.descricaoHistorico}>Motivo: {item.descricao}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.botaoVoltar} onPress={voltarParaLogin}>
        <Text style={styles.textoBotaoSecundario}>Sair / Voltar ao Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f6efef',
  },
  container: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 50,
  },
  texto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  acoesTopo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 10,
  },
  destaqueRecemCadastrado: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
    borderWidth: 2,
    borderColor: 'black',
    alignItems: 'center',
  },
  tituloDestaque: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
    textAlign: 'center',
  },
  fotoDestaque: {
    width: 180,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  detalheDestaque: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  subtituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  gradeGatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  cardGato: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cardGatoSelecionado: {
    borderColor: 'black',
    backgroundColor: '#e8e0e0',
  },
  fotoGato: {
    width: 135,
    height: 120,
    borderRadius: 6,
    marginBottom: 8,
  },
  nomeGato: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  descricaoGato: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    marginVertical: 6,
    minHeight: 32,
  },
  botaoEscolher: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  botaoEscolherAtivo: {
    backgroundColor: 'black',
  },
  textoBotaoEscolher: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  formularioAdocao: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'black',
    marginTop: 20,
  },
  gatoEscolhidoTexto: {
    fontSize: 15,
    marginBottom: 12,
    color: 'black',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    color: 'black',
  },
  botaoPrincipal: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotaoPrincipal: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  botaoSecundario: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  textoBotaoSecundario: {
    color: 'black',
    fontWeight: 'bold',
  },
  secaoHistorico: {
    width: '100%',
    maxWidth: 420,
    marginTop: 15,
  },
  textoVazio: {
    textAlign: 'center',
    color: '#555',
    fontStyle: 'italic',
  },
  itemHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
    gap: 10,
  },
  miniaturaHistorico: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  tituloHistorico: {
    fontWeight: 'bold',
    fontSize: 15,
    color: 'black',
  },
  descricaoHistorico: {
    fontSize: 13,
    color: '#444',
  },
  botaoVoltar: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
});
