import {
  Text,
  View,
  TextInput,
  StyleSheet,
} from 'react-native';
import { cores } from './tema';

export function Cabecalho() {
  return (
    <View style={styles.cabecalho}>

      <Text style={styles.tituloCabecalho}>
        AdoteUmMiau 🐾
      </Text>

      <Text style={styles.subtituloCabecalho}>
        Encontre seu novo amigo de quatro patas
      </Text>

    </View>
  );
}

export function CompenenteLogin(props) {
  return (
    <View style={styles.campo}>

      <Text style={styles.label}>
        {props.texto}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Informe sua data de nascimento"
        placeholderTextColor={cores.placeholder}
        keyboardType="numeric"
      />

    </View>
  );
}

export function ElementoHome(props) {
  return (
    <View style={styles.elementoHome}>
      <Text style={styles.textoElementoHome}>
        {props.texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    width: '100%',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: cores.preto,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: cores.roxo,
  },
  tituloCabecalho: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cores.dourado,
  },
  subtituloCabecalho: {
    fontSize: 14,
    color: cores.roxoClaro,
    marginTop: 4,
  },
  campo: {
    width: '100%',
    marginTop: 5,
    marginBottom: 10,
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
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: cores.pretoCard,
    borderRadius: 5,
    color: cores.branco,
  },
  elementoHome: {
    marginTop: 20,
    padding: 15,
    backgroundColor: cores.roxoEscuro,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: cores.dourado,
  },
  textoElementoHome: {
    fontSize: 16,
    color: cores.branco,
    textAlign: 'center',
  },
});