import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, View, Platform, TouchableOpacity, Text, TextInput, Dimensions, Alert, ActivityIndicator, Linking } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { emailValidator } from '../helpers/emailValidator'
import { passwordValidator } from '../helpers/passwordValidator'
import AsyncStorage from '@react-native-async-storage/async-storage'
import OTPSender from '../api/api'
import EMAIL_AUTH from '../api/userAuth'
import USER_DB from '../api/userDB'
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

class LoginScreen extends Component {
  constructor(props) {
    super(props);   
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,
      email: '',
      password: '',   
      emailError: '', 
      passwordError: '',     
      token: '',
      fullName: '',
    }
  }

  componentDidMount() {
    this.getUserInfo()
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getUserInfo()
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  getUserInfo = async () => {
    try {
      const emailValue = await AsyncStorage.getItem('rep_email')
      console.log("Stored Email is:", emailValue);
      if(emailValue !== null) {
        this.setState({email: emailValue})
      }
    } catch(e) {
      console.log('Failed read User Email.')
    }

    try {
      const passwordValue = await AsyncStorage.getItem('rep_password')
      if(passwordValue !== null) {
        this.setState({password: passwordValue})
      }
    } catch(e) {
      console.log('Failed read User Password.')
    }

    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        this.setState({token: tokenValue})
      } 
    } catch(e) {
      console.log('Failed read User Token.')
    }
  } 

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onLoginPressed = () => {
    const emailError = emailValidator(this.state.email)
    const passwordError = passwordValidator(this.state.password)

    if (emailError || passwordError) {
      this.updateInputVal(emailError, 'emailError')
      this.updateInputVal(passwordError, 'passwordError')
      return
    }

    this.setState({
      isLoading: true,
    })

    EMAIL_AUTH.onPressLogin(this.state.email, this.state.password, this.state.token, this.onUserSuccess, this.onFake, this.onUserLoginFail )
  }

  onUserSuccess= async () => {    
    try {
      console.log(this.state.email)
      await AsyncStorage.setItem('rep_email', this.state.email)
    } catch (e) {
      console.log('saving user email error')
    }

    try {
      await AsyncStorage.setItem('rep_password', this.state.password)
    } catch (e) {
      console.log('saving user password error')
    }

    this.setState({
      emailError: '',
      passwordError: '',
      fullName: '',
    })

    USER_DB.getProfile(this.onUserGet)       
  };

  onUserGet = (userFB) => {
    this.setState({
      fullName: userFB.firstname + " " + userFB.lastname
    })
    this.submit(this.state.email, userFB.firstname + " " + userFB.lastname)
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
    USER_DB.updateProfile({token: this.state.token, QBId: user.id}, null)

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
    this.setState({
      isLoading: false,
      emailError: '',
      passwordError: '',
    })

    this.props.navigation.navigate('Dashboard')
  };

  goSetProfile = async () => {    
    this.setState({
      isLoading: false,
      emailError: '',
      passwordError: '',
    })
    
    this.props.navigation.navigate('RegisterProfileScreen', {
      fullName: this.state.fullName
    });
  };

  goWaiting = async () => {    
    this.setState({
      isLoading: false,
      emailError: '',
      passwordError: '',
    })

    USER_DB.updateProfile({'isAccept': 'pending', updated: new Date().getTime()}, this.props.navigation.navigate('RegisterWaiting'));

    OTPSender.sendEmail("pford@echosimulation.com", this.state.fullName + " sent you request for a company representative account.", 'pendingAccount', this.onSentCode, this.onSentCodeFailed);
  };

  onSentCode = () => { 
  }

  onSentCodeFailed = () => { 
    this.setState({
      isLoading: false,
    })
  }

  onFake = async () => {    
    this.setState({
      isLoading: false,
    })

    Alert.alert(
      "Error",
      `Permission was denied with ${this.state.email}`,
      [
        {
          text: "OK",
          onPress: () => console.log("OK Pressed")
        },
      ],
      { cancelable: false }
    );    
  };

  onUserLoginFail = () => {
    this.setState({
      isLoading: false,
    })
  }

  onPasswordReset = () => {
    this.props.navigation.navigate('ChangePassword', {
      title: "Password Reset"
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
          <PageTitle>Login</PageTitle>
          <TouchableOpacity onPress={() => this.props.navigation.navigate('RegisterScreen')} style={styles.rightButton}>
            <Text style={styles.rightText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style = {styles.contentView}>  
          <Text style={styles.emailText}>Email</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.email}
            onChangeText={ (text) => this.updateInputVal(text, 'email') }
            autoCapitalize="none"
            autoCompleteType="email"
            textContentType="emailAddress"
            keyboardType="email-address"
          />

          <Text style={styles.passwordText}>Password</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.password}
            onChangeText={ (text) => this.updateInputVal(text, 'password') }
            secureTextEntry={true}
          />

          <TouchableOpacity onPress={() => this.onPasswordReset()} >
              <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 522 : DEVICE_HEIGHT - 528}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton} onPress={() => this.onLoginPressed()}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => this.openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

        </View>

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
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  rightButton: {
    height: 50,
    position: 'absolute',    
    bottom: 0,
    right: 0,
    paddingBottom: 8,
    paddingRight: 16,
    justifyContent: 'flex-end',
  },

  rightText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: theme.colors.primary
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  emailText: {
    height: 20,
    marginTop: 44,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  passwordText: {
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  forgotText: {
    height: 60,
    paddingTop: 16,
    alignSelf: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 32,
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
    fontFamily: 'Poppins-Medium',
    color: 'white',
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

const mapStateToProps = ({ auth, chat, users }) => ({
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen)