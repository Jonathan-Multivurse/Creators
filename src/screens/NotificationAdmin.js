import React, { Component } from 'react'
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Text, SectionList,
  ActivityIndicator, KeyboardAvoidingView, Alert, Modal, TextInput} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'
import FACILITY_DB from '../api/facilityDB'

const DEVICE_WIDTH = Dimensions.get('window').width

GetTypeIcon_Admin = ({type}) => {
  var activeurl = ''

  if (type == 'submitting') {
    activeurl = require('../assets/images/notification/iconNSubmitting.png')
  } else if (type == 'submitted' || type == 'assign') {
    activeurl = require('../assets/images/notification/iconNSubmitted.png')
  } else if (type == 'accepted' || type == 'repAccepted' ) {
    activeurl = require('../assets/images/notification/iconNAccepted.png')
  } else if (type == 'end' || type == 'endedCall'){
    activeurl = require('../assets/images/notification/iconNEnd.png')
  } else if (type == 'message' || type == 'endedChat'){
    activeurl = require('../assets/images/notification/iconNMessage.png')
  } else if (type == 'reminder'){
    activeurl = require('../assets/images/notification/iconNReminder.png')
  } else if (type == 'availability'){
    activeurl = require('../assets/images/notification/iconNStatus.png')
  } else if (type == 'cancelled' || type == 'repDeclined'){
    activeurl = require('../assets/images/notification/iconNCancel.png')
  }  else if (type == 'assignDeclined'){
    activeurl = require('../assets/images/notification/iconNCancel.png')
  } else if ( (type == 'received') || type == 'repPending' ) {
    activeurl = require('../assets/images/notification/iconNReceived.png')
  } else if ( type == 'askingAdmin' ) {
    activeurl = require('../assets/images/notification/iconNReceived.png') 
  } else if ( type == 'survey') {
    activeurl = require('../assets/images/notification/iconNSurvey.png')
  } else if (type == 'assignColleague') {
    activeurl = require('../assets/images/notification/iconNSubmitted.png')
  } else {
    activeurl = require('../assets/images/notification/iconNReceived.png') 
  }

  return (
    <Image source={activeurl} style={styles.iconImage} />
  )
}

