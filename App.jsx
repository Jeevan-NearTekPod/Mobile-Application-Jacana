import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNFS from 'react-native-fs';

const App = () => {
  const [imageUri, setImageUri] = useState(null);
  const [text, setText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showOptions) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showOptions]);

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const source = {uri: response.assets[0].uri};
        setImageUri(source);
        setShowSubmit(true);
        setShowOptions(false);
      }
    });
  };

  const handleTakePhoto = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    try {
      const response = await launchCamera(options);
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
      } else {
        const source = {uri: response.assets[0].uri};
        if (source) {
          const filePath = source.uri.replace('file://', '');
          const buffer = await RNFS.readFile(filePath, 'base64');
          const base64ToFile = async (base64String, fileName) => {
            const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            await RNFS.writeFile(path, base64String, 'base64');
            return {
              uri: `file://${path}`,
              name: fileName,
              type: 'image/jpeg',
            };
          };
          const file = await base64ToFile(buffer, 'photo.jpg');
          // console.log(buffer,'88');
          const formData = new FormData();
          formData.append('image', file);

          fetch('http://192.168.82.110:5000/extract-text', {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
            .then(response => response.json())
            .then(responseJson => {
              setText(responseJson);
              alert(JSON.stringify(responseJson?.text));

              console.log(responseJson, '9888888888');
            })
            .catch(error => {
              console.error(error);
            });
        }

        setImageUri(source);
        setShowSubmit(true);
        setShowOptions(false);
      }
    } catch (error) {
      console.log('Camera launch error: ', error);
    }
  };
  const handleCancel = () => {
    setShowOptions(false);
    setShowSubmit(false);
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (imageUri) {
      const filePath = imageUri.uri.replace('file://', '');
      const buffer = await RNFS.readFile(filePath, 'base64');
      const base64ToFile = async (base64String, fileName) => {
        const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(path, base64String, 'base64');
        return {
          uri: `file://${path}`,
          name: fileName,
          type: 'image/jpeg',
        };
      };
      const file = await base64ToFile(buffer, 'photo.jpg');
      // console.log(buffer,'88');
      const formData = new FormData();
      formData.append('image', file);

      fetch('http://192.168.82.110:5000/extract-text', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then(response => response.json())
        .then(responseJson => {
          console.log(responseJson, '99999');
          // alert(JSON.stringify(responseJson?.text));

          setText(responseJson);
        })
        .catch(error => {
          console.error(error);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(text?.text)}</Text>
      {!showOptions && !showSubmit && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowOptions(true)}>
          <Icon name="plus" size={30} color="#fff" />
          <Text style={styles.buttonText}> Add Image</Text>
        </TouchableOpacity>
      )}
      {showOptions && (
        <Animated.View
          style={[
            styles.optionsContainer,
            {transform: [{translateY: slideAnim}]},
          ]}>
          <TouchableOpacity
            style={styles.buttonOption}
            onPress={handleTakePhoto}>
            <Icon name="camera" size={30} color="#fff" />
            <Text style={styles.buttonText}> Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonOption}
            onPress={handlePickImage}>
            <Icon name="upload" size={30} color="#fff" />
            <Text style={styles.buttonText}> Upload Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOption} onPress={handleCancel}>
            <Icon name="times" size={30} color="#fff" />
            <Text style={styles.buttonText}> Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {imageUri && <Image source={imageUri} style={styles.image} />}
      {showSubmit && (
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Icon name="send" size={30} color="#fff" />
            <Text style={styles.buttonText}> Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleCancel}>
            <Icon name="times" size={30} color="#fff" />
            <Text style={styles.buttonText}> Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 20,
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.5,
    shadowRadius: 5,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOption: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 20,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 20,
  },
  submitContainer: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
});

export default App;
