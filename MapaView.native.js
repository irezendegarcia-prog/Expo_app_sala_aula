import MapView, { Marker, Callout } from 'react-native-maps';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { cores } from './tema';

export function MapaView({ gatos = [], baseFixa, altura = 300 }) {
    const regiaoInicial = {
        latitude: Number(baseFixa?.latitude ?? gatos[0]?.latitude ?? -25.4284),
        longitude: Number(baseFixa?.longitude ?? gatos[0]?.longitude ?? -49.2733),
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
    };

    function abrirRota(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(url);
    }

    return (
        <View style={[styles.container, { height: altura }]}>
            <MapView style={styles.mapa} initialRegion={regiaoInicial}>
                {/* Marcador roxo da Base Fixa */}
                {baseFixa?.latitude != null && baseFixa?.longitude != null && (
                    <Marker
                        coordinate={{
                            latitude: Number(baseFixa.latitude),
                            longitude: Number(baseFixa.longitude),
                        }}
                        pinColor="#7C4DFF"
                        title={baseFixa.nome || 'Base Fixa AdoteUmMiau'}
                        description={baseFixa.endereco}
                    />
                )}

                {/* Marcadores dourados dos gatos disponíveis */}
                {gatos.map((gato, index) => {
                    const lat = Number(gato.latitude);
                    const lng = Number(gato.longitude);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

                    // Evita que o pino do gato fique escondido exatamente embaixo da base fixa
                    const mesmaBase =
                        baseFixa &&
                        Math.abs(lat - Number(baseFixa.latitude)) < 0.0001 &&
                        Math.abs(lng - Number(baseFixa.longitude)) < 0.0001;

                    const offset = mesmaBase ? (index + 1) * 0.00035 : 0;

                    return (
                        <Marker
                            key={gato.id || String(index)}
                            coordinate={{
                                latitude: lat + offset,
                                longitude: lng + offset,
                            }}
                            pinColor="#D6BE8C"
                            title={gato.nome}
                            description={gato.enderecoRetirada || 'Toque para abrir a rota'}
                        >
                            <Callout onPress={() => abrirRota(lat, lng)}>
                                <View style={styles.callout}>
                                    <Text style={styles.calloutTitulo}>{gato.nome}</Text>
                                    <Text style={styles.calloutSub}>
                                        {gato.localTipo === 'base' ? '🏠 Base fixa' : '📍 No local'}
                                    </Text>
                                    <Text style={styles.calloutLink}>Toque para abrir rota ➔</Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        overflow: 'hidden',
        backgroundColor: cores.pretoCard,
    },
    mapa: {
        width: '100%',
        height: '100%',
    },
    callout: {
        minWidth: 160,
        padding: 4,
    },
    calloutTitulo: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    calloutSub: {
        fontSize: 12,
        color: '#444',
        marginTop: 2,
    },
    calloutLink: {
        fontSize: 12,
        color: '#46416E',
        fontWeight: 'bold',
        marginTop: 4,
    },
});