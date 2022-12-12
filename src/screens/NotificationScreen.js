import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Platform, Image, Dimensions, TextInput, TouchableOpacity, Text, SectionList, ActivityIndicator, Modal, LogBox, KeyboardAvoidingView, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import firestore from '@react-native-firebase/firestore'
import {firebase} from '@react-native-firebase/auth'
import USER_DB from '../api/userDB'
import REQUEST_DB from '../api/requestDB'

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

GetTypeIcon = ({type}) => {
  var activeurl = ''

  if (type == 'submitting'){
    activeurl = require('../assets/images/notification/iconNSubmitting.png')
  } else if (type == 'submitted' || type == 'requestedColleague'){
    activeurl = require('../assets/images/notification/iconNSubmitted.png')
  } else if (type == 'askedAdmin'){
    activeurl = require('../assets/images/notification/iconNSubmitted.png')
  } else if ((type == 'accepted') || (type == 'repAccepted')){
    activeurl = require('../assets/images/notification/iconNAccepted.png')
  } else if ((type == 'end') || (type == 'endedCall')){
    activeurl = require('../assets/images/notification/iconNEnd.png')
  } else if ((type == 'message') || (type == 'endedChat')){
    activeurl = require('../assets/images/notification/iconNMessage.png')
  } else if (type == 'reminder'){
    activeurl = require('../assets/images/notification/iconNReminder.png')
  } else if (type == 'availability'){
    activeurl = require('../assets/images/notification/iconNStatus.png')
  } else if ((type == 'cancelled') || (type == 'repDeclined')){
    activeurl = require('../assets/images/notification/iconNCancel.png')
  } else if (type == 'received') {
    activeurl = require('../assets/images/notification/iconNReceived.png')
  } else if ( type == 'colleague' || type == 'colleagueAccepted' || type == 'colleagueDeclined' ){
    activeurl = require('../assets/images/notification/iconNReceived.png')
  } else if ( type == 'assign' || type == 'assignAccepted' || type == 'assignDeclined'  ){
    activeurl = require('../assets/images/notification/iconNReceived.png')
  } else {
    activeurl = require('../assets/images/notification/iconNReceived.png')
  }

  return (
    <Image source={activeurl} style={styles.iconImage} />
  )
}

getTimeagao = (mSeconds) =>{
  var deffTime = '';
  const diff = new Date().getTime() - mSeconds;
  if (diff < 60*60*1000) {
    deffTime = Math.floor( diff/(60*1000) ) + " mins ago";
  } else if (diff < 2*60*60*1000 ){
    deffTime = "1 hour ago";
  } else if(diff < 24*60*60*1000) {
    deffTime = Math.floor( diff/(60 * 60 * 1000) ) + " hours ago";
  } else if (diff < 2*24*60*60*1000 ){
    deffTime = "1 day ago";
  } else {
    deffTime = Math.floor( diff/(24 * 60 * 60 * 1000) ) + " days ago";
  }
  return deffTime;
}

class NotificationScreen extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    this.state = {
      isLoading: false,
      notifications: [],
      newNotifications: [],
      oldNotificaitons: [],  
      
      modalVisible: false,
      selectedItem: null,
      selectedContent: '',
      declineAssign: '',

