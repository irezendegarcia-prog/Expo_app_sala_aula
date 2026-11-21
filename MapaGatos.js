import { useEffect, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { onValue, ref } from 'firebase/database';
import { database } from './firebase';
import { cores } from './tema';
import { BASE_FIXA } from './localizacao';
import { MapaView } from './MapaView';

export function MapaGatos() {
    const [gatos, setGatos] = useState([]);

    useEffect(() => {
        const gatosRef = ref(database, 'gatosParaAdocao');
        const unsubscribe = onValue(gatosRef, (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                const lista = Object.entries(dados)
                    .map(([id, item]) => ({ id, ...item }))
                    .filter((g) => !g.adotado && g.latitude && g.longitude);
                setGatos(lista);
            } else {
                setGatos([]);
            }
        });

        return () => unsubscribe();
    }, []);

    function abrirRota(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(url);
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>Mapa dos Gatinhos 🗺️</Text>
            <Text style={styles.subtitulo}>
                Toque em um marcador no mapa ou escolha um gatinho abaixo para traçar a rota.
            </Text>

            <View style={styles.caixaMapa}>
                <MapaView gatos={gatos} baseFixa={BASE_FIXA} altura={300} />
            </View>

            <View style={styles.secaoLista}>
                <Text style={styles.tituloSecao}>
                    Gatos disponíveis ({gatos.length})
                </Text>

                {gatos.length === 0 ? (
                    <Text style={styles.vazio}>
                        Nenhum gato disponível com localização no momento.
                    </Text>
                ) : (
                    gatos.map((g) => (
                        <View key={g.id} style={styles.cardGato}>
                            <View style={styles.infoGato}>
                                <Text style={styles.nomeGato}>{g.nome}</Text>
                                <Text style={styles.detalhe}>
                                    {g.localTipo === 'base' ? '🏠 Retirar na base fixa' : '📍 Retirar no local'}
                                </Text>
                                {g.enderecoRetirada ? (
                                    <Text style={styles.endereco}>{g.enderecoRetirada}</Text>
                                ) : null}
                            </View>

                            <TouchableOpacity
                                style={styles.botaoRota}
                                onPress={() => abrirRota(g.latitude, g.longitude)}
                            >
                                <Text style={styles.textoBotaoRota}>Como chegar</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
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
    titulo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: cores.branco,
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 13,
        color: cores.roxoClaro,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 16,
        maxWidth: 420,
        lineHeight: 19,
    },
    caixaMapa: {
        width: '100%',
        maxWidth: 440,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: cores.borda,
    },
    secaoLista: {
        width: '100%',
        maxWidth: 440,
        marginTop: 20,
    },
    tituloSecao: {
        fontSize: 16,
        fontWeight: 'bold',
        color: cores.branco,
        marginBottom: 10,
    },
    vazio: {
        color: cores.roxoClaro,
        fontStyle: 'italic',
        fontSize: 14,
    },
    cardGato: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: cores.pretoCard,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        gap: 10,
    },
    infoGato: {
        flex: 1,
    },
    nomeGato: {
        fontSize: 16,
        fontWeight: 'bold',
        color: cores.branco,
    },
    detalhe: {
        fontSize: 12,
        color: cores.dourado,
        marginTop: 2,
        fontWeight: '600',
    },
    endereco: {
        fontSize: 12,
        color: cores.roxoClaro,
        marginTop: 3,
        lineHeight: 17,
    },
    botaoRota: {
        backgroundColor: cores.dourado,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    textoBotaoRota: {
        color: cores.preto,
        fontWeight: 'bold',
        fontSize: 12,
    },
});