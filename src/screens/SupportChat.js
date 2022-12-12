import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, StyleSheet, Image, Dimensions, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import firestore from '@react-native-firebase/firestore'
import auth, {firebase} from "@react-native-firebase/auth"
import USER_DB from '../api/userDB'

import { showError } from '../NotificationService'
import { 
  usersGet,
  usersChatSelect,
  dialogCreate, 
  dialogJoin,
  dialogCreateCancel, 
  messageSend } from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

class SupportChat extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    USER_DB.getProfile(this.onUserGet)

    this.state = { 
      isLoading: false,
      request: this.props.route.params.request,
      curUser: '',
    }
  }

  componentDidMount() {
    this._observer = firestore()
    .collection('request')
    .doc(this.state.request.requestid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          this.setState({request: documentSnapshot.data()})
          if ((documentSnapshot.data()['status'] === 'cancelled' ) || (documentSnapshot.data()['status'] === 'completed' )) {
            // this.props.navigation.goBack()      
          }
        }        
      }
    })
  }

  componentWillUnmount() {
    this._observer();
  }

  onUserGet = (user) => {
    this.setState({
      curUser: user,
    })
  }

  onAccept = async() => {
    this.setState({
      isLoading: true,
    })

    const requestID = this.state.request.requestid;
    const userID = firebase.auth().currentUser.uid;
    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/acceptRequest', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestid: requestID,
        receiverid: userID,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        return;
      } 

      console.log("Accepted Support Successfully")      
      this.goNext();
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
    });
  } 

  goNext = async () => {
    if (this.state.request.type == 'Chat') {
      setTimeout(() => {
        this.joinHandler()         
      }, 1200); 
    } else {
      this.setState({
        isLoading: false,
      });
    }
  }

  joinHandler = () => {   
    const { joingDialog,  navigation, selected } = this.props

    new Promise((resolve, reject) => {
      joingDialog({ dialogId: this.state.request.dialog.id, resolve, reject })
    })
    .then(action => {
      this.setState({
        isLoading: false,
      })
      
      global.curUser = this.state.curUser
      global.selectedRequest = this.state.request
      
      const dialog = this.state.request.dialog
      navigation.navigate('Messages', {dialog})
    })
    .catch(action => {
      this.setState({
        isLoading: false,
      })
      // showError('Failed to join dialog', action.error)
    })
  }

  render() {
    return (
      <Background>
        

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Support {this.state.request.type} </PageTitle>
        </View>

        <View style = {styles.logoView}>
          <View style={{flex: 1}} />
          <View style={styles.imageView}>
            <Image source={require('../assets/images/home/iconUser.png')} style={styles.logoImage} />
          </View>         
          <Text style={styles.melisaText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname}</Text>
          <Text style={styles.requestText}>Requesting...</Text>
          <View style={{flex: 1}}/>          
        </View>

        <View style={styles.contentView}>
          <View style={{flex: 1}}/>
          <Text style={styles.yourText}>{this.state.request.sender.firstname + " " + this.state.request.sender.lastname} is requesting your support.</Text>
          <Text style={styles.needsText}>{this.state.request.sender.firstname} needs your help, please accept the request and start the conversation.</Text>
          <View style={{flex: 1}}/>
          
          <TouchableOpacity  style={styles.cancelButton} onPress={this.onAccept}>
            <Text style={styles.cancelText}>Accept</Text>
          </TouchableOpacity>
        </View>

        {this.state.isLoading ? (
            <ActivityIndicator
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
    backgroundColor: theme.colors.inputBar
  },     

  logoView: {
    width: '100%',
    height: DEVICE_HEIGHT * 0.5,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.inputBar
  },

  imageView: {
    width: DEVICE_WIDTH - 160,
    height: DEVICE_WIDTH - 160,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  logoImage: {
    width: DEVICE_WIDTH - 160,
    height: DEVICE_WIDTH - 160,
    borderRadius: (DEVICE_WIDTH - 160) / 2,
    borderWidth: 3,
    borderColor: '#fff',
    resizeMode: 'contain',
  },

  melisaText: {
    marginTop: 15,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',       
  },

  requestText: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',       
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  yourText: {
    width: 310,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Medium',
  },

  needsText: {
    marginTop: 10,
    width: 315,
    textAlign: 'center',  
    alignSelf: 'center', 
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',  
  },

  cancelButton: {
    width: DEVICE_WIDTH - 64,
    height: 57, 
    marginBottom: 57,   
    borderRadius: 28.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.darkBlue   
  }, 

  cancelText: {    
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: '#fff',
  },
})

const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  currentUser: auth.user,
  selected: users.selected,
  connected: chat.connected,  
  loading: chat.loading,
  users: users.users,
})

const mapDispatchToProps = {
  getUsers: usersGet,
  selectUser: usersChatSelect,
  cancel: dialogCreateCancel,
  createDialog: dialogCreate,
  sendMessage: messageSend,
  joingDialog: dialogJoin,
}

export default connect(mapStateToProps, mapDispatchToProps)(SupportChat)