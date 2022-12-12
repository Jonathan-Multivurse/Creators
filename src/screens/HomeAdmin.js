import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, TouchableOpacity, Text, FlatList, TouchableWithoutFeedback, ScrollView, ActivityIndicator, Modal, SectionList, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import RatingView from '../components/RatingView'
import { theme } from '../core/theme'
import { Modalize } from 'react-native-modalize';
import { Host, Portal } from 'react-native-portalize';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {Calendar, WeekCalendar} from 'react-native-calendars'
import moment from 'moment'
import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

import SmartScroll from '../components/SmartScroll'
import TimeCol from '../components/TimeCol'
import DrawnGrid from '../components/DrawnGrid'
import NowBar from '../components/NowBar'
import ApptView from '../components/ApptView'
import todayData from '../services/todayData'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height
const hour_size = DEVICE_HEIGHT/12

getUserRating = (repRatings) => {
  var userRating = 0  
  if (repRatings.length > 0) {
    let sum = 0
    for(let i = 0; i < repRatings.length; i++){
      let tmp = repRatings[i]
      sum += tmp.star
    }
    
    userRating = (sum/repRatings.length).toFixed(1)
  }      
  return userRating
}

export default class HomeAdmin extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;
    this._observer = null;

    var markedDays = {}
    let defaultDate = moment().format('yyyy-MM-DD')
    markedDays[defaultDate] = {selected: true, marked: true, selectedColor: theme.colors.primary}

    this.state = {
      isLoading: false,
      isWeek: true,

      selectedDate: new Date(),  
      markedDays: markedDays,
      
      scheduledRequests : [],
      unscheduledRequests : [],
      targetRequests: [],  
      
      modalVisible: false,
      selectedItem: null,

      selectedRep: null,
      selectedIndex: 0,
      selectedNotifications: [],
      weeklyAvailable:[],
      selectedTodayRequests: [],
      selectedRating: [],
    };   
  }

  modalize = React.createRef();

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getRequests();
    });

    this._observer = firestore().collection('request')
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getRequests();
      }      
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observer();
  }

  onDaySelected = (date) => {
    console.log(date);

    const year = date.year
    const month = date.month - 1
    const day = date.day

    let tmpdate = new Date(year, month, day, 0, 0)
    this.setState({ selectedDate: tmpdate });
    this.getTarget(tmpdate);
  }

  getRequests = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getAdminRequests', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userID,
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

      this.setState({
        isLoading: false,
        scheduledRequests: responseJson.scheduled,
        unscheduledRequests: responseJson.unscheduled,
      });     
      
      this.getTarget(this.state.selectedDate);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
    });
  }

  getTarget = (selecteddate) => {
    var tmpDays = []
    var tmpDates = []
    var tmpRequests = []

    this.state.scheduledRequests.forEach(request => {
      const date = new Date(request.scheduleTime)

      const targetDate = selecteddate
      if(date.getDate() === targetDate.getDate() && date.getMonth() === targetDate.getMonth()){
        tmpRequests.push(request)
      }

      if(!tmpDays.includes(date.getDate())){
        tmpDays.push(date.getDate());
        tmpDates.push(date);
      }
    });

    var markedDays = this.state.markedDays

    for (let i=0; i<tmpDates.length; i++) {
      let date = tmpDates[i];

      let key = moment(date).format('YYYY-MM-DD')
      if (key === moment().format('YYYY-MM-DD')){
        markedDays[key] = {selected: true, marked: true, selectedColor: theme.colors.primary, selectedTextColor: 'white'}
      } else{
        markedDays[key] = {marked: true, selectedColor: theme.colors.primary}
      }
    }

    this.setState({
      targetRequests: tmpRequests,
      markedDays: markedDays,
    })
  }

  onDownButton = () => {
    if (this.state.isWeek) {
      this.setState({
        isWeek: false,
      })
    } else {
      this.setState({
        isWeek: true,
      })
    }  
  }

  onScheduleRequestsAll = () => {
    if(this.state.scheduledRequests.length > 0){
      this.props.navigation.navigate('ScheduleRequestsAdmin', {
        requests: this.state.scheduledRequests
      })
    }    
  }

  onAssginRequest = () => {
    this.setState({
      modalVisible: false,
    })

    this.props.navigation.navigate('AssignSupport', {
      request: this.state.selectedItem,      
      isFromHomePage: true
    }) 
  }

  onSelectScheduleRow = (item) => {
    this.props.navigation.navigate('ScheduleSupportAdmin', {
      request: item,
    })
  }

  selectRow = (item) => {
    this.setState({selectedItem: item, modalVisible: true})
  }

  onConfirm = (visible) => {
    this.setState({ modalVisible: visible }); 
  }

  // Rep Profile

  openModalize = (rep) => {
    this.setState({
      selectedRep: rep
    })
    this.getFullProfile(rep.userid)

    setTimeout( () => {
      this.modalize.current?.open();
    }, 600)      
  }

  closeModalize = () => {
    if (this.modalize.current) {
      this.modalize.current.close();
    }
  }

  goViewProfile = () => {
    this.modalize.current?.close();
    this.props.navigation.navigate('ManageComProfile', {
      rep: this.state.selectedRep
    });
  }

  renderHeader = () => (
    <View style={styles.modalHeaderView}>
      <TouchableOpacity style={styles.modalCloseButton} onPress={this.closeModalize}>
        <Text style={styles.modalcloseText}>Close</Text>    
      </TouchableOpacity> 
      <View style={{flex: 1}}/>
      <TouchableOpacity style={styles.modalCloseButton} onPress={this.goViewProfile} >
        <Text style={styles.modalviewFullText}>View Profile</Text>    
      </TouchableOpacity>  
    </View>
  )

  getFullProfile = (userID) => {
    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getRepProfile', {
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
        selectedRep: responseJson.rep,
        selectedRating: responseJson.ratings
      });   
      
      this.onUserGet(responseJson.rep);      
      this.getTargetNotification(responseJson.notifications);
      this.getScheduleTarget(responseJson.scheduled, responseJson.unavailable);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onUserGet = (user) => {
    var tmpAvailable = []
    if (user.weeklyAvailable){
      tmpAvailable = user.weeklyAvailable
    } else {
      tmpAvailable.push({
        'days': 0,
        'from': 9,
        'to': 19,
      })
    }

    this.setState({  
      weeklyAvailable: tmpAvailable,      
    })
  } 

  getTargetNotification = async (notifications) => {    
    var tmpNotifications = [];
    const aryTyypes = ['received', 'assignAccepted', 'repAccepted', 'assign', 'cancelled', 'livereceived'];

    notifications.forEach(item => {
      if (!aryTyypes.includes(item.notification.type)) {
        var tmpItem = item
        var tmpNotification = item.notification
        var tmpMessage = tmpNotification.message
        var targetMessage = ''
        
        if ( tmpMessage.indexOf(' gave you the ratings.') != -1 ) {
          targetMessage = 'Received the rating & review from ' + tmpMessage.replace(' gave you the ratings.', '.')          
        } else if ( tmpMessage.indexOf(' ended the support session.') != -1 ) {
          targetMessage = 'Successfully ended ' + tmpMessage.replace(' ended the support session.',  "'s  support session.")          
        } else if ( tmpMessage.indexOf("'s support request.") != -1 ) {
          targetMessage = tmpMessage.replace("You accepted ",  "Accepeted ")          
        } else if ( tmpMessage.indexOf("You scheduled ") != -1 ) {
          targetMessage = tmpMessage.replace("You scheduled ",  "Scheduled ")          
        } else {
          targetMessage = tmpMessage
        }

        tmpNotification.message = targetMessage
        tmpItem.notification = tmpNotification
        tmpNotifications.push(tmpItem)
      }      
    });

    this.setState({
      selectedNotifications: tmpNotifications,    
    })
  }

  getScheduleTarget = (scheduledRequests, arrayUnavailable) => {
    var tmpRequests = []

    scheduledRequests.forEach(request => {
      const startTime = new Date(request.scheduleTime)
      const endTime = new Date(request.scheduleTime + 900*1000)

      tmpRequests.push({
        title: request.type,
        start: startTime,
        end: endTime,
      })
    });

    arrayUnavailable.forEach(item => {
      const startTime = new Date(item.startTime)
      const endTime = new Date(item.startTime + 1800*1000)

      tmpRequests.push({
        title: item.title,
        start: startTime,
        end: endTime,
      })
    });

    this.setState({
      selectedTodayRequests: tmpRequests,
    })
  }

  render() {
    let selected = moment(this.state.selectedDate).format('yyyy-MM-DD')

    // Timeline Data
    var targetDates = []
    var targetTimelines = []

    const today = moment().format('DD MMM yyyy')

    this.state.selectedNotifications.forEach(notification => {
      const tmpDate = new Date(notification.notification.time)
      const key = moment(tmpDate).format('DD MMM yyyy')

      const dateString = (key == today) ? 'Today' : key

      if (targetDates.includes(dateString)) {
        const tmpIndex = targetDates.indexOf(dateString)
        var aryTemp = targetTimelines[tmpIndex].data
        aryTemp.push(notification)

        targetTimelines.splice(tmpIndex, 1);
        targetTimelines.splice(tmpIndex, 0, {title: dateString, data: aryTemp})
      } else {
        targetDates.push(dateString)
        var subRequests = []
        subRequests.push(notification)
        targetTimelines.push({title: dateString, data: subRequests})
      }
    })

    // Availability Data
    let startHour = this.state.weeklyAvailable.length === 0 ? 0 : this.state.weeklyAvailable[0].from 
    let endHour = this.state.weeklyAvailable.length === 0 ? 24 : this.state.weeklyAvailable[0].to === 0 ? 24 : this.state.weeklyAvailable[0].to > this.state.weeklyAvailable[0].from ? this.state.weeklyAvailable[0].to : this.state.weeklyAvailable[0].from + 1

    // Ratings Data
    const repRatings = this.state.selectedRating;  
    var repRatingsData = [];
    var todayRatingData = [];
    var earlierData = [];

    if (repRatings) {
      for(let i = 0; i < repRatings.length; i++){
        let tmp = repRatings[i]
        const diff = new Date().getTime() - tmp.time;
        if (diff < 24 * 3600) {
          todayRatingData.push(tmp)
        } else {
          earlierData.push(tmp)
        }        
      }

      if (todayRatingData.length > 0 ) {
        repRatingsData.push({
          title: "Today",
          data: todayRatingData,
        })
      }

      if (earlierData.length > 0 ) {
        repRatingsData.push({
          title: "Earlier",
          data: earlierData,
        })
      }
    }

    return (
      <Background>
        {this.state.selectedItem && ( <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
              this.onConfirm(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style = {styles.modalView}>

              <View style={styles.titleView}>
                <Text style={styles.editPText}>Support Details</Text>
                <TouchableOpacity style={styles.closeView} onPress={() => this.onConfirm(false)} >
                  <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                </TouchableOpacity>
              </View> 

              <Text style={{...styles.selectText, marginTop: 18}}>Support</Text>

              { this.state.selectedItem.isSchedule ? 
                <View style = {{...styles.vItem,  backgroundColor: '#F5D8E2', marginTop: 16, }}>
                  <View style={styles.vImageView}>
                    <Image source={require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                  </View>                        
                  <Text style={styles.vText}>{this.state.selectedItem.sender.firstname + " " + this.state.selectedItem.sender.lastname}</Text>
                  <View style={{flex: 1}} />
                </View> 
               : <View/> 
              }

              { this.state.selectedItem.isSchedule ?
                <View style={{...styles.cellSelectedContentView, alignSelf: 'flex-start', marginLeft: 16,}}>
                  <Image style={styles.callImage} source={ this.state.selectedItem.type == 'Call' ? require('../assets/images/home/iconVoice.png') : this.state.selectedItem.type == 'Video' ? require('../assets/images/home/iconVideo.png') : require('../assets/images/home/iconChat.png')}  />
                  <Text style={styles.callText}>{this.state.selectedItem.type}</Text>
                </View>
                : <View  style = {{...styles.vItem, width: DEVICE_WIDTH - 32, marginTop: 18, marginLeft: 16, marginRight: 16,  
                  backgroundColor: (this.state.selectedItem.type === 'Video') ? '#00ACEC33' : (this.state.selectedItem.type === 'Call') ? '#2BCC7133' : (this.state.selectedItem.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'}}>
                    <View style={styles.vImageView}>
                      <Image source={ (this.state.selectedItem.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (this.state.selectedItem.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (this.state.selectedItem.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                    </View>                        
                    <Text style={styles.vText}>{this.state.selectedItem.sender.firstname + " " + this.state.selectedItem.sender.lastname}</Text>
                    <View style={{flex: 1}} />                  
                </View>  
              }

              { this.state.selectedItem.isSchedule ?
                <View style={styles.confirmtimeView}>
                  <View styles={styles.cDateView}>
                    <Text style={{...styles.selectText, marginTop: 12}}>Date</Text>
                    <View style={{...styles.dateContentView, alignSelf: 'flex-start', marginLeft: 16,}}>
                      <Text style={{...styles.callText, marginLeft: 0}}>{moment(this.state.selectedItem.scheduleTime).format('MMM D, yyyy')}</Text>
                    </View>
                  </View>

                  <View styles={styles.cDateView}>
                    <Text style={{...styles.selectText, paddingLeft: 0, marginTop: 12}}>Time</Text>
                    <View style={{...styles.dateContentView, alignSelf: 'flex-start', marginLeft: 0,}}>
                      <Text style={{...styles.callText, marginLeft: 0}}>{moment(this.state.selectedItem.scheduleTime).format('h : mm  A')}</Text>
                    </View>
                  </View>
                </View> 
                : <View style={{alignSelf: 'flex-start'}}>
                    <Text style={{...styles.selectText, marginTop: 18}}>Date & Time</Text>
                    <Text style={styles.descriptionText}>{moment(this.state.selectedItem.scheduleTime).format('DD-MM-yyyy HH:MM A')}</Text> 
                  </View>
              }

              <Text style={{...styles.selectText, marginTop: 18}}>Simulator</Text>
              <Text style={styles.descriptionText}>{this.state.selectedItem.simulator}</Text> 

              <Text style={{...styles.selectText, marginTop: 18,}}>Description</Text>
              <Text style={{...styles.descriptionText,  marginBottom: 16,}}>{this.state.selectedItem.description}</Text>
             
              <TouchableOpacity style={styles.loginButton} onPress={() => this.onAssginRequest()}>
                <Text style={styles.loginText}>Assign rep</Text>
                <Image source={require('../assets/images/home/ChevronForward.png')} style={{...styles.forwardImage, marginLeft: 16, tintColor: 'white'}} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>)}

        <View style={styles.navigationView}>
          { this.state.isWeek ?
            <View>
              <Text style={styles.titleText}>{moment(this.state.selectedDate).format('MMMM yyyy')}</Text>
              <WeekCalendar        
                firstDay={0} 
                onDayPress={this.onDaySelected}
                hideExtraDays={false}
                markingType={'custom'}
                markedDates={{...this.state.markedDays, [selected]: {
                  selected: true,                
                  selectedColor: theme.colors.calendarSelected,
                  selectedTextColor: '#fff',
                  dotColor: '#fff',
                  selectedDotColor: '#fff',
                  }
                }}
                theme={{
                  backgroundColor: theme.colors.inputBar,
                  calendarBackground: "#0000",
                  textSectionTitleColor: theme.colors.lightGray,                
                  selectedDayBackgroundColor: theme.colors.calendarSelected,
                  selectedDayTextColor: '#fff',
                  todayTextColor: '#fff',
                  dayTextColor: '#000',
                  textDisabledColor: theme.colors.lightGray,
                  dotColor: theme.colors.calendarSelected,
                  selectedDotColor: '#fff',
                  arrowColor: theme.colors.lightGray,
                  monthTextColor: '#000',                                           
                  textDayFontFamily: 'Poppins-Medium',
                  textMonthFontFamily: 'Poppins-Medium',
                  textDayHeaderFontFamily: 'Poppins-Regular',
                  textDayFontWeight: '300',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 15,
                  textMonthFontSize: 22,
                  textDayHeaderFontSize: 11,
                }}
              />             
            </View>
          : <Calendar          
              onDayPress={this.onDaySelected}
              hideExtraDays={true}
              markingType={'custom'}
              markedDates={{...this.state.markedDays, [selected]: {
                selected: true,                
                selectedColor: theme.colors.calendarSelected,
                selectedTextColor: '#fff',
                dotColor: '#fff',
                selectedDotColor: '#fff',
                }
              }}
              theme={{
                selectedColor: theme.colors.calendarSelected, 
                calendarBackground: theme.colors.inputBar,
                textSectionTitleColor: theme.colors.lightGray,                
                selectedDayBackgroundColor: theme.colors.calendarSelected,
                selectedDayTextColor: '#fff',
                todayTextColor: '#fff',
                dayTextColor: '#000',
                textDisabledColor: theme.colors.lightGray,
                dotColor: theme.colors.calendarSelected,
                selectedDotColor: '#fff',
                arrowColor: theme.colors.lightGray,
                monthTextColor: '#000',                                           
                textDayFontFamily: 'Poppins-SemiBold',
                textMonthFontFamily: 'Poppins-Medium',
                textDayHeaderFontFamily: 'Poppins-Regular',
                textDayFontWeight: '300',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 15,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 11                
              }}
            />
          }

          <TouchableOpacity style = {styles.downButton} onPress={this.onDownButton}>
            <Image source={ this.state.isWeek ? require('../assets/images/home/ChevronDown.png') : require('../assets/images/home/ChevronUp.png')} style={styles.image} />
          </TouchableOpacity>
        </View>

        { this.state.targetRequests.length === 0 && this.state.unscheduledRequests.length === 0 ?    
          <View style={styles.emptycontainerView}>     
            <View style={{flex: 1}}/>
            <Text style={styles.noRequestText}>No requests now.</Text>
            <Image source={ require('../assets/images/home/empty_request.png')} style={styles.emptyImage} />
          </View>
        : <View style={styles.containerView}> 

          <View style={styles.scheduleView}>
            <View style={styles.container}>
              <Text style={styles.scheduleText}>Schedule({this.state.targetRequests.length})</Text>
              <View style={{flex: 1}} />
              { this.state.scheduledRequests.length === 0 ? 
                <View/> 
              : <TouchableOpacity style={styles.seeButton} onPress={this.onScheduleRequestsAll}>
                  <Text style={styles.seeText}>View All</Text>
                </TouchableOpacity>
              } 
            </View>

            { this.state.targetRequests.length === 0 ?
              <Text style={{...styles.scheduleText, marginTop: 16, marginBottom: 24, color: theme.colors.lightGray}}>No scheduled meetings for the day.</Text>
            : <ScrollView 
                horizontal={true}
                style={styles.horizentalContainer}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
              {this.state.targetRequests.map((item, index) => (
                <TouchableWithoutFeedback key={index} onPress={() => this.onSelectScheduleRow(item)}>
                  <View key = {index} style = {styles.hItem}>
                    <View style={{flexDirection: 'row'}}>
                      <View style={styles.hImageView}>
                        <Image source={ (item.type === 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type === 'Call') ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.hImage} />
                      </View> 
                      <View>
                        <Text style={styles.hText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                        <Text style={styles.hTime}>{moment(new Date(item.scheduleTime)).format('hh:mm A')}</Text>
                      </View>
                    </View>

                    <View style={styles.lineView} />

                    {item.status === 'scheduled' ?  
                      <View style={styles.receiverView}>
                        <View style={styles.profileImageView}>
                          <Image source={{uri : item.receiver.image}} style={styles.profileImage} />
                        </View>

                        <View>
                          <Text style={styles.acceptText}>Accepted By</Text>
                          <Text style={styles.receiverName}>{item.receiver.firstname + " " + item.receiver.lastname} </Text>
                        </View>                   
                      </View>
                    : item.status === 'assigned' ? 
                      <View style={styles.receiverView}>
                        <View style={styles.profileImageView}>
                          <Image source={{uri : item.receiver.image}} style={styles.profileImage} />
                        </View>

                        <View>
                          <Text style={styles.acceptText}>Assigned to</Text>
                          <Text style={styles.receiverName}>{item.receiver.firstname + " " + item.receiver.lastname} </Text>
                        </View>                   
                      </View>
                    : <Text style={{...styles.hTime, marginTop: 20}}>Pending</Text>}
                    
                  </View>
                </TouchableWithoutFeedback>
              ))}
              </ScrollView>
            }
          </View>

          <View style={styles.liveView}>
            <Text style={styles.liveText}>Requests ({this.state.unscheduledRequests.length})</Text>

            <View style={styles.listView}>
              <FlatList    
              showsVerticalScrollIndicator={false}            
              data={this.state.unscheduledRequests}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (
                (item.isSchedule && item.status === 'scheduled') || ( !item.isSchedule && (item.status === 'accepted' || item.status === 'addedColleague')) ? 
                ( item.isSchedule ? 
                  <View key = {index}  style = {styles.vItem1}>
                    <View style = {{...styles.vContent, backgroundColor: '#F5D8E2'}}>
                      <View style={styles.vImageView}>    
                        <Image source={ require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                      </View>
                      <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                      <View style={{flex: 1}} />
                    </View>
                    <View style={{flex: 1}} />
                    <TouchableOpacity style={styles.receiverProfileView} onPress={() => this.openModalize(item.receiver)}>
                      <Image source={{uri : item.receiver.image}} style={styles.receiverImage} />    
                    </TouchableOpacity> 
                  </View> 
                : <View key = {index}  style = {styles.vItem1}>
                  <View style = {{...styles.vContent,    
                  backgroundColor: (item.type === 'Video') ? '#00ACEC33' : (item.type === 'Call') ? '#2BCC7133' : (item.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'}}>
                    <View style={styles.vImageView}>    
                      <Image source={ (item.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (item.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                    </View>
                    <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                    <View style={{flex: 1}} />
                  </View>
                  <View style={{flex: 1}} />
                  <TouchableOpacity style={styles.receiverProfileView} onPress={() => this.openModalize(item.receiver)}>
                    <Image source={{uri : item.receiver.image}} style={styles.receiverImage} />    
                  </TouchableOpacity> 
                </View>
              )
              : item.status === "assigned" ?
                <View key = {index}  style = {styles.vItem1}>
                  <View style = {{...styles.vContent,    
                  backgroundColor: (item.type === 'Video') ? '#00ACEC33' : (item.type === 'Call') ? '#2BCC7133' : (item.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'
                  }}>
                    <View style={styles.vImageView}>    
                      <Image source={ (item.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (item.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                    </View>
                    <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                    <View style={{flex: 1}} />
                    <Image source={require('../assets/images/account/arrow_forward_g.png')} style={styles.forwardImage} />
                    {/* <Text style={styles.pendingText}>Assigned</Text> */}
                  </View>                  
                  <View style={{flex: 1}} />
                  <TouchableOpacity style={styles.receiverProfileView} onPress={() => this.openModalize(item.receiver)}>
                    <Image source={{uri : item.receiver.image}} style={styles.receiverImage} />    
                  </TouchableOpacity> 
                </View>
              : <TouchableOpacity onPress={() => this.selectRow(item)} key = {index}>
                  <View style = {{...styles.vItem,    
                    backgroundColor: (item.type === 'Video') ? '#00ACEC33' : (item.type === 'Call') ? '#2BCC7133' : (item.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'}}>
                      <View style={styles.vImageView}>
                        <Image source={ (item.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (item.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                      </View>                  
                      <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                      <View style={{flex: 1}} />
                      <Text style={styles.pendingText}>Assign</Text>
                      <Image source={require('../assets/images/account/arrow_forward_g.png')} style={styles.forwardImage} />
                  </View>   
                </TouchableOpacity>             
              )}
              />
            </View>        
          </View> 
        </View>
        }

      <Portal>
        <Modalize
          tapGestureEnabled={false}
          panGestureEnabled={false}
          disableScrollIfPossible={false}
          scrollViewProps={{ showsVerticalScrollIndicator: false }}
          modalStyle = {styles.modalStyle}
          handleStyle = {{backgroundColor: theme.colors.darkGray }} 
          overlayStyle = {{ backgroundColor: '#8A8A90'}}
          modalHeight = {DEVICE_HEIGHT * 0.9}
          HeaderComponent={this.renderHeader}
          ref={this.modalize} 
        >        
          <View style={styles.modalprofileView}>
            <View style={styles.modalprofileImageView} >
              {this.state.selectedRep && <Image style={styles.modalprofileImage} source={{uri: this.state.selectedRep.image}}/>}            
              {this.state.selectedRep && <View style={{...styles.modalstatusView, backgroundColor: this.state.selectedRep.status == 'offline' ? theme.colors.lightGray : theme.colors.greenColor }}/> }          
            </View>

            <View style={styles.modalprofileContentView} >

              {this.state.selectedRep && <Text style={styles.modalnameText}>{this.state.selectedRep.firstname + " " + this.state.selectedRep.lastname}</Text>}
              {this.state.selectedRep && <Text style={styles.modalemailText}>{this.state.selectedRep.email}</Text>}

              <View style={styles.modalratingView} >
                <RatingView star={getUserRating(this.state.selectedRating)} type={1}/>
                <Text style={styles.modalratingText}>{'(' + this.state.selectedRating.length.toString() + ')'}</Text>
              </View>

            </View>          
          </View>

          <View style={styles.modallistView}>

            <SegmentedControl
              style={styles.modalsegementContainer}
              values={[
                'Timeline',
                'Availability',
                'Ratings',
              ]}
              selectedIndex={this.state.selectedIndex}
              onChange={(event) => {
                this.setState({selectedIndex: event.nativeEvent.selectedSegmentIndex});
              }}
              fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
            />

            { this.state.selectedIndex == 0 ? 
              <SectionList
                showsVerticalScrollIndicator={false}
                style={{alignContent: 'center'}}
                sections={targetTimelines}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({ section: { title } }) => (
                  <View style = {styles.modalsectionView1}>
                    <Text style={styles.modaltodayText3}>{title}</Text>
                  </View>
                )}
                renderItem={({ item }) => (              
                  <View style={styles.modalcellContentView1}>
                    <Text style={styles.modaltimeText1}>{moment(item.notification.time).format('hh:mm A')}</Text>
                    <Text style={styles.modalnameText1}>{item.notification.message}</Text>
                  </View>
                )}              
              /> 
              : this.state.selectedIndex == 1 ? 
                <View style={{width: '100%', flex: 1, justifyContent: 'flex-start',}}>
                  <SmartScroll hour_size={hour_size} startHour={startHour} endHour={endHour}>
                    <View style={styles.body}>
                      <View style={styles.hour_col}>
                        <TimeCol hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                      </View>
                      <View style={styles.schedule_col}>
                        <DrawnGrid hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                        <NowBar select_date={new Date()} hour_size={hour_size} startHour={startHour} endHour={endHour}/>
                        
                        { this.state.selectedTodayRequests.length > 0 && 
                          <View style={{ width: '100%', height: '100%', position: 'absolute'}}>
                            { todayData(this.state.selectedTodayRequests, new Date()).map((row, index) => 
                              <View key={index} style={{...styles.eventView, marginTop: (row.hrsBefore - startHour) * hour_size + 10}}>                        
                                { row.rowAppts.map((appt, i) => 
                                  <ApptView key={i} topTime={row.start} appt={appt} hour_size={hour_size} onEventPress={this.onEventPress}/>
                                )}
                              </View>
                            )}
                          </View>
                        }
                      </View>
                    </View>
                  </SmartScroll>
                </View>                
              : <SectionList   
                showsVerticalScrollIndicator={false}             
                sections={repRatingsData}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({ section: { title } }) => (
                  <View style = {styles.modalsectionView3}>
                    <Text style={styles.modaltodayText3}>{title}</Text>
                  </View>
                )}
                renderItem={({item, index}) => (
                  <View key={index} style={styles.modalvItem3}>
                    <RatingView star={item.star} type={0}/>
                    <Text style={styles.modalnameText3}>{item.writerName}</Text>
                    {item.review == "" ? null : <Text style={styles.modalreviewText3}>{item.review}</Text>} 
                  </View>
                )}            
              />
            }
          </View> 

        </Modalize>
      </Portal>      

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
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    backgroundColor: theme.colors.inputBar,
  },

  titleText: {
    width: '100%',
    height: 39,
    marginTop: 16,
    marginHorizontal: 0,
    textAlign: 'center',
    fontSize: 20,    
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
    backgroundColor: theme.colors.inputBar
  },

  downButton: { 
    height: 29,
    marginTop: 0,
    marginBottom: 0,   
    width: '20%',
    paddingTop: 10,
    alignItems: 'center', 
    alignSelf: 'center',
  },

  image: {
    height: 8.33,
    width: 14.23,    
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  scheduleView: {
    width: '100%',
    justifyContent: 'flex-start',
  },

  container: {
    width: '100%',
    height: 31,
    marginTop: 10,     
    flexDirection: 'row',
    alignItems: 'flex-end',       
  },

  scheduleText: {
    marginLeft: 16,
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray
  },

  seeButton: {
    height: 32,
    justifyContent: 'flex-end',    
  },

  seeText: {
    marginLeft: 16,
    marginRight: 16, 
    fontSize: 15,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightYellow,
  },

  horizentalContainer: {
    marginLeft: 6,
    height: 162,
  },

  hItem: {
    width: 217,
    height: 134,
    marginLeft: 10,
    marginRight: 4,     
    marginVertical: 14, 
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',    
  },

  hImageView: {
    marginTop: 15,
    marginLeft: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignContent: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  hImage: {
    width: 20,
    height: 20,
    alignSelf: 'center'
  },

  hText: {
    marginTop: 14,
    marginLeft: 12,
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  hTime: {
    marginLeft: 12,
    marginTop: 2,
    fontSize: 13,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  lineView: {
    width: 193,
    height: 0.6,
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: theme.colors.navBarLine, 
  },

  receiverView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },

  profileImageView: {    
    width: 40,
    height: 40,
    marginLeft: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignContent: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 40,
    height: 40,
    
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },

  acceptText: {
    marginLeft: 10,
    fontSize: 13,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  receiverName: {
    marginLeft: 10,
    fontSize: 13,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  liveView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
  },

  liveText: {
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 7,
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray, 
  },

  listView: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    flex: 1,
  },

  vItem: {
    width: '100%',
    height: 55,
    marginTop: 7,
    marginBottom: 7,                      
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vItem1: {
    width: '100%',
    height: 55,
    marginTop: 7,
    marginBottom: 7,                      
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vImageView: {
    marginLeft: 17,
    width: 31,
    height: 31,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  vText: {
    marginLeft: 12,
    fontSize: 18,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  pendingText: {
    marginRight: 12,
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray
  },

  receiverProfileView: {
    width: 55,
    height: 55,    
    marginRight: 2,
    borderRadius: 27.5,
    
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  receiverImage: {
    width: 55,
    height: 55,    
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: '#fff',
    
    alignSelf: 'center',   
  },

  forwardImage: {
    width: 8,
    height: 14,    
    marginRight: 16,
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  emptycontainerView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  noRequestText: {
    marginLeft: 16,
    marginTop: 16, 
    marginBottom: 24, 
    
    fontSize: 16,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray, 
  },

  emptyImage: {
    width: DEVICE_WIDTH,
    height: DEVICE_WIDTH * 184/375,
    resizeMode: 'cover',
    marginTop: 80,
    marginBottom: 0,
    alignSelf: 'center'
  },

  containerView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: '#fff',

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  selectText:{
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  titleView : {    
    width: DEVICE_WIDTH,
    height: 72,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',

    borderBottomColor: theme.colors.inputBar,
    borderBottomWidth: 1,
    
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

  cellSelectedContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 24 - 24)/3,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,           
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FFFFFF',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
  },

  callImage: {
    width: 24,
    height: 24,        
    resizeMode: 'stretch'
  },

  callText: {
    marginLeft: 6,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular', 
  },

  confirmtimeView:{
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',   
  },

  cDateView: {
    width: DEVICE_WIDTH/3,
    backgroundColor: 'blue',
  },

  dateContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 64)/2,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,           
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
  },

  confirmText: {
    marginTop: 28,
    fontSize: 15,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium',
  },

  descriptionText: {
    fontSize: 15, 
    lineHeight: 22, 
    fontFamily: 'Poppins-Regular', 
    marginLeft: 16, 
    marginRight: 16, 
    textAlign: 'left', 
    alignSelf: 'flex-start', 
    marginTop: 6
  },

  vContent: {
    width: DEVICE_WIDTH - 105,
    height: 55,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vImage: {
    width: 31,
    height: 31,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 20,
    marginBottom: 57,
    borderRadius: 28.5,
    backgroundColor: theme.colors.darkBlue,
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

  modalStyle: {
    height: '100%', 
    zIndex: 2,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    backgroundColor: '#FFF', 
  },

  modalHeaderView: {
    width: DEVICE_WIDTH,
    height: 80,
    backgroundColor: theme.colors.inputBar,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    flexDirection: 'row',
    alignItems: 'flex-end'
  },

  modalCloseButton: {
    height: 40,
    marginBottom: 10,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignContent: 'center'
  },

  modalcloseText: {
    fontSize: 18,
    lineHeight: 25,
    color: theme.colors.darkGray,
    fontFamily: 'Poppins-Medium',
  },

  modalviewFullText : {
    fontSize: 18,
    lineHeight: 25,
    color: theme.colors.primary,
    fontFamily: 'Poppins-Medium',
  }, 


  modalprofileView: {
    width: '100%',
    marginTop: 24,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  modalprofileImageView :{
    width: 94,
    height: 94,
    borderRadius: 47,
    marginLeft: 16,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  modalprofileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: '#fff',
  },

  modalstatusView: {
    width: 28,
    height: 28,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderColor: 'white',
    borderRadius: 14,
    borderWidth: 3, 
  },

  modalprofileContentView: {
    marginLeft: 12,
    marginRight: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  modalnameText: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
  },

  modalemailText: {
    marginTop: 2,
    marginRight: 4,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.darkBlue,
    textDecorationLine: 'underline',
  },

  modalratingView: {
    height: 22,
    marginTop: 6,
    flexDirection: 'row',
  },

  modalratingText: {
    height: 22,
    marginLeft: 2,
    paddingTop: 5,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray
  },

  modallistView: {
    flex: 1,
    width: DEVICE_WIDTH,
    marginTop: 16,  
    alignItems: 'center',
  },

  modalsegementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginBottom: 10,
  },

  modalsectionView3: {
    width: DEVICE_WIDTH - 32,
    height: 30,
    backgroundColor: 'white',
  },

  modaltodayText3: {
    marginTop: 12, 
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.sectionHeader,
  },

  modalvItem3: {
    width: '100%',
    marginTop: 6,
    marginBottom: 6,      
    paddingBottom: 12,                
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',  
  },

  modalnameText3: {
    marginTop: 10,
    marginLeft: 12,
    fontSize: 15,    
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
  },

  modalreviewText3: {
    marginLeft: 12,
    marginTop: 2,
    fontSize: 14,    
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  modalratingText3: {
    height: 29,
    marginLeft: 8,
    paddingTop: 4,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Regular',
  },

  modalsectionView1: {
    marginLeft: 6,
    height: 30,
    backgroundColor: 'white',
  },

  modaltodayText1: {
    marginTop: 12, 
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.sectionHeader,
  },

  modalcellContentView1: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 6,    
    marginTop: 6,
    marginBottom: 6,      
    paddingHorizontal: 12,
    paddingVertical: 16,                
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start', 
    flexDirection: 'row',
  },  

  modaltimeText1: {
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
    color: theme.colors.primary
  },

  modalnameText1: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',  
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  hour_col: {
    marginLeft: 16,
    width: 50,
    flexDirection: 'column',
  },

  schedule_col: {
    marginRight: 16,
    flex: 1,
  },

  eventView: {
    width: '100%',    
    position: 'absolute',    
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
})