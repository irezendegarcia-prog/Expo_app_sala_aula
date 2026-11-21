import { useRef, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import { requestPermissionsAsync} from 'expo-media-library';


export function Camera(){

    const [permissao, solicitarPermissao] = useCameraPermissions()
    const [cameraPronta, setCameraPronta] = useState(false);
    const [foto, setFoto] = useState(null);
    const cameraRef = useRef(null);

    async function checkPermission(){
        const permissaoStr = await requestPermissionsAsync(true);
        if (!permissaoStr.granted) {
            alert('Permissão para salvar foto negada.')
            return;
        }
    }

    if (!permissao){
        return null;
    }
    if(!permissao.granted){
        return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center',}}>
            <Text>Precisamos de permissão para acessar a câmera</Text>
            <TouchableOpacity style={{borderWidth:1}} onPress={solicitarPermissao}>
                <Text>Pedir permissão de câmera</Text>
            </TouchableOpacity>
        </View>
        );
    }

    async function tirarFoto(){
        if(!cameraRef.current || !cameraPronta) return;
        try{
            const resultado = await cameraRef.current.takePictureAsync();
            if(resultado?.uri){
                setFoto(resultado.uri);
         }
        }
        catch (erro) {
            console.log("Erro em fotografia", erro);
        }
    }

    async function salvarNaGaleria(uriFoto) {
        const permissaoStr = await reqiestPermissionsAsync(true);
        if(!permissaoStr.granted)
            checkPermission()
        try {
            const imagemSalva = await Asset.create(uriFoto);
            console.log('Foto salva:', imagemSalva.id);
        } catch (erro) {
            console.log('Erro ao salvar:', erro.message);
        }
    }

    return(<View style={{flex: 1}}>

        <CameraView
        ref={cameraRef}
        style={{ width: 300, height: 400, alignSelf: 'center' }}
        facing="back"
        onCameraReady={() => setCameraPronta(true)}
        />
        <TouchableOpacity
            onPress={tirarFoto}
            disabled={!cameraPronta}
            style={{padding: 16, backgroundColor: 'black', alignItems: 'center'}}
        >
            <Text style={{color: 'white'}}>Tirar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity  
            style={{padding: 16, backgroundColor: 'black', alignItems: 'center'}}
            onPress={salvarNaGaleria(foto)}
        >
            <Text>Salvar na galeria</Text>
        </TouchableOpacity>
        {foto && (
            <Image source={{uri: foto}}
            style = {{ width: 240, height:320}}/>
        )}
        
    </View>
    )
}
