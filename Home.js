import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { onValue, ref } from 'firebase/database';
import { database } from './firebase';
import { cores } from './tema';
import { BASE_FIXA } from './localizacao';
import { MapaView } from './MapaView';

function mostrarAlerta(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export function Home() {
  const navigation = useNavigation();
  const route = useRoute();

  const [gatosFirebase, setGatosFirebase] = useState([]);
  const [gatoApi, setGatoApi] = useState(null);
  const [gatoSelecionado, setGatoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [buscandoApi, setBuscandoApi] = useState(false);

  // Escuta os gatos cadastrados no Firebase
  useEffect(() => {
    const gatosRef = ref(database, 'gatosParaAdocao');
    const unsubscribe = onValue(
      gatosRef,
      (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
          const lista = Object.entries(dados)
            .map(([id, item]) => ({ id, ...item }))
            .filter((g) => !g.adotado)
            .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));

          setGatosFirebase(lista);
          setGatoSelecionado((atual) => {
            if (atual) {
              const atualizado = lista.find((item) => item.id === atual.id);
              if (atualizado) return atualizado;
            }
            return lista[0] || atual;
          });
        } else {
          setGatosFirebase([]);
        }
        setCarregando(false);
      },
      () => {
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Seleciona automaticamente o gato recém-cadastrado ao voltar de camera.js
  useEffect(() => {
    if (route.params?.gatoRecemCadastrado) {
      setGatoSelecionado(route.params.gatoRecemCadastrado);
    }
  }, [route.params?.gatoRecemCadastrado]);

  // Busca um gatinho aleatório da TheCatAPI caso não haja seleção
  async function buscarGatoAleatorioApi() {
    setBuscandoApi(true);
    try {
      const resposta = await fetch('https://api.thecatapi.com/v1/images/search?has_breeds=1');
      const dados = await resposta.json();
      const item = dados?.[0];
      if (item?.url) {
        const raca = item.breeds?.[0];
        const novoGatoApi = {
          id: `api_${item.id}`,
          nome: raca?.name ? `Miau (${raca.name})` : 'Gatinho Disponível',
          idade: 'Jovem',
          sexo: 'A consultar',
          racaCor: raca?.name || 'SRD (Vira-lata)',
          saude: 'Vacinado e vermifugado',
          temperamento: raca?.temperament || 'Dócil, curioso e carinhoso',
          url: item.url,
          localTipo: 'base',
          enderecoRetirada: BASE_FIXA.endereco,
          latitude: BASE_FIXA.latitude,
          longitude: BASE_FIXA.longitude,
          origem: 'api',
        };
        setGatoApi(novoGatoApi);
        setGatoSelecionado(novoGatoApi);
      }
    } catch {
      mostrarAlerta('Ops!', 'Não foi possível buscar um novo gatinho no momento.');
    } finally {
      setBuscandoApi(false);
    }
  }

  useEffect(() => {
    buscarGatoAleatorioApi();
  }, []);

  function abrirRotaNoMaps(gato) {
    const lat = gato?.latitude ?? BASE_FIXA.latitude;
    const lng = gato?.longitude ?? BASE_FIXA.longitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      mostrarAlerta('Erro', 'Não foi possível abrir o Google Maps.');
    });
  }

  function irParaAdocao(gato) {
    if (!gato) return;
    navigation.navigate('ConfirmacaoAdocao', { gato });
  }

  const gatoEmDestaque = gatoSelecionado || gatosFirebase[0] || gatoApi;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Cabeçalho simples e acolhedor */}
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>AdoteUmMiau 🐾</Text>
        <Text style={styles.subtitulo}>
          Encontre um novo companheiro ou cadastre um gatinho para adoção.
        </Text>
      </View>

      {/* Barra de ações principais (2 colunas uniformes) */}
      <View style={styles.barraAcoesTopo}>
        <TouchableOpacity
          style={styles.botaoNav}
          onPress={() => navigation.navigate('CadastrarGato')}
        >
          <Text style={styles.textoBotaoNav}>➕ Cadastrar Gato</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoNav}
          onPress={() => navigation.navigate('MapaGatos')}
        >
          <Text style={styles.textoBotaoNav}>🗺️ Mapa dos Gatos</Text>
        </TouchableOpacity>
      </View>

      {/* Card principal do gato em destaque */}
      {carregando && !gatoEmDestaque ? (
        <View style={styles.cardCarregando}>
          <ActivityIndicator size="large" color={cores.dourado} />
          <Text style={styles.textoSecundario}>Carregando gatinhos...</Text>
        </View>
      ) : gatoEmDestaque ? (
        <View style={styles.cardDestaque}>
          {gatoEmDestaque.url ? (
            <Image source={{ uri: gatoEmDestaque.url }} style={styles.fotoDestaque} />
          ) : null}

          <View style={styles.conteudoCard}>
            <View style={styles.linhaTituloGato}>
              <Text style={styles.nomeGato}>{gatoEmDestaque.nome}</Text>
              <View style={styles.badgeModalidade}>
                <Text style={styles.textoBadge}>
                  {gatoEmDestaque.localTipo === 'base' ? '🏠 Base fixa' : '📍 No local'}
                </Text>
              </View>
            </View>

            <Text style={styles.infoBasica}>
              {[gatoEmDestaque.idade, gatoEmDestaque.sexo, gatoEmDestaque.racaCor]
                .filter(Boolean)
                .join(' • ')}
            </Text>

            {gatoEmDestaque.saude ? (
              <Text style={styles.detalhe}>Saúde: {gatoEmDestaque.saude}</Text>
            ) : null}

            {gatoEmDestaque.temperamento ? (
              <Text style={styles.detalhe}>{gatoEmDestaque.temperamento}</Text>
            ) : null}

            {/* Bloco de retirada e localização */}
            <View style={styles.blocoRetirada}>
              <Text style={styles.tituloRetirada}>
                {gatoEmDestaque.localTipo === 'base'
                  ? '🏠 Retirada na base fixa'
                  : '📍 Retirada no local'}
              </Text>
              <Text style={styles.enderecoTexto}>
                {gatoEmDestaque.enderecoRetirada || BASE_FIXA.endereco}
              </Text>

              {gatoEmDestaque.latitude && gatoEmDestaque.longitude ? (
                <View style={styles.caixaMiniMapa}>
                  <MapaView
                    gatos={[gatoEmDestaque]}
                    baseFixa={BASE_FIXA}
                    altura={160}
                  />
                </View>
              ) : null}
            </View>

            {/* Hierarquia de botões do card */}
            <View style={styles.acoesCard}>
              <TouchableOpacity
                style={styles.botaoPrimario}
                onPress={() => irParaAdocao(gatoEmDestaque)}
              >
                <Text style={styles.textoBotaoPrimario}>🐾 Quero Adotar</Text>
              </TouchableOpacity>

              <View style={styles.linhaBotoesSecundarios}>
                <TouchableOpacity
                  style={styles.botaoSecundario}
                  onPress={() => abrirRotaNoMaps(gatoEmDestaque)}
                >
                  <Text style={styles.textoBotaoSecundario}>🧭 Como chegar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoSecundario}
                  onPress={buscarGatoAleatorioApi}
                  disabled={buscandoApi}
                >
                  <Text style={styles.textoBotaoSecundario}>
                    {buscandoApi ? 'Buscando...' : '↻ Outro gatinho'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Lista horizontal de outros gatos cadastrados no Firebase */}
      {gatosFirebase.length > 0 && (
        <View style={styles.secaoLista}>
          <Text style={styles.tituloSecao}>
            Gatinhos cadastrados ({gatosFirebase.length})
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaHorizontal}
          >
            {gatosFirebase.map((gato) => {
              const ativo = gatoEmDestaque?.id === gato.id;
              return (
                <TouchableOpacity
                  key={gato.id}
                  style={[styles.miniCard, ativo && styles.miniCardAtivo]}
                  onPress={() => setGatoSelecionado(gato)}
                >
                  {gato.url ? (
                    <Image source={{ uri: gato.url }} style={styles.miniFoto} />
                  ) : null}
                  <Text style={styles.miniNome} numberOfLines={1}>
                    {gato.nome}
                  </Text>
                  <Text style={styles.miniSub} numberOfLines={1}>
                    {gato.localTipo === 'base' ? '🏠 Base fixa' : '📍 No local'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: cores.preto,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cabecalho: {
    width: '100%',
    maxWidth: 440,
    marginBottom: 14,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cores.branco,
  },
  subtitulo: {
    fontSize: 14,
    color: cores.roxoClaro,
    marginTop: 4,
    lineHeight: 20,
  },
  barraAcoesTopo: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 440,
    marginBottom: 16,
  },
  botaoNav: {
    flex: 1,
    minHeight: 46,
    backgroundColor: cores.pretoCard,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textoBotaoNav: {
    color: cores.branco,
    fontWeight: '600',
    fontSize: 13,
  },
  cardCarregando: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: cores.pretoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  textoSecundario: {
    color: cores.roxoClaro,
    fontSize: 14,
  },
  cardDestaque: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: cores.pretoCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    overflow: 'hidden',
  },
  fotoDestaque: {
    width: '100%',
    height: 230,
    backgroundColor: cores.fundoInput,
  },
  conteudoCard: {
    padding: 16,
  },
  linhaTituloGato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nomeGato: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.branco,
    flex: 1,
  },
  badgeModalidade: {
    backgroundColor: cores.azulEscuro,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  textoBadge: {
    color: cores.dourado,
    fontSize: 12,
    fontWeight: '600',
  },
  infoBasica: {
    fontSize: 13,
    color: cores.dourado,
    marginTop: 4,
    fontWeight: '600',
  },
  detalhe: {
    fontSize: 14,
    color: cores.roxoClaro,
    marginTop: 8,
    lineHeight: 20,
  },
  blocoRetirada: {
    marginTop: 14,
    padding: 12,
    backgroundColor: cores.fundoInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  tituloRetirada: {
    fontSize: 13,
    fontWeight: 'bold',
    color: cores.branco,
  },
  enderecoTexto: {
    fontSize: 13,
    color: cores.roxoClaro,
    marginTop: 4,
    lineHeight: 18,
  },
  caixaMiniMapa: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  acoesCard: {
    marginTop: 16,
    gap: 10,
  },
  botaoPrimario: {
    minHeight: 48,
    backgroundColor: cores.dourado,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textoBotaoPrimario: {
    color: cores.preto,
    fontWeight: 'bold',
    fontSize: 15,
  },
  linhaBotoesSecundarios: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoSecundario: {
    flex: 1,
    minHeight: 44,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textoBotaoSecundario: {
    color: cores.branco,
    fontWeight: '600',
    fontSize: 13,
  },
  secaoLista: {
    width: '100%',
    maxWidth: 440,
    marginTop: 22,
  },
  tituloSecao: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 10,
  },
  listaHorizontal: {
    gap: 10,
    paddingRight: 8,
  },
  miniCard: {
    width: 130,
    backgroundColor: cores.pretoCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 8,
  },
  miniCardAtivo: {
    borderColor: cores.dourado,
  },
  miniFoto: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    backgroundColor: cores.fundoInput,
    marginBottom: 6,
  },
  miniNome: {
    fontSize: 13,
    fontWeight: 'bold',
    color: cores.branco,
  },
  miniSub: {
    fontSize: 11,
    color: cores.roxoClaro,
    marginTop: 2,
  },
});