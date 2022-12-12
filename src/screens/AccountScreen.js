import React, { Component, useRef } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, View, Platform, TouchableOpacity, Text, Image, Dimensions, ActivityIndicator, Alert, Switch, TextInput, Modal, KeyboardAvoidingView, LogBox, ActionSheetIOS} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import { ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Background from '../components/Background'
import RatingView from '../components/RatingView'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import USER_DB from '../api/userDB'
import FACILITY_DB from '../api/facilityDB'
import EMAIL_AUTH from '../api/userAuth'
import USER_STOREAGE from '../api/userStoreage'
import ImagePicker from 'react-native-image-crop-picker';
import {
  logoutRequest
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

class AccountScreen extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    USER_DB.getProfile(this.onUserGet)
    USER_DB.getRating(this.onUserRating)      

    this.state = { 
      rep: null,
      firstName: '',
      firstNameError: '', 
      lastName: '',
      lastNameError: '', 
      email: '',
      emailError: '',
      profileImage: '',
      filePath: '',
      online: true,
      rating: [],
      password: '',

      isLoading: false,
      modalVisible: false,

      countFacility: 0,
    }
  }

  componentDidMount() {
    LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
    this._unsubscribeFocus = this.props.navigation.addListener("focus", () => {
      USER_DB.getProfile(this.onUserGet) 
      USER_DB.getRating(this.onUserRating) 
      FACILITY_DB.getFacilities(this.onGetFacilities)
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onGetFacilities = (facilities) => {   
    if (facilities.length > 0 ) {
      this.setState({
        isLoading: false,
        countFacility: facilities.length,
      })
    }    
  }

  onUserGet = (user) => {
    this.setState({
      rep: user,
      isLoading: false,
      email: user.email, 
      firstName: user.firstname,
      lastName: user.lastname,
      profileImage: user.image,
      online: user.online,
      password: user.password
    })
  } 

  onUserRating = (rating) => {
    if (rating && rating.rating){
      this.setState({
        rating: rating.rating,
      })
    }
  } 

  onLogoutPressed = () => {   
    Alert.alert(
      'Logout',
      `You can come back anytime and support the users.`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Logout",
          onPress: () => {
            this.setState({
              isLoading: true
            })

            EMAIL_AUTH.onPressLogOut(this.onUserLogout)              
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  onUserLogout = () => {
    this.props.logout()

    setTimeout(() => {
      this.setState({
        isLoading: false
      })  
      this.props.navigation.navigate('StartScreen') 
    }, 1000);    
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
          this.onProceed(image);
        });
      }, 500)       
    }
  };

  chooseFile = (type) => {
    setTimeout( () => {
      ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true
      }).then(image => {
        console.log("crop image===>", image);

        this.setState({
          filePath: image
        })
        this.onProceed(image);
      });
    }, 500)    
  };

  onProceed = async (filePath) => {
    this.setState({
      isLoading: true,
    })  
    let imageName = 'profile-' + filePath.path.substring(filePath.path.lastIndexOf('/') + 1);
    let uploadUri = Platform.OS === 'ios' ? filePath.path.replace('file://', '') : filePath.path;  
    USER_STOREAGE.uploadProfileImage(imageName, uploadUri, this.goDownloadURL);  
  }

  goDownloadURL = async () => {    
    let filePath = this.state.filePath
    let imageName = 'profile-' + filePath.path.substring(filePath.path.lastIndexOf('/') + 1);    
    const downloaduri = await USER_STOREAGE.downloadImage(imageName);
    console.log('downloaduri', downloaduri);

    this.setState({
      profileImage: downloaduri
    })

    USER_DB.updateProfile({image: downloaduri, updated: new Date().getTime()}, this.goNext);
  };

  goNext = async () => { 
    this.setState({
      isLoading: false
    })    
  };

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

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  onDone = () => {    
    const firstNameError = nameValidator(this.state.firstName)
    const lastNameError = nameValidator(this.state.lastName)
  
    if (firstNameError  || lastNameError  ) {
      this.updateInputVal(firstNameError, 'firstNameError')
      this.updateInputVal(lastNameError, 'lastNameError')
      return
    }

    this.setState({
      isLoading: true,
    })

    USER_DB.updateProfile({firstname: this.state.firstName, lastname: this.state.lastName}, this.onUserUpdated)
  }

  onUserUpdated = () => {
    this.setState({
      isLoading: false,
      modalVisible: false,
    })
  }

  goRatings = () => {
    if (this.state.rating.length > 0) {
      this.props.navigation.navigate('RatingReviewScreen', {
        ratings: this.state.rating
      }) 
    }    
  }

  onChnageStatus = () => {
    this.setState({
      online: !this.state.online
    })

    USER_DB.updateProfile({online: !this.state.online}, this.onUserUpdated)
  }

  onChangePassword = () => {
    this.props.navigation.navigate('ChangePassword', {
      title: "Change Password"
    })  
    EMAIL_AUTH.onUserLogin(this.state.email, this.state.password, this.goChangePassword)    
  }

  onDisableAccount = () => {
    Alert.alert(
      'Disable Account',
      `Are you sure that disable your account?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Disable",
          onPress: () => {
            this.setState({
              isLoading: true
            })
            
            this.onUserLogoutWithDisable()          
          },
        },        
      ],
      { cancelable: false }
    );   
  }

  onUserLogoutWithDisable = () => {
    this.props.logout()

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/disableAccount', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userID: this.state.rep.userid,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      console.log("response ===>", responseJson)
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });

        return;
      }

      EMAIL_AUTH.onPressLogOut(this.onUserLogout)  
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      })
    });    
  }

  goChangePassword = () => {
  }

  onAvailabiltiy = () => {
    this.props.navigation.navigate('ManageAvailability', {
      rep: this.state.rep
    })    
  }

  onFacilities = () => {
    this.props.navigation.navigate('FacilityScreen', {
      isAdmin: false
    })  
  }

  render() {
    const repRatings = this.state.rating;
    var userRating = 0    
    if (repRatings.length > 0 ) {
      let sum = 0
      for(let i = 0; i < repRatings.length; i++){
        let tmp = repRatings[i]
        sum += tmp.star
      }
      
      userRating = (sum/repRatings.length).toFixed(1)
    }

    return (
      <Background>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onEdit(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView}>
            <View style={{flex:1}}/>
            <View style = {styles.modalView}>
              <View style={styles.titleView}>
                <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Edit Profile</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.onEdit(false)} style={styles.closeButton} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>First name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.firstName}
                onChangeText={ (text) => this.updateInputVal(text, 'firstName') }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
                keyboardType="name-phone-pad"
              />

              <Text style={styles.lastNameText}>Last name</Text>
              <TextInput
                style={styles.emailInput}
                value={this.state.lastName}
                onChangeText={ (text) => this.updateInputVal(text, 'lastName') }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
                keyboardType="name-phone-pad"
              />

              <TouchableOpacity style={styles.loginButton} onPress={() => this.onDone()}>
                <Text style={styles.loginText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>Account</Text>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => this.onLogoutPressed()} style={styles.rightButton}>
            <Image  style={styles.alertImage} source={require('../assets/images/account/logout.png')} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileView}>
          <View style={styles.profileImageView} >
            {this.state.profileImage == '' ? <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/> 
            : <Image style={styles.profileImage} source={{uri: this.state.profileImage}}/>}            
            <TouchableOpacity style={styles.cameraButton} onPress={this.showActionSheet}>
              <Image style={styles.cameraImage} source={require('../assets/images/account/icon_photo.png')}/>                
            </TouchableOpacity>            
          </View>          

          <Text style={styles.nameText}>{this.state.firstName + " " + this.state.lastName}</Text>
          <Text style={styles.emailText}>{this.state.email}</Text>

          <TouchableOpacity style={styles.ratingView} onPress={() => this.goRatings()} >
            <RatingView star={userRating} type={1}/>
            <Text style={styles.ratingText}>{'(' + repRatings.length.toString() + ')'}</Text>
            <Image source={require('../assets/images/account/arrow_bforward.png')} style={styles.forwardImage} />            
          </TouchableOpacity>

          <TouchableOpacity onPress={() => this.onEdit(true)} style={styles.editButton}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentView}>
          <View style={styles.changeView}>
            <Text style={styles.changeText}>Online Status</Text>
            <View style={{flex: 1}}/>
            <Switch
              style={styles.onlineSwitch}
              trackColor={{ false: "#F2F2F2", true: "#31D74B" }}
              thumbColor={this.state.online ? "#fff" : "#fff"}
              // ios_backgroundColor='#31D74B'
              onValueChange={this.onChnageStatus}
              value={this.state.online}
            />            
          </View>

          <TouchableOpacity style={styles.changeView} onPress={() => this.onChangePassword()}>
            <Text style={styles.changeText}>Change Password</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeView} onPress={() => this.onDisableAccount()}>
            <Text style={styles.changeText}>Disable Account</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton}>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeView} onPress={() => this.onAvailabiltiy()}>
            <Text style={styles.changeText}>Availability</Text>
            <View style={{flex: 1}}/>
            <View style={styles.arrowButton} >
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeView} onPress={() => this.onFacilities()}>
            <Text style={styles.changeText}>Manage Facilities</Text>
            <View style={{flex: 1}}/>
            <Text style={{...styles.changeText, marginTop: 13, color: theme.colors.darkGray}}>{this.state.countFacility}</Text>
            <View style={styles.arrowButton} >
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </View>
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
        ) : null}
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
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',        
  },

  rightButton: {
    width: 79,
    height: 50,
    marginRight: 16,
    paddingTop: 17,
  },

  alertImage: {
    width: 79,
    height: 23,
  },

  profileView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',

    justifyContent: 'center',
    backgroundColor: theme.colors.inputBar
  },

  profileImageView :{
    width: 158,
    height: 158,
    borderRadius: 79,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 3,
    borderColor: '#fff',
  },

  cameraButton: {
    width: 96,
    height: 96,
    position: 'absolute',
    right: -20,
    bottom: -35,
  },

  cameraImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },

  nameText: {
    height: 33,
    marginTop: 14,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',
  },

  emailText: {
    height: 21,
    marginTop: 3,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },

  ratingView: {
    flexDirection: 'row',
    marginTop: 6,
  },

  ratingText: {
    height: 22,    
    marginLeft: 2,
    paddingTop: 3,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },

  forwardImage: {
    width: 9,
    height: 14,  
    marginTop: 7,
    marginLeft: 8,  
    resizeMode: 'contain',
  },

  editButton: {    
    height: 40,
    marginTop: 12,
  },

  editText: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkBlue
  },

  contentView: {
    width: '100%',
    height: 300,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },

  changeView: {
    height: 45,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',  
  },

  onlineSwitch: {
    marginRight: 10,
    alignSelf: "center",
    justifyContent: "center"
  },

  changeText: {    
    height: 21,
    marginLeft: 14,
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  arrowButton: {
    width: 50,
    height: 45,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },

  arrowImage: {
    width: 10,
    height: 16,
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: "white", 

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },

  titleView : {    
    flexDirection: 'row',
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  closeButton: {
    width: 60, 
    height: 60, 
    position: 'absolute',
    right: 10,
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  coloseImage: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 44,
    height: 44,
  },  

  firstNameText: {
    height: 20,
    marginLeft: 16,
    marginTop: 42,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: DEVICE_WIDTH - 32,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  lastNameText: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 43,
    marginBottom: 57,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },
  
})

const mapStateToProps = ({ auth }) => ({
  user: auth.user,
})

const mapDispatchToProps = {
  logout: logoutRequest
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountScreen)