import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, Platform, StyleSheet, Image, Modal, Dimensions, TouchableOpacity, Alert, Text, FlatList, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native'
import Background from '../components/Background'
import { theme } from '../core/theme'
import {Calendar, WeekCalendar} from 'react-native-calendars'
import moment from 'moment'
import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'
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

class HomeScreen extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;
    this._observerRequest = null;  

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
      curUser: '',
    };   
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      // this.completeAllSessions()
      USER_DB.getProfile(this.onUserGet)
      this.getRequests();
    });

    this._observerRequest = firestore().collection('request')
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getRequests();
      }      
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observerRequest();
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

  completeAllSessions = () => {
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/completeAllSessions', {
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
      console.log("Response ====>", responseJson)   
      if (responseJson.statusCode !== 200) {
        return;
      }       
    })
    .catch((err) => {     
    });
  }

  getRequests = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getRequests', {
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

      var todayUnRequests = responseJson.unscheduled
      const todayDate = new Date()   
      responseJson.scheduled.forEach(request => {      
        const date = new Date(request.scheduleTime)
  
        if(todayDate.getDate() === date.getDate() && todayDate.getMonth() === date.getMonth()){
          todayUnRequests.push(request)
        }
      });

      this.setState({
        isLoading: false,
        scheduledRequests: responseJson.scheduled,
        unscheduledRequests: todayUnRequests,
      });     
      
      this.getTarget(this.state.selectedDate);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });

      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  getTarget = (selecteddate) => {
    var tmpDays = []
    var tmpDates = []
    var tmpRequests = []

    this.state.scheduledRequests.forEach(request => {      
      const date = new Date(request.scheduleTime)
      const targetDate = selecteddate

      if(date.getDate() === targetDate.getDate() && date.getMonth() === targetDate.getMonth() ){
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

      let key = moment(date).format('yyyy-MM-DD')
      if (key === moment().format('yyyy-MM-DD')){
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
      this.props.navigation.navigate('ScheduleRequests', {
        requests: this.state.scheduledRequests
      })
    }    
  }

  onSelectScheduleRow = (item) => {
    this.props.navigation.navigate('ScheduleSupport', {
      request: item,
      isFromAdmin: false
    })
  }

  selectRow = (item) => {
    this.setState({selectedItem: item, modalVisible: true})
  }

  onConfirm = (visible) => {
    this.setState({ modalVisible: visible }); 
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

    const requestID = this.state.selectedItem.requestid;
    const userID = firebase.auth().currentUser.uid;

    if (this.state.selectedItem.isSchedule) {
      fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/scheduleRequest', {
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
        
        this.setState({
          modalVisible: false,
        });
  
        this.goNext();
      })
      .catch((err) => {        
        this.setState({
          isLoading: false,
        });

        Alert.alert('Network Error', 'Please check your network connection and try again.')
      });
    } else {
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
          // alert(responseJson.error);
          return;
        } 

        this.setState({
          modalVisible: false,
        });
  
        this.goNext();
      })
      .catch((err) => {        
        this.setState({
          isLoading: false,
        });

        Alert.alert('Network Error', 'Please check your network connection and try again.')
        return;
      });
    }    
  } 

  goNext = async () => {
    if (this.state.selectedItem.isSchedule) {
      var item = this.state.selectedItem
      item.receiverId = this.state.curUser.userid
      item.receiver = this.state.curUser
      item.status = 'scheduled'
      this.props.navigation.navigate('ScheduleSupport', {
        request: item,
        isFromAdmin: false
      })
    } else {
      if (this.state.selectedItem.type == 'Chat') {
        setTimeout(() => {
          this.joinHandler()         
        }, 1200); 
      } else {
        global.selectedRequest = this.state.selectedItem
        this.setState({
          isLoading: false,
        });
      }
    }    
  }

  joinHandler = () => {   
    const { joingDialog,  navigation, selected } = this.props

    new Promise((resolve, reject) => {
      joingDialog({ dialogId: this.state.selectedItem.dialog.id, resolve, reject })
    })
    .then(action => {
      this.setState({
        isLoading: false,
      })
      
      global.curUser = this.state.curUser
      global.selectedRequest = this.state.selectedItem
      
      const dialog = this.state.selectedItem.dialog
      navigation.navigate('Messages', {dialog})
    })
    .catch(action => {
      this.setState({
        isLoading: false,
      })

      setTimeout(() => {
        console.log("Second Join Dialog ==>")
        this.joinHandler()       
      }, 800); 

      // showError('Failed to join dialog', action.error)
    })
  }

  render() {
    let selected = moment(this.state.selectedDate).format('yyyy-MM-DD')

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
                <View style = {{...styles.vItem,  backgroundColor: '#F5D8E2', marginTop: 16}}>
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
                : <View  style = {{...styles.vItem,  marginTop: 18, marginLeft: 16, marginRight: 16,  
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
                    <Text style={styles.descriptionText}>{moment(this.state.selectedItem.time).format('DD-MM-yyyy HH:MM A')}</Text> 
                  </View>
              }

              <Text style={{...styles.selectText, marginTop: 18}}>Simulator</Text>
              <Text style={styles.descriptionText}>{this.state.selectedItem.simulator}</Text> 

              <Text style={{...styles.selectText, marginTop: 18,}}>Description</Text>
              <Text style={{...styles.descriptionText,  marginBottom: 16,}}>{this.state.selectedItem.description}</Text>
             
              <TouchableOpacity style={styles.loginButton} onPress={() => this.onAccept()}>
                  <Text style={styles.loginText}>{ this.state.selectedItem.isSchedule ? ' Accept Schedule' : ' Join' + this.state.selectedItem.type} </Text>
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
                textMonthFontSize: 22,
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
              {this.state.scheduledRequests.length === 0 ? 
                <View/> 
                : <TouchableOpacity style={styles.seeButton} onPress={this.onScheduleRequestsAll}>
                  <Text style={styles.seeText}> See All</Text>
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
                {
                  this.state.targetRequests.map((item, index) => (
                    <TouchableWithoutFeedback key={index} onPress={() => this.onSelectScheduleRow(item)}>
                      <View key = {index} style = {styles.hItem}>
                        <View style={styles.hImageView}>
                          <Image source={ (item.type === 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type === 'Call') ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.hImage} />
                        </View> 

                        <View>
                          <Text style={styles.hText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                          <Text style={styles.hTime}>{moment(new Date(item.scheduleTime)).format('hh:mm A')}</Text>
                        </View>                   
                        
                      </View>
                    </TouchableWithoutFeedback>
                  ))
                }
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
                        <View style={styles.receiverProfileView}>
                          <Image source={{uri : item.receiver.image}} style={styles.receiverImage} />    
                        </View> 
                      </View>  
                    : <View key = {index}  style = {styles.vItem1}>
                        <View style = {{...styles.vContent,    
                          backgroundColor: (item.type === 'Video') ? '#00ACEC33' : (item.type === 'Call') ? '#2BCC7133' : (item.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'
                          }}>
                            <View style={styles.vImageView}>    
                              <Image source={ (item.type=== 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (item.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                            </View>
                            <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                            <View style={{flex: 1}} />
                        </View>
                        <View style={{flex: 1}} />
                        <View style={styles.receiverProfileView}>
                          <Image source={{uri : item.receiver.image}} style={styles.receiverImage} />    
                        </View> 
                      </View> 
                    )
                : <TouchableWithoutFeedback onPress={() => this.selectRow(item)} key={index}>
                    { item.isSchedule ? 
                      <View key = {index} style = {{...styles.vItem, backgroundColor: '#F5D8E2'}}>
                          <View style={styles.vImageView}>
                            <Image source={require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                          </View>                        
                          <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                          <View style={{flex: 1}} />
                          <Image source={require('../assets/images/home/ChevronForward.png')} style={styles.forwardImage} />
                      </View>
                    : <View key = {index} style = {{...styles.vItem,    
                        backgroundColor: (item.type === 'Video') ? '#00ACEC33' : (item.type === 'Call') ? '#2BCC7133' : (item.type === 'Chat') ? '#EF8F3533' : '#CF3E6F33'}}>
                          <View style={styles.vImageView}>
                            <Image source={ (item.type === 'Video') ? require('../assets/images/home/iconVideo.png') : (item.type=== 'Call') ? require('../assets/images/home/iconVoice.png') : (item.type === 'Chat') ? require('../assets/images/home/iconChat.png') : require('../assets/images/home/iconSchedule.png')} style={styles.vImage} />
                          </View>                        
                          <Text style={styles.vText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                          <View style={{flex: 1}} />
                          <Image source={require('../assets/images/home/ChevronForward.png')} style={styles.forwardImage} />
                      </View>                  
                    }                  
                  </TouchableWithoutFeedback>
                )}
              />
            </View>
          </View>
        </View>
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
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 54 : 0,
    backgroundColor: theme.colors.inputBar,
  },

  titleText: {
    width: '100%',
    height: 39,
    marginTop: 16,
    marginHorizontal: 0,
    textAlign: 'center',
    fontSize: 22,    
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

  backIcon: {
    width: 8.33,
    height: 14.23,    
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  image: {
    height: 8.33,
    width: 14.23,    
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
    height: 98,
  },

  hItem: {
    width: 217,
    height: 70,
    marginLeft: 10,
    marginRight: 4,    
    marginVertical: 14,    
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    justifyContent: 'flex-start',
    flexDirection: 'row'
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
    maxHeight: 30,
    maxWidth: 142,
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
    width: DEVICE_WIDTH - 32,
    height: 55,
    marginTop: 7,
    marginBottom: 7,                      
    borderRadius: 14,
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

  vImage: {
    width: 31,
    height: 31,
  },

  vText: {
    maxWidth: DEVICE_WIDTH - 150,
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

  vItem1: {
    width: '100%',
    height: 55,
    marginTop: 7,
    marginBottom: 7,                      
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row'
  },

  vContent: {
    width: DEVICE_WIDTH - 105,
    height: 55,
    borderRadius: 14,
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

  vImage: {
    width: 31,
    height: 31,
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

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)