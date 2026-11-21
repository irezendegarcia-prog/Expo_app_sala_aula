import { View, Text, StyleSheet } from 'react-native';
import { cores } from './tema';

// Versão para navegador: o react-native-maps não funciona na web,
// então mostramos um aviso no lugar do mapa. O botão "Como chegar" continua funcionando.
export function MapaView({ altura = 250 }) {
    return (
        <View style={[styles.caixa, { height: altura }]}>
            <Text style={styles.texto}>
                🗺️ O mapa aparece apenas no aplicativo (Expo Go no celular).
            </Text>
            <Text style={styles.texto}>Use o botão "Como chegar" para abrir o Google Maps.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    caixa: {
        width: '100%',
        backgroundColor: cores.preto,
        borderWidth: 1,
        borderColor: cores.roxo,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    texto: {
        color: cores.roxoClaro,
        textAlign: 'center',
        marginVertical: 3,
    },
});