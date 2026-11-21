import { useState, useEffect } from 'react';
import { Alert, Text, View, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { ElementoHome } from './Componente';
import { auth, database } from './firebase';
import { ref, push, set, onValue } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';

export function Home({ route }) {
  const textoElemento = route?.params?.textoElemento ?? 'Bem-vindo à tela Home';
  const navigation = useNavigation();
  const usuario = auth.currentUser;
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [listaNotas, setListasNotas] = useState([]);

  useEffect(() => {
    if (!usuario) {
      setListasNotas([]);
      return undefined;
    }

    const notasRef = ref(database, `anotacoes/${usuario.uid}`);
    const cancelar = onValue(
      notasRef,
      (snapshot) => {
        const dados = snapshot.val() || {};
        const lista = Object.entries(dados).map(([id, nota]) => ({ id, ...nota }));
        setListasNotas(lista);
      },
      () => Alert.alert('Erro', 'Não foi possível carregar as anotações. Verifique as permissões do Firebase.')
    );

    return cancelar;
  }, [usuario]);

  async function salvarNota() {
    if (!usuario) {
      Alert.alert('Sessão encerrada', 'Entre novamente para salvar uma anotação.');
      navigation.replace('Login');
      return;
    }
    if (!titulo.trim() || !descricao.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o título e a descrição.');
      return;
    }

    try {
      const listaRef = ref(database, `anotacoes/${usuario.uid}`);
      const novaNotaRef = push(listaRef);
      await set(novaNotaRef, { titulo: titulo, descricao: descricao });
      Alert.alert('Sucesso', 'Anotação salva.');
      setTitulo('');
      setDescricao('');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a anotação. Verifique sua conexão e as permissões do Firebase.');
    }
  }




  return (
    <View style={styles.container}>
      <Text style={styles.texto}>
        Aqui é a tela Home
      </Text>
      <ElementoHome texto={textoElemento} />

      <View>
        <TouchableOpacity style={styles.botao} onPress={salvarNota}>
          <Text> Salvar no Banco </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botao} onPress={()=>navigation.goBack()}>
          <Text>Voltar</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={listaNotas} keyExtractor={(item) => item.id} renderItem={({item}) =>(
      <View style={{flexDirection:"row"}}>
        <Text> {item.titulo} </Text>
        <Text> desc - {item.descricao}</Text>
      </View>
  )} >

      </FlatList>
      
      <View>
        <Text>Titulo</Text>
        <TextInput style={styles.input} placeholder='Insira o título' value={titulo} onChangeText={setTitulo} />
        <Text>Descrição</Text>
        <TextInput style={styles.input} placeholder='Insira a descrição' value={descricao} onChangeText={setDescricao} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6efef',
  },

  texto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  botao: {
    padding: 12,
    margin: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  input: {
    width: '90%',
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 5,
  },
});