      isSelect: false,
      arySelected: [],
      isSelectAll: false
    };
  }

  componentDidMount() {    
    this.storeNotficationFlag('false');
    
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      USER_DB.getProfile(this.onUserGet)
      this.getNotifications();
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getNotifications();
      }      
    });
  }

  componentWillUnmount() {
    var arrayIds = []
    const notifications = this.state.notifications
    notifications.forEach(item => {
      const tmpNotification = item.notification;
      arrayIds.push(tmpNotification.notificationId);
    });
    this.storeNotficationData(arrayIds)
    this.storeNotficationFlag('false');

    this._unsubscribeFocus();
    this._observer();
  } 

  onUserGet = (user) => {
    this.setState({
      curUser: user,
    })
  }

  getNotifications = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getNotifications', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      console.log('response is ===>', responseJson)
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        return;
      }

      this.setState({
        isLoading: false,
        notifications: responseJson.notifications,
      });     
      
      this.getTarget(responseJson.notifications);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  getTarget = async (notifications) => {
    var tmpOld = [];
    var tmpNew = [];

    var savedData = await this.getSavedNotficationData();

    notifications.forEach(item => {
      const tmpNotification = item.notification;
      if (savedData){
        if(savedData.includes(tmpNotification.notificationId)) {
          tmpOld.push(item)
        } else {
          tmpNew.push(item)
        }        
      } else {
        tmpNew.push(item)
      }
    });

    this.setState({
      oldNotificaitons: tmpOld,
      newNotifications: tmpNew,      
    })
  }

  getSavedNotficationData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('read_notification')
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
      console.log('Reading Error');
    }
  }

  storeNotficationData = async (value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem('read_notification', jsonValue)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  storeNotficationFlag = async (value) => {
    try {
      await AsyncStorage.setItem('new_alert', value)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  acceptAssignedRow = (item) => {
    this.setState({
      selectedItem: item,
      isLoading: true,
    })
    
    const requestID = item.request.requestid;
    const userID = firebase.auth().currentUser.uid;
    const senderID = item.request.senderId;
    const notificationID = item.notification.notificationId;    
    const isSchedule = item.request.isSchedule

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/acceptAssignedSupport', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestid: requestID,
        senderid: senderID,
        receiverid: userID,
        notificationid: notificationID,
        isschedule: isSchedule
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {   
        this.setState({
          isLoading: false,
        });     
        return
      } 

      this.goJoinNext()          
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });   
  }

  declineAssignedRow = (item) => {
    this.setState({ 
      modalVisible: true,
      selectedItem: item,
      declineAssign: 'first'
     });    
  }

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  onDeclineAssigned = () => {
    this.setState({
      isLoading: true,
      modalVisible: false
    })
    
    const requestID = this.state.selectedItem.request.requestid;
    const notificationID = this.state.selectedItem.notification.notificationId;
    const userID = firebase.auth().currentUser.uid;
    const reason = this.state.selectedContent;    
    const adminID = this.state.selectedItem.notification.sender;    

    var uri = '' 
    if (this.state.declineAssign == 'first') {
      uri = 'https://us-central1-melisa-app-81da5.cloudfunctions.net/declineAssignedSupport'
    } else {
      uri = 'https://us-central1-melisa-app-81da5.cloudfunctions.net/declineAssignedColleague'
    }
  
    fetch(uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestid: requestID,
        notificationid: notificationID,
        reason: reason,
        receiverid: userID,   
        adminid: adminID,         
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        selectedContent: ''
      }) 

      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        return;
      } else {
        this.getNotifications()
      }       
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  // Control Accept Colleague Request and Decline
  acceptColleagueRow = (item) => {    

    this.setState({
      selectedItem: item,
      isLoading: true
    }) 
    
    const notificationID = item.notification.notificationId
    const requestID = item.request.requestid;
    const senderID = item.request.senderId;
    const receiverID = item.request.receiverId;
    const userID = firebase.auth().currentUser.uid;
    const type = item.notification.type

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/acceptColleagueRequest', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestid: requestID,
        notificationid: notificationID,
        senderid: senderID,
        receiverid: receiverID,
        secondReceiverid: userID,
        type: type,
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
      this.goJoinNext()
    })
    .catch((err) => {       
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  goJoinNext = async() => {   
    if (this.state.selectedItem.request.type === 'Chat'){
      setTimeout(() => {
        this.joinHandler()         
      }, 300); 
    } else {
      this.setState({
        isLoading: false,
      });
    }  
  }

  joinHandler = () => {   
    const { joingDialog,  navigation, selected } = this.props

    new Promise((resolve, reject) => {
      joingDialog({ dialogId: this.state.selectedItem.request.dialog.id, resolve, reject })
    })
    .then(action => {
      this.setState({
        isLoading: false,
      })
      // const dialog = this.state.selectedItem.request.dialog
      const dialog = action.payload

      global.curUser = this.state.curUser
      global.selectedRequest = this.state.selectedItem.request
      navigation.navigate('Messages', {dialog})
    })
    .catch(action => {
      this.setState({
        isLoading: false,
      })
      // showError('Failed to join dialog', action.error)
    })
  }

  declineColleagueRow = async(item) => {
    const notificationID = item.notification.notificationId
    const requestID = item.request.requestid;
    const senderID = item.request.senderId;
    const receiverID = item.request.receiverId;
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/declineColleagueRequest', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestid: requestID,
        notificationid: notificationID,
        senderid: senderID,
        receiverid: receiverID,
        secondReceiverid: userID,
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

      this.getNotifications()
    })
    .catch((err) => {      
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });  
  }

  // Decline assigned Colleague request
  declineAssignedColleagueRow = (item) => {
    this.setState({ 
      modalVisible: true,
      selectedItem: item,
      declineAssign: 'second'
     });    
  }

  // Delete Notifications
  select = async() => {
    const tmpSelect = !this.state.isSelect
    this.setState({
      isSelect: tmpSelect,
      arySelected: [],
      isSelectAll: false
    })
  }

  selectAll = async() => {
    const tmpSelectAll = !this.state.isSelectAll
    var arraySelected = []

    if (tmpSelectAll){
      this.state.notifications.forEach((item) => {
        const notificationId = item.notification.notificationId
        arraySelected.push(notificationId)
      })
    } else {
      arraySelected = []
    }

    this.setState({
      isSelectAll: tmpSelectAll,
      arySelected: arraySelected
    })
  }

  selectedNotification = async(notificationID) => {
    var arraySelected = this.state.arySelected
    if (arraySelected.includes(notificationID)) {
      const index = arraySelected.indexOf(notificationID)
      arraySelected.splice(index, 1);
    } else {
      arraySelected.push(notificationID)
    }
    
    this.setState({arySelected: arraySelected})
  }

  deleteConfirm = async() => {
    const iCount = this.state.arySelected.length
    if (iCount > 0) {
      const title = iCount == 1 ? 'Delete 1 Notification' : 'Delete ' + String(iCount) + ' Notifications' 
      Alert.alert(
        title,
        `You can not redrive the notification once deleted.`,
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "Delete",
            onPress: () => {
              this.setState({
                isLoading: true
              })

              this.deleteNotifications()              
            },
          },
          
        ],
        { cancelable: false }
      );
    } else {      
      Alert.alert(
        'Warnning',
        `Please select notification to delete.`,
        [
          {
            text: "Ok",
            onPress: () => {
            },
          },
        ],
        { cancelable: false }
      );
    }    
  }

  deleteNotifications = async() => {
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/deleteNotifications', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        notifications: this.state.arySelected,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
          isSelect: false
        });
        return;
      }

      this.setState({
        isLoading: false,
        isSelect: false
      });

      this.getNotifications()
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
        isSelect: false
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });    
  }

  render() {
    const curuserID = firebase.auth().currentUser.uid;
    var NotificationData = [];
    if (this.state.newNotifications.length > 0 ) {
      NotificationData.push({
        title: "New",
        data: this.state.newNotifications,
      })
    }

    if (this.state.oldNotificaitons.length > 0 ) {
      NotificationData.push({
        title: "Earlier",
        data: this.state.oldNotificaitons,
      })
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
                <Text style={styles.editPText}>{this.state.declineAssign == 'first' ? "Declining Request" : "Declining Request as a colleague" }</Text>
                <View style={{flex: 1}}/>
                <TouchableOpacity onPress={() => this.onEdit(false)} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={styles.firstNameText}>Request from</Text>
              {this.state.selectedItem ? <View style = {{...styles.vItem, marginLeft: 12, marginTop: 0, backgroundColor: this.state.selectedItem.request.isSchedule ?  '#CF3E6F33' : (this.state.selectedItem.request.type === 'Video') ? '#00ACEC33' : (this.state.selectedItem.request.type === 'Call') ? '#2BCC7133' :  '#EF8F3533' }}>
                <View style={styles.vImageView}>
                  <Image source={ this.state.selectedItem.request.isSchedule ? require('../assets/images/home/iconSchedule.png') : this.state.selectedItem.request.type=== 'Video' ? require('../assets/images/home/iconVideo.png') : this.state.selectedItem.request.type=== 'Call' ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png') } style={styles.vImage} />
                </View>                        
                <Text style={styles.vText}>{this.state.selectedItem.request.sender.firstname + " " + this.state.selectedItem.request.sender.lastname}</Text>
                <View style={{flex: 1}} />
              </View> : <View/>}

              <Text style={styles.lastNameText}>Assigned By</Text>
              {this.state.selectedItem ? <View style = {{...styles.vItem, marginLeft: 12, height: 70, marginTop: 0, backgroundColor: theme.colors.inputBar}}>
                <View style={{...styles.vImageView, width: 52, height: 52}}>
                {
                  ( this.state.selectedItem.sender.image) ? <Image source={{uri : this.state.selectedItem.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                }
                </View>                        
                <Text style={styles.vText}>{this.state.selectedItem.sender ? this.state.selectedItem.sender.firstname + " " + this.state.selectedItem.sender.lastname : ""}</Text>
                <View style={{flex: 1}} />
              </View> : <View/>}

              <Text style={styles.lastNameText}>Message</Text>

              <TextInput
                style={styles.emailInput}
                blurOnSubmit={true}
                placeholder="Add a reason"
                multiline={true}
                value={this.state.selectedContent}
                onChangeText={(text) => this.setState({selectedContent: text}) }
                autoCapitalize="none"
                autoCompleteType="name"
                textContentType="name"
              /> 

              <TouchableOpacity style={styles.loginButton} onPress={() => this.onDeclineAssigned()}>
                <Text style={styles.loginText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>


        <View style = {styles.navigationView}>
          {this.state.isSelect ? 
            <TouchableOpacity onPress={this.deleteConfirm} style={styles.deletecontainer}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity> 
            : <View/>
          } 
          <PageTitle>Notifications</PageTitle>

          <TouchableOpacity onPress={this.select} style={styles.selectContainer}>
            <Text style={styles.selectText}>{this.state.isSelect ? 'Done' : 'Select'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listView}>
          { this.state.isSelect && this.state.notifications.length > 0 &&
            <View style={styles.selectAllView}>
              <TouchableOpacity onPress={this.selectAll} style={styles.selectAllContainer}>
                <Text style={styles.selectAllText}>{this.state.isSelectAll ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>
          }

          <SectionList
            sections={NotificationData}
            keyExtractor={(item, index) => item + index}
            renderSectionHeader={({ section: { title } }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.sectionText}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => 
                <View style={styles.cellView}>
                  { this.state.isSelect? 
                    <TouchableOpacity onPress={() => this.selectedNotification(item.notification.notificationId)} style={styles.optionView} >
                        { this.state.arySelected.includes(item.notification.notificationId) ? 
                            (<Image source={require('../assets/images/home/icon_option.png')} style={styles.optionImage}/>)
                            : (<View style={styles.iconView} />)
                        }                    
                    </TouchableOpacity> : <View/>
                  }

                  {(item.notification.type == 'assign' || item.notification.type == 'assignDeclined' || item.notification.type == 'assignAccepted') ?

                    <View style={styles.cellContentView}>
                      <View style = { styles.imageView}>                    
                        {item.sender.image ? <Image source={{uri : item.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />}
                        <GetTypeIcon type={item.notification.type} />          
                      </View>

                      <View style={styles.contentView}>
                        <Text style={styles.nameText}>{item.notification.message}</Text>

                        <View style = {{...styles.vItem,    
                        backgroundColor: item.request.isSchedule ? '#CF3E6F33' : item.request.type === 'Video' ? '#00ACEC33' : item.request.type === 'Call' ? '#2BCC7133' : '#EF8F3533' }}>
                          <View style={styles.vImageView}>
                            <Image source={ item.request.isSchedule ? require('../assets/images/home/iconSchedule.png') : item.request.type === 'Video' ? require('../assets/images/home/iconVideo.png') : (item.request.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png') } style={styles.vImage} />
                          </View>    

                          <Text style={styles.vText}>{item.request.sender.firstname + " " + item.request.sender.firstname}</Text>
                          <View style={{flex: 1}} />
                          <Image source={require('../assets/images/home/ChevronForward.png')} style={styles.forwardImage} />
                        </View>

                        <Text style={{...styles.timeText, marginTop: 8}}>{getTimeagao(item.notification.time)}</Text>

                        { ((item.notification.type == 'assign') && (item.request.receiverId === curuserID)) ?
                          <View style={{flexDirection: 'row', marginBottom: 12, marginRight: 12}}>
                            <TouchableOpacity onPress={() => this.acceptAssignedRow(item)} style={{...styles.cellButton, backgroundColor: '#2BCC71'}}>
                              <Text style= {styles.acceptText}>Accept</Text>                            
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => this.declineAssignedRow(item)} style={{...styles.cellButton, backgroundColor: '#8D8D91', marginLeft: 12}}>
                              <Text style= {styles.acceptText}>Decline</Text>
                            </TouchableOpacity>
                          </View> : <View/>                      
                        }                               
                      </View>
                    </View>
                  : item.notification.type == 'colleague' ?
                    <View style={styles.cellContentView}>
                      <View style = { styles.imageView}>                    
                        {
                          (item.sender.image) ? <Image source={{uri : item.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                        }
                        <GetTypeIcon type={item.notification.type} />          
                      </View>

                      <View style={styles.contentView}>
                        <Text style={styles.nameText}>{item.notification.message}</Text>
                        <View style={{flex: 1,}}></View>
                        <Text style={styles.timeText}>{getTimeagao(item.notification.time)}</Text>     
                        {item.request.status == 'requestedColleague' ? <View style={{flexDirection: 'row', marginBottom: 12, marginRight: 12}}>
                          <TouchableOpacity onPress={() => this.acceptColleagueRow(item)} style={{...styles.cellButton, backgroundColor: '#2BCC71'}}>
                            <Text style= {styles.acceptText}>Accept</Text>                            
                          </TouchableOpacity>

                          <TouchableOpacity onPress={() => this.declineColleagueRow(item)} style={{...styles.cellButton, backgroundColor: '#8D8D91', marginLeft: 12}}>
                            <Text style= {styles.acceptText}>Decline</Text>
                          </TouchableOpacity>
                        </View> : <View/>}                          
                      </View>
                    </View>
                  : (item.notification.type == 'assignColleague' || item.notification.type == 'acceptedAssignColleague' || item.notification.type == 'declinedAssignColleague') ?  

                    <View style={styles.cellContentView}>
                      <View style = { styles.imageView}>                    
                        {
                          (item.sender.image) ? <Image source={{uri : item.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                        }
                        <GetTypeIcon type={item.notification.type} />          
                      </View>

                      <View style={styles.contentView}>
                        <Text style={styles.nameText}>{item.notification.message}</Text>

                        <View style = {{...styles.vItem,    
                        backgroundColor: (item.request.type === 'Video') ? '#00ACEC33' : (item.request.type === 'Call') ? '#2BCC7133' : (item.request.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'}}>
                          <View style={styles.vImageView}>
                            <Image source={ (item.request.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (item.request.type === 'Call') ? require('../assets/images/home/iconVoice.png') : (item.request.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                          </View>                        
                          <Text style={styles.vText}>{item.request.sender.firstname + " " + item.request.sender.firstname}</Text>
                          <View style={{flex: 1}} />
                          <Image source={require('../assets/images/home/ChevronForward.png')} style={styles.forwardImage} />
                        </View>

                        <Text style={styles.timeText}>{getTimeagao(item.notification.time)}</Text>     

                        {(item.notification.type == 'assignColleague') ? <View style={{flexDirection: 'row', marginBottom: 12, marginRight: 12}}>
                          <TouchableOpacity onPress={() => this.acceptColleagueRow(item)} style={{...styles.cellButton, backgroundColor: '#2BCC71'}}>
                            <Text style= {styles.acceptText}>Accept</Text>                            
                          </TouchableOpacity>

                          <TouchableOpacity onPress={() => this.declineAssignedColleagueRow(item)} style={{...styles.cellButton, backgroundColor: '#8D8D91', marginLeft: 12}}>
                            <Text style= {styles.acceptText}>Decline</Text>
                          </TouchableOpacity>
                        </View> : <View/>}                          
                      </View>
                    </View>
                  : <View style={styles.cellContentView}>
                      <View style = { styles.imageView}>                    
                        {
                          (item.sender.image) ? <Image source={{uri : item.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                        }
                        <GetTypeIcon type={item.notification.type} />          
                      </View>

                      <View style={styles.contentView}>
                        <Text style={styles.nameText}>{item.notification.message}</Text>
                        <View style={{flex: 1,}}></View>
                        <Text style={styles.timeText}>{getTimeagao(item.notification.time)}</Text>  
                                                      
                      </View>
                    </View>
                  }                  
                </View>                          
            }            
          /> 
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
  },

  deletecontainer: {
    width: 80,
    height: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,  
  },

  selectContainer: {
    width: 80,
    height: 50,
    position: 'absolute',
    bottom: 0,
    right: 16,  
  },

  listView: {
    flex: 1,
    marginTop: 8,    
  },

  selectAllView: {
    width: DEVICE_WIDTH,
    height: 32,
  },

  selectAllContainer: {
    width: 120,
    height: 32,
  },

  selectAllText: {  
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.primary, 
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 24,
    backgroundColor: 'white',
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 6,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cellContentView: {
    marginLeft: 12,
    width: DEVICE_WIDTH - 24,
    marginVertical: 8,
    minHeight: 86,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  imageView: {
    width: 52,
    height: 72,
    marginLeft: 12,
    marginTop:13,    

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    marginTop: 0,
    width: 52,
    height: 52,

    
    borderRadius: 26,
    borderColor: '#fff',
    borderWidth: 2,
  },

  iconImage: {
    width: 24,
    height: 24,
    position: 'absolute',
    right: 0,
    bottom: 18,
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginTop: 14,
    justifyContent: 'flex-start',
  },

  nameText: {
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  timeText: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader, 
  },

  vItem: {
    height: 52,
    marginTop: 8,  
    marginRight: 12,                    
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vImageView: {
    marginLeft: 17,
    width: 28,
    height: 28,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  vImage: {
    width: 28,
    height: 28,
  },

  vText: {
    marginLeft: 12,
    fontSize: 18,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  forwardImage: {
    width: 8,
    height: 14,    
    marginRight: 16,
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  cellButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  acceptText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: 'white', 
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
    backgroundColor: theme.colors.inputBar,
    paddingBottom: 16,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
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
    marginTop: 24,
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: DEVICE_WIDTH - 24,
    marginLeft: 0,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
},

  lastNameText: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 24,
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

  deleteText: {
    marginTop: 19, 
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.redColor, 
  },

  selectText: {
    marginTop: 19,   
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.darkBlue, 
  },

  optionView: {
    width: 40,   
    height: 50,
    paddingLeft: 16,     
    alignItems: 'center',
    flexDirection: 'row',
  },

  optionImage:{
    width: 22,
    height: 22,
  },

  iconView: {
    width: 22,
    height: 22,
    borderColor: theme.colors.darkBlue,
    borderWidth: 1.5,
    borderRadius: 11,
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

export default connect(mapStateToProps, mapDispatchToProps)(NotificationScreen)