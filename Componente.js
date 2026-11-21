import {
  Text,
  View,
  TextInput,
  StyleSheet,
} from 'react-native';

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
        placeholderTextColor="#555"
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
    backgroundColor: '#f6efef',
    alignItems: 'center',
  },

  tituloCabecalho: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },

  subtituloCabecalho: {
    fontSize: 14,
    color: '#555',
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
    color: 'black',
    marginBottom: 5,
  },

  input: {
    borderWidth: 2,
    borderColor: 'black',
    marginBottom: 10,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    color: 'black',
  },

  elementoHome: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'black',
  },

  textoElementoHome: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },

});
