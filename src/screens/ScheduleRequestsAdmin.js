import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, TouchableOpacity, SectionList, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import { Modalize } from 'react-native-modalize';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import moment from 'moment';

import RatingView from '../components/RatingView'
import SmartScroll from '../components/SmartScroll'
import TimeCol from '../components/TimeCol'
import DrawnGrid from '../components/DrawnGrid'
import NowBar from '../components/NowBar'
import ApptView from '../components/ApptView'
import todayData from '../services/todayData'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height
const hour_size = DEVICE_HEIGHT/12

export default class ScheduleRequestsAdmin extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedRequests: this.props.route.params.requests,

      selectedRep: null,
      selectedIndex: 0,
      selectedNotifications: [],
      weeklyAvailable:[],
      selectedTodayRequests: [],
      selectedRating: [],
    };   
  }

  modalize = React.createRef();

  selectRow = (item) => {
    this.props.navigation.navigate('ScheduleSupportAdmin', {
      request: item
    })
  }

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
    var targetDates = []
    var targetRequests = []

    var date = new Date();
    date.setDate(date.getDate() + 1);
    const today = moment().format('MMM DD, yyyy')
    const tomorrow = moment(date).format('MMM DD, yyyy')

    this.state.selectedRequests.forEach(request => {
      const tmpDate = new Date(request.scheduleTime)
      const key = moment(tmpDate).format('MMM DD, yyyy')

      const dateString = (key == today) ? 'Today' :  (key == tomorrow) ? 'Tomorrow' : key

      if (targetDates.includes(dateString)) {
        const tmpIndex = targetDates.indexOf(dateString)
        var aryTemp = targetRequests[tmpIndex].data
        aryTemp.push(request)

        targetRequests.splice(tmpIndex, 1);
        targetRequests.splice(tmpIndex, 0, {title: dateString, data: aryTemp})
      } else {
        targetDates.push(dateString)
        var subRequests = []
        subRequests.push(request)
        targetRequests.push({title: dateString, data: subRequests})
      }
    })

    // Timeline Data
    var timelineDates = []
    var targetTimelines = []

    const todayTimeline = moment().format('DD MMM yyyy')

    this.state.selectedNotifications.forEach(notification => {
      const tmpDate = new Date(notification.notification.time)
      const key = moment(tmpDate).format('DD MMM yyyy')

      const dateString = (key == todayTimeline) ? 'Today' : key

      if (timelineDates.includes(dateString)) {
        const tmpIndex = timelineDates.indexOf(dateString)
        var aryTemp = targetTimelines[tmpIndex].data
        aryTemp.push(notification)

        targetTimelines.splice(tmpIndex, 1);
        targetTimelines.splice(tmpIndex, 0, {title: dateString, data: aryTemp})
      } else {
        timelineDates.push(dateString)
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
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Schedules</PageTitle>
        </View>

        <View style={styles.listView}>
          <SectionList                
            sections={targetRequests}
            keyExtractor={(item, index) => item + index}                     
            renderItem={({item, index}) => (
              <View key = {index} style = {styles.hItem}>
                <TouchableOpacity style={{width: DEVICE_WIDTH, flexDirection: 'row'}} onPress={() => this.selectRow(item)}>
                  <View style={styles.hImageView}>
                    <Image source={ item.type === 'Video' ? require('../assets/images/home/iconVideo.png') : item.type === 'Call' ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.hImage} />
                  </View> 
                  <View>
                    <Text style={styles.hText}>{item.sender.firstname + " " + item.sender.lastname}</Text>
                    <Text style={styles.hTime}>{moment(new Date(item.scheduleTime)).format('hh:mm A')}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.lineView} />

                {item.status === 'scheduled' ?  
                  <TouchableOpacity style={styles.receiverView} onPress={() => this.openModalize(item.receiver)}>
                    <View style={styles.profileImageView}>
                      <Image source={{uri : item.receiver.image}} style={styles.profileImage} />
                    </View>

                    <View>
                      <Text style={styles.acceptText}>Accepted By</Text>
                      <Text style={styles.receiverName}>{item.receiver.firstname + " " + item.receiver.lastname} </Text>
                    </View>                   
                  </TouchableOpacity>
                : <Text style={{...styles.hTime, marginTop: 20}}>Pending</Text>}
              </View>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.sectionText}>{title}</Text>
              </View>
            )}  
          />
        </View>

        <Modalize
          tapGestureEnabled={false}
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
                    {item.review == "" ? null : (<Text style={styles.modalreviewText3}>{item.review}</Text>)} 
                  </View>
                )}            
              />
            }
          </View> 
        </Modalize>

      </Background>      
    )
  }
}

const styles = StyleSheet.create({

  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },  

  listView: {
    width: DEVICE_WIDTH - 32,
    marginTop: 8,
    marginBottom: 16,
    flex: 1,
  },

  scheduleText: {
    marginTop: 24, 
    marginBottom: 7,
    fontSize: 15,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray
  },

  hItem: {
    width: DEVICE_WIDTH - 32,
    height: 134,   
    marginVertical: 7, 
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
    width: DEVICE_WIDTH - 56,
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
    marginLeft: 14,
    width: 40,
    height: 40,
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

  sectionView: {
    width: DEVICE_WIDTH,
    height: 30,
    backgroundColor: 'white',
  },

  sectionText: {    
    paddingTop: 12,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
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
    backgroundColor: 'red'    
  },

  modalprofileContentView: {
    marginLeft: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },

  modalnameText: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
  },

  modalemailText: {
    marginTop: 2,
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