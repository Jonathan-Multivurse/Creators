import React, { Component } from 'react'
import { TouchableOpacity, Text,  StyleSheet, View, Dimensions, Image, Platform, PermissionsAndroid, LogBox, ActivityIndicator, ActionSheetIOS, Alert } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker';
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import BackButton from '../components/BackButton'
import { theme } from '../core/theme'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import USER_DB from '../api/userDB'
import USER_STOREAGE from '../api/userStoreage'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class SetProfileAdmin extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      isLoading: false,
      filePath: '',
    }
  }

  componentDidMount() {
    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
  }

  showActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Library', 'Cancel'],
          cancelButtonIndex: 2,
          userInterfaceStyle: 'light'
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            this.captureImage('photo');
          } else if (buttonIndex === 1) {
            this.chooseFile('photo');
          }
        }
      );
    } else {
      this.ActionSheet.show()
    }
  } 

  requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission',
          },
        );
        // If CAMERA Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };

  requestExternalWritePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'External Storage Write Permission',
            message: 'App needs write permission',
          },
        );
        // If WRITE_EXTERNAL_STORAGE Permission is granted
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        alert('Write permission err', err);
      }
      return false;
    } else return true;
  };

  captureImage = async (type) => {
    let isCameraPermitted = await this.requestCameraPermission();
    let isStoragePermitted = await this.requestExternalWritePermission();

    if (isCameraPermitted && isStoragePermitted) {
      setTimeout( () => {
        ImagePicker.openCamera({
          width: 300,
          height: 300,
          cropping: true,
        }).then(image => {
          console.log("crop image===>", image);
  
          this.setState({
            filePath: image
          })
        });
      }, 500)
    }
  };

  chooseFile = (type) => {  
    setTimeout( () => {
      ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
      }).then(image => {
        console.log("crop image===>", image);

        this.setState({
          filePath: image
        })
      });
    }, 500)
  };

  onProceed = async () => {
    
    let filePath = this.state.filePath
    if (filePath.path) {
      this.setState({
        isLoading: true,
      }) 

      let imageName = 'profile-' + filePath.path.substring(filePath.path.lastIndexOf('/') + 1);
      let uploadUri = Platform.OS === 'ios' ? filePath.path.replace('file://', '') : filePath.path;
      USER_STOREAGE.uploadProfileImage(imageName, uploadUri, this.goDownloadURL);
    } else {
      Alert.alert(
        "Error",
        "You should set a profile picture!"
      );
      return
    }
  }

  goDownloadURL = async () => { 
    let filePath = this.state.filePath   
    let imageName = 'profile-' + filePath.path.substring(filePath.path.lastIndexOf('/') + 1);
    const downloaduri = await USER_STOREAGE.downloadImage(imageName);
    console.log('downloaduri', downloaduri);

    USER_DB.updateProfile({image: downloaduri}, this.goNext);
  };  

  goNext = async () => {    
    this.setState({
      isLoading: false,
    }) 

    this.props.navigation.navigate('DashboardAdmin');
  };

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Set Profile Picture</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <View style={{flex:1}} />
          <TouchableOpacity style = {styles.imageView} onPress={this.showActionSheet} >
            {this.state.filePath.path ? <Image source={{uri : this.state.filePath.path}} style={styles.image} /> : <Image source={require('../assets/images/login/cameraRound.png')} style={styles.image} />}
            {this.state.filePath.path ? null : <Text style={styles.setText}>Tap to set photo</Text>  }
          </TouchableOpacity>

          <Text style={styles.pleaseText}>Please add your professional looking profile picture.</Text>
          <Text style={styles.itText}>It will be helpful in gaining users' trust during the support.</Text>
          <View style={{flex:1}} />

          <TouchableOpacity style={{...styles.doneButton, backgroundColor: this.state.filePath.path ? theme.colors.darkBlue : theme.colors.lineColor}} onPress={this.onProceed}>
            <Text style={{...styles.doneText, color: this.state.filePath.path ? 'white' : theme.colors.darkGray }}>Proceed</Text>
          </TouchableOpacity>

        </View>

        { Platform.OS === 'android' && 
          <ActionSheet
            ref={o => this.ActionSheet = o}
            options={['Camera', 'Photo Library', 'Cancel']}
            cancelButtonIndex={2}
            destructiveButtonIndex={0}
            onPress={(index) => { 
              if (index === 0) {
                this.captureImage('photo');
              } else if (index === 1) {
                this.chooseFile('photo');
              } 
            }}
          />
        }

        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null } 

      </Background>
    )
  }
}

const styles = StyleSheet.create({
  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },  

  imageView: {
    width: DEVICE_WIDTH - 140,
    height: DEVICE_WIDTH - 140,
    borderRadius: (DEVICE_WIDTH - 140)/2,
    alignItems: 'center',
    
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  image: {
    width: DEVICE_WIDTH - 140,
    height: DEVICE_WIDTH - 140,
    borderRadius: (DEVICE_WIDTH - 140)/2, 
    
    borderWidth: 3,
    borderColor: '#fff',    
  },

  setText: {
    position: 'absolute',
    alignSelf: 'center',
    top: (DEVICE_WIDTH - 140)/2 + 50,    

    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  }, 

  pleaseText: {
    marginTop: 57,
    marginHorizontal: 31,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },

  itText: {
    marginTop: 14,
    marginHorizontal: 28,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  },

  doneButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 33,
    marginBottom: 69,
    borderRadius: 28.5,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  doneText: {
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
  },

  termsView: {
    height: 41,
    marginBottom: 69,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  byText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  }, 

  termsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
    textDecorationLine: 'underline',
  },  
  
})