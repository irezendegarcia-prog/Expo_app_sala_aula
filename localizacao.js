import * as Location from 'expo-location';
import { Linking } from 'react-native';

// BASE FIXA onde os gatos podem ser levados.
// TODO: troque pelas coordenadas reais da base quando definirmos o local.
// (Valores abaixo são só de exemplo, perto de Curitiba, tirados do material da aula.)
export const BASE_FIXA = {
    nome: 'Base AdoteUmMiau',
    endereco: 'Rua Afiffe Mansur, 565 - Novo Mundo, Curitiba - PR',
    latitude: -25.5045,
    longitude: -49.2955,
};

// Pede permissão e devolve { latitude, longitude } do aparelho.
// Se algo der errado, lança um Error com uma mensagem pronta para mostrar ao usuário.
export async function obterLocalizacaoAtual() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permissão de localização negada.');
    }
    try {
        const posicao = await Location.getCurrentPositionAsync({});
        return {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
        };
    } catch {
        throw new Error('Não foi possível obter a localização. Verifique se o GPS está ligado.');
    }
}

// Abre o Google Maps com a rota até o destino (o app de mapas desenha o caminho).
export async function abrirRota(destino) {
    const url =
        'https://www.google.com/maps/dir/?api=1' +
        '&destination=' + destino.latitude + ',' + destino.longitude +
        '&travelmode=driving';
    await Linking.openURL(url);
}