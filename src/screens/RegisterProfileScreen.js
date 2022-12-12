import React, { Component } from 'react'
import { TouchableOpacity, Platform, StyleSheet, View, Dimensions, Image, Text, PermissionsAndroid, LogBox, ActivityIndicator, Alert, ActionSheetIOS, Linking} from 'react-native'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import ImagePicker from 'react-native-image-crop-picker';
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import BackButton from '../components/BackButton'
import { theme } from '../core/theme'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import OTPSender from '../api/api'
import USER_DB from '../api/userDB'
import USER_STOREAGE from '../api/userStoreage'


const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class RegisterProfileScreen extends Component {
  constructor(props) {
    super(props);   
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,

      fullName: this.props.route.params.fullName,
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

  requestExternalWritePermission = async() => {
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

  onProceed = async() => {
    let filePath = this.state.filePath
    if (filePath.path) {
      this.setState({
        isLoading: true,
      })  

      console.log('file path is === >', filePath)

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

    USER_DB.updateProfile({image: downloaduri, 'isAccept': 'pending', updated: new Date().getTime()}, this.goNext);
  };

  goNext = async () => { 
    this.setState({isLoading: false})

    OTPSender.sendEmail("pford@echosimulation.com", this.state.fullName + " sent you request for a company representative account.", 'pendingAccount', this.onSentCode, this.onSentCodeFailed);

    this.props.navigation.navigate('RegisterWaiting');
  };

  onSentCode = () => { 
  }

  onSentCodeFailed = () => { 
    this.setState({
      isLoading: false
    })
  }

  openTerms = async () => {
    // this.props.navigation.replace('TermsScreen')

    const termsURL = 'https://www.echo.healthcare/support'
    Linking.canOpenURL(termsURL).then(supported => {
      if (supported) {
        Linking.openURL(termsURL);
      } else {
        console.log("Don't know how to open URI: " + termsURL);
      }
    });
  }

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Set Profile Picture</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <View style={{flex:1}}></View>
          <TouchableOpacity style={styles.imageView} onPress={this.showActionSheet}>
            {this.state.filePath.path ? <Image source={{uri : Platform.OS === 'ios' ? this.state.filePath.path.replace('file://', ''): this.state.filePath.path}} style={styles.image} /> : <Image source={require('../assets/images/login/cameraRound.png')} style={styles.image} />}
          </TouchableOpacity>
          <View style={{flex: 1}}></View>

          <Text style={styles.pleaseText}>Please add your professional looking profile picture.</Text>
          <Text style={styles.itText}>It will be helpful in gaining users' trust during the support.</Text>

          <TouchableOpacity style={styles.doneButton} onPress={this.onProceed}>
            <Text style={styles.doneText}>Send Approve Request</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => this.openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

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
        ) : null} 
      </Background>
    );
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
    width: 242,
    height: 242,
    borderRadius: 121,
    
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  image: {
    width: 242,
    height: 242,    
    
    borderRadius: 121,
    borderWidth: 3,
    borderColor: '#fff',    
  },

  pleaseText: {
    marginTop: 24,
    marginHorizontal: 31,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',
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
    marginBottom: 33,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
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
    color: 'white',
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