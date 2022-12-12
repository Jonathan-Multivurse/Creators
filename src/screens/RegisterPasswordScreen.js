import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, Platform, View, TouchableOpacity, Text, TextInput, Dimensions, ActivityIndicator, Linking, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { passwordValidator } from '../helpers/passwordValidator'
import EMAIL_AUTH from '../api/userAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

class RegisterPasswordScreen extends Component {  
  constructor(props) {
    super(props)    

    this.state = { 
      password: '',      
      cpassword: '',
      passwordError: '',
      cpasswordError: '',
      isLoading: false,
      token: '',
    }
  }

  componentDidMount() {  
    this.getUserInfo()
  }

  getUserInfo = async () => {
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
  
  onCreatePressed = () => {
    const passwordError = passwordValidator(this.state.password)
    const cpasswordError = passwordValidator(this.state.cpassword)

    if (passwordError || cpasswordError ) {
      this.updateInputVal(passwordError, 'passwordError')
      this.updateInputVal(cpasswordError, 'cpasswordError')
      return
    }

    if (this.state.password === this.state.cpassword) {      
      this.setState({
        isLoading: true,
      })

      EMAIL_AUTH.onCreateUser(this.props.route.params.email, this.state.password, this.props.route.params.firstName, this.props.route.params.lastName, this.state.token, this.onUserLoggedIn, this.onUserLoginFail)
    } else {
      Alert.alert("Error", "Passwords are mismatched.");
      return
    }
  }

  onUserLoggedIn = async() => {
    try {
      await AsyncStorage.setItem('rep_email', this.props.route.params.email)
    } catch (e) {
      console.log('saving user email error')
    }

    try {
      await AsyncStorage.setItem('rep_password', this.state.password)
    } catch (e) {
      console.log('saving user password error')
    }

    this.setState({
      passwordError: '',
      cpasswordError: '',
    })

    this.submit(this.props.route.params.email, this.props.route.params.firstName + " " + this.props.route.params.lastName)
  }

  submit = async(login, username) => {
    const { createUser, signIn } = this.props;
    new Promise((resolve, reject) => {
      signIn({ login, resolve, reject })
    }).then(action => {
      this.checkIfUsernameMatch(username, action.payload.user)
    }).catch(action => {
      const { error } = action
      if (error.toLowerCase().indexOf('unauthorized') > -2) {
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
    this.props.navigation.navigate('RegisterProfileScreen', {
      fullName: this.props.route.params.firstName + " " + this.props.route.params.lastName
    })
  }

  onUserLoginFail = () => {
    this.setState({
      isLoading: false,
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
          <PageTitle>Create Password</PageTitle>
        </View>

        <View style = {styles.contentView}>
          <Text style={styles.passwordText}>Create a password</Text>
          <TextInput
            style={styles.emailInput}
            returnKeyType="next"
            value={this.state.password}
            onChangeText={ (text) => this.updateInputVal(text, 'password') }
            secureTextEntry
          />

          <Text style={styles.verifyText}>Verify password</Text>
          <TextInput
            style={styles.emailInput}
            returnKeyType="done"            
            value={this.state.cpassword}
            onChangeText={ (text) => this.updateInputVal(text, 'cpassword') }
            secureTextEntry
          />

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 465 : DEVICE_HEIGHT - 471}} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.doneButton} onPress={() => this.onCreatePressed()}>
            <Text style={styles.doneText}>Proceed</Text>
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

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  passwordText: {
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

  verifyText: {
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  doneButton: { 
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

const mapStateToProps = ({ auth, chat, users }) => ({
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(RegisterPasswordScreen)
