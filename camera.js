import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
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
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import { ref, push, set } from 'firebase/database';
import { database } from './firebase';

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

  // Foto confirmada para o formulário e foto temporária capturada na câmera para pré-visualização antes de confirmar
  const [foto, setFoto] = useState(null);
  const [fotoCapturadaTemp, setFotoCapturadaTemp] = useState(null);
  const [uriLocalTemp, setUriLocalTemp] = useState(null);

  // Campos do formulário do gato (6 informações)
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [racaCor, setRacaCor] = useState('');
  const [saude, setSaude] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [gatoSalvo, setGatoSalvo] = useState(null);

  // useEffect que monitora quando o cadastro é salvo no useState, exibe um Alert e navega com navigation.navigate
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

  // Opção 1: Fazer upload de uma foto da galeria do celular/computador
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
    } catch (erro) {
      mostrarAlerta('Erro', 'Não foi possível selecionar a imagem da galeria.');
    }
  }

  // Abre a câmera na tela (pedindo permissão se necessário)
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

  // Opção 2: Tira a foto e mostra a pré-visualização ANTES de confirmar
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
    } catch (erro) {
      mostrarAlerta('Erro na câmera', 'Não foi possível capturar a foto.');
    }
  }

  // Confirma a foto da pré-visualização para usar no formulário de cadastro
  async function confirmarFotoCapturada() {
    if (!fotoCapturadaTemp) return;
    setFoto(fotoCapturadaTemp);
    setMostrarCamera(false);

    // Salva opcionalmente na galeria quando estiver no celular
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

  // Permite descartar a pré-visualização e tirar outra foto
  function tentarOutraFoto() {
    setFotoCapturadaTemp(null);
    setUriLocalTemp(null);
    setCameraPronta(false);
  }

  // Salva o gato com a foto e as informações no Firebase para aparecer na Home
  async function salvarGatoParaAdocao() {
    if (!foto) {
      mostrarAlerta('Foto obrigatória', 'Faça o upload de uma foto ou tire uma foto na hora.');
      return;
    }
    if (!nome.trim() || !idade.trim() || !sexo.trim() || !racaCor.trim() || !saude.trim() || !descricao.trim()) {
      mostrarAlerta('Campos obrigatórios', 'Preencha todas as 6 informações do gatinho para o cadastro.');
      return;
    }

    setSalvando(true);
    try {
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
        criadoEm: Date.now(),
      };

      await set(novoGatoRef, dadosNovoGato);

      // Salva os dados confirmados no useState gatoSalvo (o useEffect exibirá o Alert e fará o navigation.navigate)
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
    } catch (erro) {
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

      {/* Botões de Upload ou Tirar Foto na Hora */}
      <View style={styles.botoesMidia}>
        <TouchableOpacity style={styles.botaoMidia} onPress={escolherDaGaleria}>
          <Text style={styles.textoBotaoMidia}>📁 Fazer Upload de Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoMidia}
          onPress={() => (mostrarCamera ? setMostrarCamera(false) : abrirCamera())}
        >
          <Text style={styles.textoBotaoMidia}>
            {mostrarCamera ? '✖ Fechar Câmera' : '📷 Tirar Foto na Hora'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Visualização da Câmera ao vivo OU Pré-visualização antes de confirmar */}
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
                  <Text style={styles.textoBotaoCapturar}>✓ Confirmar e Usar Foto</Text>
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

      {/* Pré-visualização da foto já confirmada para o formulário */}
      {foto && (
        <View style={styles.previewContainer}>
          <Text style={styles.labelPreview}>Foto confirmada para o cadastro:</Text>
          <Image source={{ uri: foto }} style={styles.imagemPreview} />
        </View>
      )}

      {/* Formulário com as informações do gato */}
      <View style={styles.formulario}>
        <Text style={styles.tituloSecao}>Informações do Gatinho</Text>

        <Text style={styles.label}>1. Nome do Gato *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Mingau, Luna, Frajola..."
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>2. Idade Aproximada *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3 meses, 1 ano, Filhote..."
          value={idade}
          onChangeText={setIdade}
        />

        <Text style={styles.label}>3. Sexo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Macho ou Fêmea"
          value={sexo}
          onChangeText={setSexo}
        />

        <Text style={styles.label}>4. Raça / Cor da Pelagem *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: SRD (Vira-lata), Frajola, Siamês, Laranja..."
          value={racaCor}
          onChangeText={setRacaCor}
        />

        <Text style={styles.label}>5. Saúde (Castrado / Vacinado / Vermifugado) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Castrado e vacinado, FIV/FeLV negativo"
          value={saude}
          onChangeText={setSaude}
        />

        <Text style={styles.label}>6. Temperamento / História do Resgate *</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder="Ex: Muito dócil, resgatado da chuva e adora colo"
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <View style={{ marginTop: 16 }}>
          <Button
            color="black"
            title={salvando ? 'Confirmando...' : 'Confirmar'}
            onPress={salvarGatoParaAdocao}
            disabled={salvando}
          />
        </View>

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={voltarParaHome}
        >
          <Text style={styles.textoBotaoRefazer}>Voltar para a Central de Adoção</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Mantém o export Camera apontando para o mesmo componente para compatibilidade
export const Camera = CadastrarGato;

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
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    maxWidth: 400,
  },
  botoesMidia: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 420,
  },
  botaoMidia: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    flex: 1,
    minWidth: 160,
    alignItems: 'center',
  },
  textoBotaoMidia: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  caixaCamera: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'black',
  },
  camera: {
    width: 280,
    height: 340,
    borderRadius: 8,
  },
  botaoCapturar: {
    marginTop: 10,
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: 280,
    alignItems: 'center',
  },
  textoBotaoCapturar: {
    color: 'white',
    fontWeight: 'bold',
  },
  botoesConfirmacaoCamera: {
    marginTop: 10,
    width: 280,
    gap: 8,
  },
  botaoConfirmarFoto: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  botaoRefazerFoto: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center',
  },
  textoBotaoRefazer: {
    color: 'black',
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  labelPreview: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  imagemPreview: {
    width: 220,
    height: 180,
    borderRadius: 8,
  },
  formulario: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'black',
    marginTop: 18,
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
    textAlign: 'center',
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
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    color: 'black',
  },
  botaoSalvar: {
    backgroundColor: 'black',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  textoBotaoSalvar: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  botaoVoltar: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center',
    marginTop: 10,
  },
});
