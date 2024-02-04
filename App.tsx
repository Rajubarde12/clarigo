import React, {StrictMode, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {
  NestableScrollContainer,
  NestableDraggableFlatList,
} from 'react-native-draggable-flatlist';
import {
  GestureHandlerRootView,
  NativeViewGestureHandler,
} from 'react-native-gesture-handler';

const App: React.FC = () => {
  const [pickedImage, setpickeImage] = useState({
    name: '',
    type: '',
    uri: '',
  });
  const [imageArray, setImagearray] = useState<string[]>([]);
  const pickImage = async () => {
    // Alert.alert('called')
    await launchImageLibrary({mediaType: 'photo', selectionLimit: 1}).then(
      res => {
        const result =
          res.assets != undefined && res.assets.length > 0
            ? res.assets[0]
            : null;
        if (result != null) {
          const selectedImage = {
            name: result.fileName,
            type: result.type,
            uri: result.uri,
          };
          setpickeImage(selectedImage);
        }
      },
    );
  };
  const [loading, setLoading] = useState(false);
  const {height, width} = Dimensions.get('window');
  const firestoreCollection = firestore().collection('imageName').doc('images');
  const storageLocation = storage().ref();
  const setImage = async () => {
    setLoading(true);
    try {
      const result = await fetch(pickedImage.uri);
      const blob = await result.blob();
      const ref = storage().ref().child(`images/${pickedImage.name}`);
      await ref.put(blob);
      const previmage = (await firestoreCollection.get()).data();
      let imagenameArray: string[] = [];
      if (previmage != undefined && previmage?.images?.length > 0) {
        imagenameArray = [...previmage.images, pickedImage.name];
      } else {
        imagenameArray = [pickedImage.name];
      }
      await firestoreCollection.set({images: imagenameArray});
      setpickeImage({
        uri: '',
        name: '',
        type: '',
      });
      Alert.alert('Uplaod Successs');
      setLoading(false);
      getImagesFromfirebase();
    } catch (erro) {
      console.log(erro);

      Alert.alert('please select an image');
      setLoading(false);
    }
  };
  useEffect(() => {
    getImagesFromfirebase();
  }, []);
  const getImages = () => {
  
      return new Promise<string[]>(async (resolve,reject) => {
        try{
        const previmage = (await firestoreCollection.get()).data();
        if (previmage != undefined && previmage?.images?.length > 0) {
          let imageurl: string[] = [];
          await Promise.all(
            previmage.images.map(async (item: string) => {
              const url = await storageLocation
                .child(`images/${item}`)
                .getDownloadURL();
              imageurl.push(url);
            }),
          );
          resolve(imageurl);
        }
        }catch(erro){
          reject(erro)
        }
      
      });
    
  };

  const getImagesFromfirebase = async () => {
    setLoading(true);
    try{
    const imageurl = await getImages();
    setImagearray(imageurl);
    setLoading(false);
    }catch(erro){
      setLoading(false)
    }
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        {/* {loading ? (
          <View
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              zIndex: 5,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <ActivityIndicator size={'large'} />
          </View>
        ) : null} */}
        <View style={styles.uplaodImage}>
          <TouchableOpacity
            onPress={() => {
              pickImage();
            }}
            style={styles.image}>
            <Image
              resizeMode="contain"
              style={{height: '60%', width: '80%'}}
              source={
                pickedImage.uri != ''
                  ? {uri: pickedImage.uri}
                  : require('./assets/click.png')
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImage();
            }}
            style={styles.btn}>
            <Text style={styles.btntitle}>Uplaod</Text>
          </TouchableOpacity>
        </View>
        <NestableScrollContainer
          contentContainerStyle={{marginTop: '5%', paddingBottom: '5%'}}>
          <NestableDraggableFlatList
            data={imageArray}
            // numColumns={2}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, drag}) => (
              <TouchableOpacity
                onLongPress={drag}
                style={{
                  height: height / 5,
                  width: '100%',
                  marginVertical: '2%',
                }}>
                <View
                  style={{
                    width: '80%',
                    alignSelf: 'center',
                    backgroundColor: 'white',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    style={{
                      height: '95%',
                      width: '95%',
                    }}
                    source={{uri: item}}
                  />
                </View>
              </TouchableOpacity>
            )}
            onDragEnd={({data}) => {
              setImagearray(data);
            }}
          />
        </NestableScrollContainer>
      </View>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'grey',
  },
  uplaodImage: {
    backgroundColor: 'white',
    height: '30%',
    marginTop: '5%',
    width: '95%',
    alignSelf: 'center',
    borderRadius: 8,
    elevation: 5,
  },
  image: {
    borderWidth: 0.5,
    marginTop: '5%',
    height: '60%',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: '17%',
    width: '50%',
    backgroundColor: 'green',
    marginTop: '5%',
    borderRadius: 6,
    elevation: 2,
  },
  btntitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
  },
});
export default App;
