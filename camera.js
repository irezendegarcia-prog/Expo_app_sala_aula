import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import { ref, push, set } from 'firebase/database';
import { database } from './firebase';
import { cores } from './tema';
import { BASE_FIXA, obterLocalizacaoAtual } from './localizacao';

function mostrarAlerta(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

function formatarUriImagem(uri, base64) {
  if (uri && uri.startsWith('data:image')) {
    return uri;
  }
  if (base64) {
    return base64.startsWith('data:image')
      ? base64
      : `data:image/jpeg;base64,${base64}`;
  }
  return uri || null;
}

export function CadastrarGato() {
  const navigation = useNavigation();
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const cameraRef = useRef(null);

  const [foto, setFoto] = useState(null);
  const [fotoCapturadaTemp, setFotoCapturadaTemp] = useState(null);
  const [uriLocalTemp, setUriLocalTemp] = useState(null);

  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [racaCor, setRacaCor] = useState('');
  const [saude, setSaude] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enderecoRetirada, setEnderecoRetirada] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [gatoSalvo, setGatoSalvo] = useState(null);

  const [local, setLocal] = useState(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  useEffect(() => {
    if (gatoSalvo) {
      mostrarAlerta(
        'Cadastro Confirmado! 🐾',
        `O gatinho ${gatoSalvo.nome} (${gatoSalvo.idade}, ${gatoSalvo.sexo}) foi salvo com sucesso!`
      );
      navigation.navigate('Home', {
        gatoRecemCadastrado: gatoSalvo,
        textoElemento: `Último gato cadastrado: ${gatoSalvo.nome} (${gatoSalvo.racaCor})`,
      });
    }
  }, [gatoSalvo]);

  async function escolherDaGaleria() {
    try {
      const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissaoGaleria.granted) {
        mostrarAlerta('Permissão negada', 'Precisamos de acesso à sua galeria para escolher uma foto.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.4,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const imagem = resultado.assets[0];
        const uriFormatada = formatarUriImagem(imagem.uri, imagem.base64);

        setFoto(uriFormatada);
        setFotoCapturadaTemp(null);
        setMostrarCamera(false);
      }
    } catch {
      mostrarAlerta('Erro', 'Não foi possível selecionar a imagem da galeria.');
    }
  }

  async function abrirCamera() {
    if (!permissao?.granted) {
      const resposta = await solicitarPermissao();
      if (!resposta.granted) {
        mostrarAlerta('Permissão negada', 'Precisamos de permissão para usar a câmera.');
        return;
      }
    }
    setFotoCapturadaTemp(null);
    setUriLocalTemp(null);
    setCameraPronta(false);
    setMostrarCamera(true);
  }

  async function tirarFotoNaHora() {
    if (!cameraRef.current || !cameraPronta) return;
    try {
      const resultado = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        base64: true,
      });

      if (resultado?.uri) {
        const uriFormatada = formatarUriImagem(resultado.uri, resultado.base64);
        setFotoCapturadaTemp(uriFormatada);
        setUriLocalTemp(resultado.uri);
      }
    } catch {
      mostrarAlerta('Erro na câmera', 'Não foi possível capturar a foto.');
    }
  }

  async function confirmarFotoCapturada() {
    if (!fotoCapturadaTemp) return;
    setFoto(fotoCapturadaTemp);
    setMostrarCamera(false);

    if (Platform.OS !== 'web' && uriLocalTemp) {
      try {
        const perm = await requestPermissionsAsync(true);
        if (perm.granted) {
          await Asset.create(uriLocalTemp);
        }
      } catch {
        // Ignora erro de galeria para não bloquear o cadastro
      }
    }

    setFotoCapturadaTemp(null);
    setUriLocalTemp(null);
  }

  function tentarOutraFoto() {
    setFotoCapturadaTemp(null);
    setUriLocalTemp(null);
    setCameraPronta(false);
  }

  async function usarPegarNoLocal() {
    setBuscandoLocal(true);
    try {
      const posicao = await obterLocalizacaoAtual();
      let enderecoFormatado = enderecoRetirada.trim();

      if (!enderecoFormatado && Platform.OS !== 'web') {
        try {
          const enderecos = await Location.reverseGeocodeAsync({
            latitude: posicao.latitude,
            longitude: posicao.longitude,
          });
          const primeiro = enderecos?.[0];
          if (primeiro) {
            enderecoFormatado = [
              primeiro.street,
              primeiro.streetNumber,
              primeiro.district,
              primeiro.city,
            ]
              .filter(Boolean)
              .join(', ');
            if (enderecoFormatado) {
              setEnderecoRetirada(enderecoFormatado);
            }
          }
        } catch {
          // Mantém vazio caso a geocodificação reversa falhe
        }
      }

      setLocal({
        tipo: 'local',
        endereco: enderecoFormatado,
        latitude: posicao.latitude,
        longitude: posicao.longitude,
      });
    } catch (erro) {
      mostrarAlerta('Localização', erro.message);
    } finally {
      setBuscandoLocal(false);
    }
  }

  function usarPegarNaBase() {
    setEnderecoRetirada(BASE_FIXA.endereco);
    setLocal({
      tipo: 'base',
      endereco: BASE_FIXA.endereco,
      latitude: BASE_FIXA.latitude,
      longitude: BASE_FIXA.longitude,
    });
  }

  async function resolverLocalFinal() {
    const enderecoDigitado = enderecoRetirada.trim();

    if (local?.tipo === 'base') {
      return {
        tipo: 'base',
        endereco: enderecoDigitado || BASE_FIXA.endereco,
        latitude: BASE_FIXA.latitude,
        longitude: BASE_FIXA.longitude,
      };
    }

    if (local?.tipo === 'local') {
      return {
        tipo: 'local',
        endereco: enderecoDigitado || local.endereco || 'Local do cadastrante',
        latitude: local.latitude,
        longitude: local.longitude,
      };
    }

    if (enderecoDigitado && Platform.OS !== 'web') {
      const resultados = await Location.geocodeAsync(enderecoDigitado);
      if (resultados && resultados.length > 0) {
        return {
          tipo: 'local',
          endereco: enderecoDigitado,
          latitude: resultados[0].latitude,
          longitude: resultados[0].longitude,
        };
      }
    }

    return null;
  }

  async function salvarGatoParaAdocao() {
    if (!foto) {
      mostrarAlerta('Foto obrigatória', 'Faça o upload de uma foto ou tire uma foto na hora.');
      return;
    }
    if (!nome.trim() || !idade.trim() || !sexo.trim() || !racaCor.trim() || !saude.trim() || !descricao.trim()) {
      mostrarAlerta('Campos obrigatórios', 'Preencha todas as 6 informações do gatinho para o cadastro.');
      return;
    }
    if (!enderecoRetirada.trim()) {
      mostrarAlerta('Endereço obrigatório', 'Informe o endereço de retirada ou selecione "Pegar na base fixa".');
      return;
    }

    setSalvando(true);
    try {
      const localResolvido = await resolverLocalFinal();
      if (!localResolvido) {
        mostrarAlerta(
          'Localização obrigatória',
          'Toque em "Pegar no local" (GPS) ou "Pegar na base fixa", ou informe um endereço válido.'
        );
        return;
      }

      const gatosRef = ref(database, 'gatosParaAdocao');
      const novoGatoRef = push(gatosRef);

      const textoDescricao = `${idade.trim()} • ${sexo.trim()} • ${racaCor.trim()} • ${saude.trim()} • ${descricao.trim()}`;

      const dadosNovoGato = {
        nome: nome.trim(),
        idade: idade.trim(),
        sexo: sexo.trim(),
        racaCor: racaCor.trim(),
        saude: saude.trim(),
        temperamento: descricao.trim(),
        descricao: textoDescricao,
        url: foto,
        modalidadeRetirada: localResolvido.tipo,
        localTipo: localResolvido.tipo,
        enderecoRetirada: localResolvido.endereco,
        latitude: localResolvido.latitude,
        longitude: localResolvido.longitude,
        adotado: false,
        criadoEm: Date.now(),
      };

      await set(novoGatoRef, dadosNovoGato);

      setGatoSalvo(dadosNovoGato);
      setFoto(null);
      setFotoCapturadaTemp(null);
      setUriLocalTemp(null);
      setNome('');
      setIdade('');
      setSexo('');
      setRacaCor('');
      setSaude('');
      setDescricao('');
      setEnderecoRetirada('');
      setLocal(null);
    } catch {
      mostrarAlerta('Erro ao cadastrar', 'Não foi possível salvar os dados do gato no Firebase.');
    } finally {
      setSalvando(false);
    }
  }

  function voltarParaHome() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Cadastrar Gato para Adoção 🐱</Text>
      <Text style={styles.subtitulo}>
        Envie uma foto da galeria ou tire uma foto na hora para colocar um gatinho para adoção.
      </Text>

      <View style={styles.botoesMidia}>
        <TouchableOpacity style={styles.botaoMidia} onPress={escolherDaGaleria}>
          <Text style={styles.textoBotaoMidia}>📁 Galeria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoMidia}
          onPress={() => (mostrarCamera ? setMostrarCamera(false) : abrirCamera())}
        >
          <Text style={styles.textoBotaoMidia}>
            {mostrarCamera ? '✖ Fechar Câmera' : '📷 Tirar Foto'}
          </Text>
        </TouchableOpacity>
      </View>

      {mostrarCamera && (
        <View style={styles.caixaCamera}>
          {!fotoCapturadaTemp ? (
            <>
              <Text style={styles.labelPreview}>Aponte a câmera e tire a foto:</Text>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onCameraReady={() => setCameraPronta(true)}
              />
              <TouchableOpacity
                style={styles.botaoCapturar}
                onPress={tirarFotoNaHora}
                disabled={!cameraPronta}
              >
                <Text style={styles.textoBotaoCapturar}>
                  {cameraPronta ? '📸 Tirar Foto' : 'Iniciando câmera...'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.labelPreview}>Pré-visualização da foto tirada:</Text>
              <Image source={{ uri: fotoCapturadaTemp }} style={styles.camera} />
              <View style={styles.botoesConfirmacaoCamera}>
                <TouchableOpacity
                  style={styles.botaoConfirmarFoto}
                  onPress={confirmarFotoCapturada}
                >
                  <Text style={styles.textoBotaoCapturar}>✓ Confirmar Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoRefazerFoto}
                  onPress={tentarOutraFoto}
                >
                  <Text style={styles.textoBotaoRefazer}>↻ Tirar Outra</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {foto && (
        <View style={styles.previewContainer}>
          <Text style={styles.labelPreview}>Foto selecionada:</Text>
          <Image source={{ uri: foto }} style={styles.imagemPreview} />
        </View>
      )}

      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Informações do Gatinho</Text>

        <Text style={styles.label}>1. Nome do Gato *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Mingau, Luna, Frajola..."
          placeholderTextColor={cores.placeholder}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>2. Idade Aproximada *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3 meses, 1 ano, Filhote..."
          placeholderTextColor={cores.placeholder}
          value={idade}
          onChangeText={setIdade}
        />

        <Text style={styles.label}>3. Sexo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Macho ou Fêmea"
          placeholderTextColor={cores.placeholder}
          value={sexo}
          onChangeText={setSexo}
        />

        <Text style={styles.label}>4. Raça / Cor da Pelagem *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: SRD (Vira-lata), Frajola, Siamês, Laranja..."
          placeholderTextColor={cores.placeholder}
          value={racaCor}
          onChangeText={setRacaCor}
        />

        <Text style={styles.label}>5. Saúde (Castrado / Vacinado / Vermifugado) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Castrado e vacinado, FIV/FeLV negativo"
          placeholderTextColor={cores.placeholder}
          value={saude}
          onChangeText={setSaude}
        />

        <Text style={styles.label}>6. Temperamento / História do Resgate *</Text>
        <TextInput
          style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
          placeholder="Ex: Muito dócil, resgatado da chuva e adora colo"
          placeholderTextColor={cores.placeholder}
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <Text style={styles.label}>7. Endereço de Retirada *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rua XV de Novembro, 120 - Centro, Curitiba - PR"
          placeholderTextColor={cores.placeholder}
          value={enderecoRetirada}
          onChangeText={(texto) => {
            setEnderecoRetirada(texto);
            if (local?.tipo === 'base' && texto !== BASE_FIXA.endereco) {
              setLocal(null);
            }
          }}
        />

        <Text style={styles.label}>8. Como será a retirada? *</Text>
        <View style={styles.grupoOpcoesRetirada}>
          <TouchableOpacity
            style={[styles.opcaoLocal, local?.tipo === 'local' && styles.opcaoLocalAtiva]}
            onPress={usarPegarNoLocal}
            disabled={buscandoLocal}
          >
            <Text style={[styles.textoOpcaoLocal, local?.tipo === 'local' && styles.textoOpcaoLocalAtiva]}>
              {buscandoLocal ? 'Buscando GPS...' : '📍 Pegar no local'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.opcaoLocal, local?.tipo === 'base' && styles.opcaoLocalAtiva]}
            onPress={usarPegarNaBase}
          >
            <Text style={[styles.textoOpcaoLocal, local?.tipo === 'base' && styles.textoOpcaoLocalAtiva]}>
              🏠 Pegar na base fixa
            </Text>
          </TouchableOpacity>
        </View>

        {local && (
          <Text style={styles.textoLocal}>
            {local.tipo === 'base'
              ? `Retirada na base fixa: ${BASE_FIXA.endereco}`
              : `Retirada no local (${local.latitude.toFixed(5)}, ${local.longitude.toFixed(5)})`}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.botaoSalvar, salvando && { opacity: 0.5 }]}
          onPress={salvarGatoParaAdocao}
          disabled={salvando}
        >
          <Text style={styles.textoBotaoSalvar}>
            {salvando ? 'Confirmando...' : 'Confirmar Cadastro'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botaoVoltar} onPress={voltarParaHome}>
          <Text style={styles.textoBotaoRefazer}>Voltar para a Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export const Camera = CadastrarGato;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: cores.preto,
  },
  container: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cores.branco,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: cores.roxoClaro,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    maxWidth: 420,
    lineHeight: 20,
  },
  botoesMidia: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 440,
  },
  botaoMidia: {
    flex: 1,
    minHeight: 46,
    backgroundColor: cores.pretoCard,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textoBotaoMidia: {
    color: cores.branco,
    fontWeight: '600',
    fontSize: 13,
  },
  caixaCamera: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: cores.pretoCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  camera: {
    width: 280,
    height: 340,
    borderRadius: 10,
  },
  botaoCapturar: {
    marginTop: 10,
    backgroundColor: cores.dourado,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoCapturar: {
    color: cores.preto,
    fontWeight: 'bold',
  },
  botoesConfirmacaoCamera: {
    marginTop: 10,
    width: 280,
    gap: 8,
  },
  botaoConfirmarFoto: {
    backgroundColor: cores.dourado,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoRefazerFoto: {
    backgroundColor: 'transparent',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotaoRefazer: {
    color: cores.branco,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: cores.pretoCard,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  labelPreview: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: cores.roxoClaro,
  },
  imagemPreview: {
    width: 220,
    height: 180,
    borderRadius: 10,
  },
  formulario: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: cores.pretoCard,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.borda,
    marginTop: 18,
  },
  tituloSecao: {
    fontSize: 17,
    fontWeight: 'bold',
    color: cores.branco,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.roxoClaro,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 11,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.fundoInput,
    color: cores.branco,
  },
  grupoOpcoesRetirada: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  opcaoLocal: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundoInput,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoLocalAtiva: {
    backgroundColor: cores.dourado,
    borderColor: cores.dourado,
  },
  textoOpcaoLocal: {
    color: cores.branco,
    fontWeight: '600',
    fontSize: 13,
  },
  textoOpcaoLocalAtiva: {
    color: cores.preto,
    fontWeight: 'bold',
  },
  textoLocal: {
    color: cores.dourado,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  botaoSalvar: {
    backgroundColor: cores.dourado,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  textoBotaoSalvar: {
    color: cores.preto,
    fontWeight: 'bold',
    fontSize: 15,
  },
  botaoVoltar: {
    backgroundColor: 'transparent',
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
});