export default class NotificaitonAdmin extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    FACILITY_DB.getFacilities(this.onGetFacilities)

    this.state = {
      isLoading: false,
      notifications: [],
      newNotifications: [],
      oldNotificaitons: [],   
            
      askingModal: false,
      selectedItem: null,

      askingModalFacility: false,
      selectedItemFacility: null,
      facilityData:[],

      isSelect: false,
      arySelected: [],
      isSelectAll: false
    };
  }

  componentDidMount() {
    this.storeNotficationFlag('false');
    
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
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

  onGetFacilities = (facilities) => {   
    this.setState({
      isLoading: false,
      facilityData: facilities
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
        if (responseJson.statusCode !== 200) {
          this.setState({
            isLoading: false,
          });
          // alert(responseJson.error);
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
      const jsonValue = await AsyncStorage.getItem('read_notification_admin')
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
      console.log('Reading Error');
    }
  }

  storeNotficationData = async (value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem('read_notification_admin', jsonValue)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  storeNotficationFlag = async (value) => {
    try {
      console.log(value)
      await AsyncStorage.setItem('new_alert', value)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  onViewMore = (item) => {
    console.log("Item ====>", item);
    if (item.notification.type == 'askingAdmin') {
      this.setState({
        selectedItem: item
      });
      this.onViewModal(true);
    }    
  }

  onViewModal = (visible) => {
    this.setState({ askingModal: visible});
  }

  onSelectRep = () => {
    this.onViewModal(false)
    this.props.navigation.navigate('AssignSupport', {
      request: this.state.selectedItem.request,
      isFromHomePage: false,
      notificationID: this.state.selectedItem.notification.notificationId
    })   
  }

  // Decline for Assign Request from Rep
  onDeclineAssign = () => {
    this.onViewModal(false)
    Alert.alert(
      'Decline Support',
      `Are you sure, you want to decline assign asking for a chat support?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
        },
        {
          text: "Yes",
          onPress: () => {
            this.setState({
              isLoading: true
            })

            this.declineAssignAsking()              
          },
        },
        
      ],
      { cancelable: false }
    );
  }

  declineAssignAsking = () => {
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/declineAssignAsking', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        notificationid: this.state.selectedItem.notification.notificationId,
        repid: this.state.selectedItem.sender.userid
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        isSelect: false
      });

      if (responseJson.statusCode !== 200) {
        // alert(responseJson.error);
        return;
      }

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

  // Allow, Decline for Access Facility-Branch Request from Customer
  onViewMoreFacility = (item) => {
    if (item.notification.type == 'askedFacility') {
      this.setState({
        selectedItemFacility: item
      });
      this.onViewModalFacility(true);
    }    
  }

  onViewModalFacility = (visible) => {
    this.setState({ askingModalFacility: visible});
  }

  onAllowFacility = (item) => {
    const userID = firebase.auth().currentUser.uid;
    const facilityData = item.sender.requestFacility[item.sender.requestFacility.length - 1]
    const facilityName = 
    this.state.facilityData.filter(element => element.facilityid === facilityData.facility)[0].title + '-' + facilityData.branch

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/allowAskingFacility', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        notificationid: item.notification.notificationId,
        customerid: item.notification.sender,
        facilityname: facilityName
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        isSelect: false,
        askingModalFacility: false
      });

      if (responseJson.statusCode !== 200) {
        // alert(responseJson.error);
        return;
      }

      this.getNotifications()
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
        isSelect: false,
        askingModalFacility: false
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onDeclineFacility = (item) => {    
    const userID = firebase.auth().currentUser.uid;
    const facilityData = item.sender.requestFacility[item.sender.requestFacility.length - 1]
    const facilityName = 
    this.state.facilityData.filter(element => element.facilityid === facilityData.facility)[0].title + '-' + facilityData.branch

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/declineAskingFacility', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        notificationid: item.notification.notificationId,
        customerid: item.notification.sender,
        facilityname: facilityName
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        isSelect: false,
        askingModalFacility: false
      });

      if (responseJson.statusCode !== 200) {
        // alert(responseJson.error);
        return;
      }

      this.getNotifications()
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
        isSelect: false,
        askingModalFacility: false
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
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
        // alert(responseJson.error);
        return;
      }

      this.setState({
        isLoading: false,
        isSelect: false,        
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
        
        {this.state.selectedItem && <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.askingModal }
          onRequestClose={() => {
            this.onViewModal(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView} >
            <View style={{flex:1}}/>
            <View style = {styles.modalView1}>

              <View style={styles.titleViewModal}>
                {/* <View style={{flex: 1}}/>
                <Text style={styles.editPText}>Request to assgin</Text> */}
                <View style={ styles.imageView}>                    
                  {
                    (this.state.selectedItem.sender.image) ? <Image source={{uri : this.state.selectedItem.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                  }      
                </View>

                <View style={styles.contentView}>
                    <Text style={{...styles.nameText, marginTop: 6}}>{this.state.selectedItem.sender.firstname + " " + this.state.selectedItem.sender.lastname }</Text>
                    <Text style={{...styles.timeText, marginTop: 3}}>Asked you to assign</Text>
                  </View>

                <View style={{flex: 1}}/>
                <TouchableOpacity style={styles.closeView} onPress={() => this.onViewModal(false)} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={{...styles.sectionText1, marginTop: 0}}>Support</Text>
              <View style={{...styles.cellSelectedContentView, backgroundColor: '#EF8F3533'}}>
                <Image source={ require('../assets/images/home/iconChat.png')} style={styles.vImage} />
                <Text style={styles.vText}>{this.state.selectedItem.request.sender.firstname + " " + this.state.selectedItem.request.sender.lastname}</Text>
              </View>   
                  
              <Text style={{...styles.sectionText1, marginTop: 12}}>Simulator</Text>
              <Text style={styles.countText}>{this.state.selectedItem.request.simulator}</Text>

              <Text style={{...styles.sectionText1, marginTop: 12}}>Description</Text>
              <Text style={styles.countText}>{this.state.selectedItem.request.description}</Text>

              <Text style={{...styles.sectionText1, marginTop: 12}}>Message from</Text>
              <Text style={styles.countText}>{this.state.selectedItem.notification.messageToAdmin}</Text>

              <TouchableOpacity style={{...styles.loginButton, marginLeft: 16, marginBottom: 0, backgroundColor: this.state.selectedItem.request.status == 'accepted' ? theme.colors.darkBlue : '#8D8D91' }} onPress={() => this.onSelectRep()}>
                <Text style={styles.loginText}>Assign</Text>
                <Image source={require('../assets/images/home/ChevronForward.png')} style={{...styles.forwardImage, marginLeft: 16, tintColor: 'white'}} />
              </TouchableOpacity>

              <TouchableOpacity style={{...styles.loginButton, marginLeft: 16, marginTop: 12, marginBottom: 45}} onPress={() => this.onDeclineAssign()}>
                <Text style={styles.loginText1}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal> }

        {this.state.selectedItemFacility && <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.askingModalFacility }
          onRequestClose={() => {
            this.onViewModalFacility(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
          <View style={styles.centeredView} >
            <View style={{flex:1}}/>
            <View style = {styles.modalView1}>

              <View style={styles.titleViewModal}>
                <View style={ styles.imageView}>                    
                  {this.state.selectedItemFacility.sender.image ? <Image source={{uri : this.state.selectedItemFacility.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />}      
                </View>

                <View style={styles.titlecontentView}>
                  <Text style={{...styles.nameText, marginTop: 6}}>{this.state.selectedItemFacility.sender.firstname + " " + this.state.selectedItemFacility.sender.lastname }</Text>
                  <Text style={{...styles.timeText, marginTop: 3}}>Requested facility access</Text>
                </View>

                <View style={{flex: 1}}/>
                <TouchableOpacity style={styles.closeView} onPress={() => this.onViewModalFacility(false)} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View>              

              <Text style={{...styles.sectionText2, marginTop: 0}}>Has access to</Text>
              <View style={{flexDirection: 'row', alignContent: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap', alignItems: 'flex-start'}}>
                {this.state.facilityData.length > 0 && this.state.selectedItemFacility.sender.facility.map((facilityData, index) =>  (
                  <View style={styles.detailView} key={index}>
                    <Text style={styles.detailText}>{this.state.facilityData.filter(element => element.facilityid === facilityData.facility)[0].title} - {facilityData.branch}</Text>
                  </View>
                  )
                )}                  
              </View>
                  
              <Text style={{...styles.sectionText2, marginTop: 12}}>Simulator</Text>
              <View style={{flexDirection: 'row', alignContent: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap'}}>
                {this.state.facilityData.length > 0 && this.state.selectedItemFacility.sender.requestFacility.map((facilityData, index) =>  (
                  <View style={styles.detailView} key={index}>
                    <Text style={styles.detailText}>{this.state.facilityData.filter(element => element.facilityid === facilityData.facility)[0].title} - {facilityData.branch}</Text>
                  </View>
                  )
                )} 
              </View>


              <Text style={{...styles.sectionText2, marginTop: 12}}>Message from {this.state.selectedItemFacility.sender.firstname + " " + this.state.selectedItemFacility.sender.lastname }</Text>
              <Text style={styles.countText}>{this.state.selectedItemFacility.notification.messageToAdmin}</Text>

              {/* <TouchableOpacity style={{...styles.loginButton, marginBottom: 0, backgroundColor: this.state.selectedItemFacility.request.status == 'accepted' ? theme.colors.darkBlue : '#8D8D91' }} onPress={() => this.onSelectRep()}>
                <Text style={styles.loginText}>Assign</Text>
                <Image source={require('../assets/images/home/ChevronForward.png')} style={{...styles.forwardImage, marginLeft: 16, tintColor: 'white'}} />
              </TouchableOpacity> */}

              <TouchableOpacity style={{...styles.loginButton, marginLeft: 24, marginTop: 36, marginBottom: 45, marginBottom: 12, backgroundColor: theme.colors.greenColor}} onPress={() => this.onAllowFacility(this.state.selectedItemFacility)}>
                <Text style={{...styles.loginText1, color:'white'}}>Allow</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{...styles.loginButton, marginLeft: 24,  marginTop: 12, marginBottom: 45}} onPress={() => this.onDeclineFacility(this.state.selectedItemFacility)}>
                <Text style={styles.loginText1}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal> }

        <View style = {styles.navigationView}>          
          <Text style={styles.pageTitle}>Notifications</Text>
          <View style={{flex: 1}} />
          {this.state.isSelect ? 
            <TouchableOpacity onPress={this.deleteConfirm} style={styles.deletecontainer}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity> 
            : <View/>
          } 

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
            renderItem={({ item }) => (
              
              <View style= {styles.cellView}>
                { this.state.isSelect? 
                  <TouchableOpacity onPress={() => this.selectedNotification(item.notification.notificationId)} style={styles.optionView} >
                    { this.state.arySelected.includes(item.notification.notificationId) ? 
                        (<Image source={require('../assets/images/home/icon_option.png')} style={styles.optionImage}/>)
                        : (<View style={styles.iconView} />)
                    }                    
                  </TouchableOpacity> : <View/>
                }

                <View style={styles.cellContentView}>
                  <View style={ styles.imageView}>                    
                    {
                      (item.sender.image) ? <Image source={{uri : item.sender.image}} style={styles.profileImage} /> : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />
                    }
                    <GetTypeIcon_Admin type={item.notification.type}/>          
                  </View>

                  <View style={styles.contentView}>
                    <Text style={styles.nameText}>{item.notification.message}</Text>
                    <View style={{flex: 1}}></View>
                    <Text style={styles.timeText}>{getTimeagao(item.notification.time)}</Text>
                    {item.notification.type == 'askingAdmin' || item.notification.type == 'askedAdmin' ? 
                      <TouchableOpacity onPress={() => this.onViewMore(item)} style={{...styles.viewMore, backgroundColor: item.notification.type == 'askingAdmin' ? theme.colors.lightYellow : '#2BCC71' }}>
                        <Text style={styles.moreText}>View More</Text>
                      </TouchableOpacity> : <View/>  
                    }     

                    {item.notification.type == 'declinedAsking' ? 
                      <Text style={styles.declineText}>You declined {item.sender.firstname + " " + item.sender.lastname}</Text> : <View/>  
                    }     

                    {item.notification.type == 'askedFacility' ? 
                      <View style={{flexDirection: 'row', marginRight: 24}}>
                        <TouchableOpacity onPress={() => this.onAllowFacility(item)} style={{...styles.viewMore, backgroundColor: '#2BCC71' }}>
                          <Text style={styles.moreText}>Allow</Text>
                        </TouchableOpacity> 
                        <View style={{flex: 1}}/>
                        <TouchableOpacity onPress={() => this.onViewMoreFacility(item)} style={{...styles.viewMore, backgroundColor: theme.colors.lightGray }}>
                          <Text style={styles.moreText}>View More</Text>
                        </TouchableOpacity> 
                      </View>
                      : <View/>  
                    }      

                    {item.notification.type == 'allowedFacility' ? 
                      <Text style={styles.declineText}>Access allowed</Text> : <View/>  
                    }  

                    {item.notification.type == 'declinedFacility' ? 
                      <Text style={styles.declineText}>Access declined</Text> : <View/>  
                    }

                  </View>
                </View>
              </View>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.sectionText}>{title}</Text>
              </View>
            )}
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
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Medium',        
  },

  deletecontainer: {
    width: 70,
    height: 50,
    marginRight: 16, 
  },

  selectContainer: {
    width: 60,
    height: 50,
    marginRight: 16,  
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
    width: 52,
    height: 52,
    marginTop: 0,
    
    borderRadius: 26,
    borderColor: '#fff',
    borderWidth: 2,
  },

  iconImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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

  titlecontentView: {
    marginLeft: 12,
    marginTop: 14,
    justifyContent: 'flex-start',
  },

  detailView: {
    height: 28,
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 12, 
    paddingRight: 12, 
    borderRadius: 14,
    alignItems: 'center', 
    backgroundColor: theme.colors.inputBar
  },

  detailText: {
    marginTop: 4,
    fontSize: 15, 
    lineHeight: 22, 
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',     
  },

  nameText: {
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  timeText: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader, 
  },

  viewMore: {
    width: DEVICE_WIDTH/3,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  moreText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: 'white', 
  },

  declineText: {
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular'
  },


  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView1: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "flex-start",   
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

  titleViewModal : {    
    marginTop: 24,
    flexDirection: 'row',    
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  closeView: {
     position: 'absolute',
     right: 10,
     top: 10,
     height: 50,
     width: 50,
  },

  coloseImage: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 44,
    height: 44,
  },

  sectionText1: {
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  sectionText2: {
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  cellSelectedContentView: {
    height: 55,
    width: DEVICE_WIDTH - 32, 
    marginTop: 7, 
    marginLeft: 16, 
    marginRight: 16,                     
    borderRadius: 14,           
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
  },

  emailInput: {
    width: DEVICE_WIDTH - 24,    
    height: 90,
    marginLeft: 0,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  countText:{
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    paddingTop: 6,
    fontSize: 16,
    lineHeight: 21,
    textAlign: 'left',
    fontFamily: 'Poppins-Regular',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 24,
    marginBottom: 57,
    borderRadius: 28.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',

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

  loginText1: {
    fontSize: 18,
    lineHeight: 25,
    color: 'red',
    fontFamily: 'Poppins-Medium',
  },

  vText: {
    marginLeft: 12,
    fontSize: 18,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  vImage: {
    marginLeft: 16,
    width: 31,
    height: 31,
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