import React, { Component } from 'react'
import { connect } from 'react-redux'
import {StyleSheet, View, Text, Image, Dimensions, TouchableOpacity } from 'react-native'
import Background from '../components/Background'
import { theme } from '../core/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging from '@react-native-firebase/messaging'
import auth from '@react-native-firebase/auth';
import USER_DB from '../api/userDB'
import OTPSender from '../api/api'
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;

class StartScreen extends Component {
  constructor(props) {
    super(props)    
    this._subscriber = null;

    this.state = {
      token: '',
      fullName: ''      
    }
  }

  componentDidMount() {
    this.requestUserPermission(); 
    this._subscriber = auth().onAuthStateChanged(this.onUserLoggedIn);
  }

  componentWillUnmount() {
    this._subscriber();
  }

  requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      this.getFcmToken()      
    }
  }

  getFcmToken = async () => {
    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        this.setState({token: tokenValue})
      } else {
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          console.log("FCM Token is:", fcmToken);
          this.setState({token: fcmToken})
          this.storeFcmToken(fcmToken)
        } else {
          console.log("Failed get FCM Token.");
        }
      }
    } catch(e) {
      console.log('Failed read User Token.')
    }
  }

  storeFcmToken = async (tokenValue) => {
    try {
      await AsyncStorage.setItem('user_token', tokenValue)
    } catch (e) {
      console.log('Failed store User Token')
    }
  }

  onUserLoggedIn = async (user) => {    
    const { appReady, loggedIn } = this.props

    if (loggedIn) {
      if (user){
        if (this.state.token != '') {
          USER_DB.updateProfile({token: this.state.token}, this.onCheckAdmin(user))
        } else {
          this.onCheckAdmin(user)
        }      
      } else {
        return
      }
    }
  }

  onCheckAdmin = async (user) => {
    USER_DB.isAdminProfile(user.uid, this.userAdmin, this.userRep);
  }

  userAdmin = async () => {
    this.props.navigation.navigate('DashboardAdmin');
  };

  userRep = (userFB) => {
    this.setState({
      fullName: userFB.firstname + " " + userFB.lastname
    })

    this.submit(userFB.email, userFB.firstname + " " + userFB.lastname)
  }

  submit = async(login, username) => {
    const { createUser, signIn } = this.props;
    new Promise((resolve, reject) => {
      signIn({ login, resolve, reject })
    }).then(action => {
      this.checkIfUsernameMatch(username, action.payload.user)
    }).catch(action => {
      const { error } = action
      if (error.toLowerCase().indexOf('unauthorized') > -1) {
        new Promise((resolve, reject) => {
          createUser({
            fullName: username,
            login,
            password: 'quickblox',
            resolve,
            reject,
          })
        }).then(() => {
          this.submit({ login, username })
        }).catch(userCreateAction => {
          const { error } = userCreateAction
          if (error) {
            console.log('Failed to create user account', error)
          }
        })
      } else {
        console.log('Failed to sign in', error)
      }
    })
  }

  checkIfUsernameMatch = (username, user) => {
    const { updateUser } = this.props
    const update = user.fullName !== username ?
      new Promise((resolve, reject) => updateUser({
        fullName: username,
        login: user.login,
        resolve,
        reject,
      })) :
      Promise.resolve()
    update
      .then(this.connectAndRedirect)
      .catch(action => {
        if (action && action.error) {
          console.log('Failed to update user', action.error)
        }
      })
  }

  connectAndRedirect = () => {
    this.setState({
      isLoading: false
    })
    const { connectAndSubscribe, navigation } = this.props
    connectAndSubscribe()

    USER_DB.checkProfile(this.goDashboard, this.goSetProfile, this.goWaiting)
  }

  goDashboard = async () => {
    this.props.navigation.navigate('Dashboard');
  };

  goSetProfile = async () => {     
    this.props.navigation.navigate('RegisterProfileScreen', {
      fullName: this.state.fullName
    });
  };

  goWaiting = async () => {    
    USER_DB.updateProfile({'isAccept': 'pending', updated: new Date().getTime()}, this.props.navigation.navigate('RegisterWaiting'));

    OTPSender.sendEmail("pford@echosimulation.com", this.state.fullName + " sent you request for a company representative account.", 'pendingAccount', this.onSentCode,  this.onSentCodeFailed);
  };

  onSentCode = () => { 
  }

  onSentCodeFailed = () => { 
  }

  render() {
    return (
      <Background>
        <View style = {styles.contentView}>
          <View style={{flex: 1}} />
          <Image source={require('../assets/images/login/groupLogo.png')} style={styles.logoImage} />
          <Text style={styles.welcomeText}>Welcome to the Team</Text>
          <Text style={styles.ourText}>Our mission is to minimize downtime for our users of medical simulation.</Text>

          <View style={{flex: 1}} />

          <TouchableOpacity onPress={() => this.props.navigation.navigate('RegisterScreen')} style={styles.registerButton}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => this.props.navigation.navigate('LoginScreen')} style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => this.props.navigation.navigate('LoginAdmin')} style={styles.adminButton}>
            <Text style={styles.adminText}>Admin Login</Text>
            <Image source={require('../assets/images/login/icon-right.png')} style={styles.iconImage} />
          </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

const styles = StyleSheet.create({
  contentView: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  logoImage: {
    width: DEVICE_WIDTH,
    height: DEVICE_WIDTH * 428/375,
    resizeMode: 'contain',
  },  

  welcomeText: {
    marginTop: 10,    
    fontSize: 28,
    lineHeight: 42,
    fontFamily: "Poppins-SemiBold",    
  },

  ourText: {
    marginTop: 7,
    marginHorizontal: 21,    
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "Poppins-Regular",
    textAlign: 'center',    
  },

  registerButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 30,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  registerText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 17,
    borderRadius: 28.5,
    borderWidth: 2,
    borderColor: theme.colors.darkBlue,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginText: {
    marginLeft: 3,
    height: 40,
    paddingTop: 7,
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkBlue,
  },

  adminButton: {
    width: 250,
    marginTop: 38,
    marginBottom: 48, 
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',  
    justifyContent: 'center'
  },

  adminText: {
    alignSelf: 'center',
    alignItems: 'center',    
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: 'black'
  }, 

  iconImage: {
    width: 12,
    width: 12,
    marginLeft: 12,
    
  },  
})

const mapStateToProps = ({ app, auth, chat, users }) => ({
  appReady: app.ready,
  loggedIn: auth.loggedIn,
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(StartScreen)
