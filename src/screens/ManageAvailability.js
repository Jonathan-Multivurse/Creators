import React, { Component } from 'react'
import { View, Platform, StyleSheet, Image, Dimensions, Text, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, TextInput, Alert } from 'react-native'
import Background from '../components/Background'
import { theme } from '../core/theme'
import {Calendar, WeekCalendar} from 'react-native-calendars'
import moment from 'moment'
import auth, {firebase} from "@react-native-firebase/auth"
import USER_DB from '../api/userDB'
import SmartScroll from '../components/SmartScroll'
import TimeCol from '../components/TimeCol'
import DrawnGrid from '../components/DrawnGrid'
import NowBar from '../components/NowBar'
import ApptView from '../components/ApptView'
import todayData from '../services/todayData';
import { isSearchBarAvailableForCurrentPlatform } from 'react-native-screens'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;
const hour_size = DEVICE_HEIGHT/12

export default class ManageAvailability extends Component {
  constructor(props) {
    super(props)    
    this._unsubscribeFocus = null;
    USER_DB.getProfile(this.onUserGet) 

    var markedDays = {}
    let defaultDate = moment().format('yyyy-MM-DD')
    markedDays[defaultDate] = {selected: true, marked: true, selectedColor: theme.colors.primary}

    this.state = {
      isLoading: false,
      isWeek: true,

      selectedDate: new Date(),  
      markedDays: markedDays,      
      scheduledRequests : [],
      targetRequests: [], 
      
      weeklyAvailable: [],
      todayRequests: [],

      selectIndex: -1,
      modalVisible: false,
      isExpand: false,
      tmpTitle: '',
      selectedStartTime: new Date(),

      modalEditVisible: false,
    };   
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      USER_DB.getProfile(this.onUserGet) 
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
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
      isLoading: false,      
      weeklyAvailable: tmpAvailable,      
    })
    
    this.getSupports();
  } 

  getSupports = () => {
    const userID = firebase.auth().currentUser.uid;

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
        return;
      }

      this.setState({
        isLoading: false,
        scheduledRequests: responseJson.scheduled,
      });     
      
      this.getTarget(this.state.selectedDate);
      this.getScheduleTarget(responseJson.scheduled, responseJson.unavailable);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onDaySelected = (date) => {

    const year = date.year
    const month = date.month - 1
    const day = date.day

    let tmpdate = new Date(year, month, day, 0, 0)
    this.setState({ selectedDate: tmpdate });
    this.getTarget(tmpdate);
  }

  getTarget = (selecteddate) => {
    var tmpDays = []
    var tmpDates = []
    var tmpRequests = []

    this.state.scheduledRequests.forEach(request => {
      const date = new Date(request.scheduleTime)

      const targetDate = selecteddate
      if(date.getDate() === targetDate.getDate()){
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

  getScheduleTarget = (scheduledRequests, arrayUnavailable) => {
    var tmpRequests = []

    scheduledRequests.forEach(request => {
      const startTime = new Date(request.scheduleTime)
      const endTime = new Date(request.scheduleTime + 899*1000)

      tmpRequests.push({
        title: request.type,
        type: 'support',
        start: startTime,
        end: endTime,
      })
    });

    arrayUnavailable.forEach(item => {
      const startTime = new Date(item.startTime)
      const endTime = new Date(item.startTime + 1799*1000)

      tmpRequests.push({
        title: item.title,
        type: 'custom',
        start: startTime,
        end: endTime,
      })
    });

    this.setState({
      todayRequests: tmpRequests,
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

  onWeeklyAvailabiltiy = () => {
    this.props.navigation.navigate('WeeklyAvailability')    
  }

  onEventPress = () => {
  }

  onSetTime = async(startHour, endHour, index) => {
        
    const selectedDate = this.state.selectedDate
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const day = selectedDate.getDate()
    const hour = startHour + Math.floor(index/2)
    const minute = index % 2 == 0 ? 0 : 30 

    const newStartDate = new Date(year, month, day, hour, minute);

    const todayArray = todayData(this.state.todayRequests, this.state.selectedDate)
    const tmpArray = todayArray.filter((event) => {
      const startTime = event.start.getTime()
      const endTime = event.end.getTime()

      return (newStartDate.getTime() >= startTime && newStartDate.getTime() <= endTime)
    })

    console.log('today Array ===>', newStartDate, tmpArray.length)

    if ( tmpArray.length == 0)  {   
      this.setState({
        isExpand: false,
        selectedStartTime: newStartDate,
        tmpTitle: ''
      }) 
  
      this.setState({
        selectIndex: index,
        modalVisible: true,
      })
    } else {
      const tmpEvent = tmpArray[0]

      if (tmpEvent.rowAppts[0].type === 'custom') {
        this.setState({
          isExpand: true,
          selectedStartTime: newStartDate,
          tmpTitle: tmpEvent.rowAppts[0].title,
          modalEditVisible: true
        }) 
      }
    }    
  }

  onCreate = (visible) => {
    this.setState({ modalVisible: visible });         
  }

  onCancelButton = () => {
    this.setState({
      modalVisible: false, 
      selectIndex: -1,
    })
  }

  onSaveButton = () => {
    this.setState({
      isLoading: true,
    })    

    const userID = firebase.auth().currentUser.uid;  

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/writeUnavailability', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        startTime: this.state.selectedStartTime.getTime(),
        duration: 1800,
        title: this.state.tmpTitle,
        type: 'create'
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      this.setState({
        isLoading: false,
        modalVisible: false,
        isExpand: false,        
        selectIndex: -1,
      }) 

      if (responseJson.statusCode !== 200) {
        return;
      }  
      
      this.getSupports();
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onEdit = (visible) => {
    this.setState({ modalEditVisible: visible });         
  }

  onEditCancelButton = () => {
    this.setState({
      modalEditVisible: false, 
    })
  }

  onDeleteButton = () => {
    this.setState({
      isLoading: true,
    })    

    const userID = firebase.auth().currentUser.uid;  

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/writeUnavailability', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        startTime: this.state.selectedStartTime.getTime(),
        duration: 1800,
        title: this.state.tmpTitle,
        type: 'delete'
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      this.setState({
        isLoading: false,
        modalEditVisible: false,
        isExpand: false,        
        selectIndex: -1,
      }) 

      if (responseJson.statusCode !== 200) {
        return;
      }  
      
      this.getSupports();
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  onEditSave = () => {
    this.setState({
      isLoading: true,
    })    

    const userID = firebase.auth().currentUser.uid;  

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/writeUnavailability', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        startTime: this.state.selectedStartTime.getTime(),
        duration: 1800,
        title: this.state.tmpTitle,
        type: 'edit'
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      this.setState({
        isLoading: false,
        modalEditVisible: false,
        isExpand: false,        
        selectIndex: -1,
      }) 

      if (responseJson.statusCode !== 200) {
        return;
      }  
      
      this.getSupports();
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  render() {
    let selected = moment(this.state.selectedDate).format('yyyy-MM-DD')  
    let startHour = this.state.weeklyAvailable.length === 0 ? 9 : this.state.weeklyAvailable[0].from 
    let endHour = this.state.weeklyAvailable.length === 0 ? 20 : this.state.weeklyAvailable[0].to === 0 ? 24 : this.state.weeklyAvailable[0].to > this.state.weeklyAvailable[0].from ? this.state.weeklyAvailable[0].to : this.state.weeklyAvailable[0].from + 1
    let indexDays = this.state.weeklyAvailable.length === 0 ? 0 : this.state.weeklyAvailable[0].days 

    return (
      <Background>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onCreate(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
            <View style={styles.centeredView}>
              <View style={{flex:1}}/>
              <View style = {styles.modalView}>
              
                <View style={styles.titleView}>
                  <TouchableOpacity onPress={() => this.setState({isExpand: true})} style={styles.expandButton} >
                  { !this.state.isExpand && <Image  style={styles.expandImage} source={require('../assets/images/home/ChevronUp.png')} />}
                  </TouchableOpacity>
                  
                  <View style={{...styles.titleSubview, marginBottom: this.state.isExpand ? 8 : 24}}>
                    <TouchableOpacity style={{...styles.cancelButton, alignItems: 'flex-start'}} onPress={() => this.onCancelButton()}>
                      <Text style={{...styles.loginText, color: theme.colors.darkGray}}>Cancel</Text>
                    </TouchableOpacity>

                    <Text style={styles.editPText}>Add Unavailability</Text>
                    <TouchableOpacity style={{...styles.cancelButton, alignItems: 'flex-end'}} onPress={() => this.onSaveButton()}>
                      <Text style={{...styles.loginText, color: theme.colors.primary}}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>  

                { this.state.isExpand && 
                <View style={{width: DEVICE_WIDTH, height: 330, backgroundColor: 'white', alignItems: 'center'}}>

                  <Text style={styles.startsText}>Starts</Text>
                  <View style={styles.emailInput}>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('DD MMMM, yyyy')}</Text>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('h:mm A')}</Text>
                  </View>
                  

                  <Text style={styles.startsText}>Ends</Text>
                  <View style={styles.emailInput}>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('DD MMMM, yyyy')}</Text>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).add(30, 'minutes').format('h:mm A')}</Text>
                  </View>

                  <Text style={styles.startsText}>Title</Text>
                  <TextInput
                    style={styles.emailInput}
                    value={this.state.tmpTitle}
                    onChangeText={ (text) => this.setState({tmpTitle: text}) }
                    placeholder='Give a title to unavailability'
                    autoCapitalize="none"
                    autoCompleteType="name"
                    textContentType="name"
                    keyboardType="name-phone-pad"
                  />
                </View> 
                } 
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalEditVisible}
          onRequestClose={() => {
            this.onEdit(false);
          }}
        >
          <KeyboardAvoidingView behavior={"padding"} style={{flex:1}}>
            <View style={styles.centeredView}>
              <View style={{flex:1}}/>
              <View style = {styles.modalView}>
              
                <View style={styles.titleView}>
                  <TouchableOpacity onPress={() => this.setState({isExpand: true})} style={styles.expandButton} >
                  { !this.state.isExpand && <Image  style={styles.expandImage} source={require('../assets/images/home/ChevronUp.png')} />}
                  </TouchableOpacity>
                  
                  <View style={{...styles.titleSubview, marginBottom: this.state.isExpand ? 8 : 24}}>
                    <TouchableOpacity style={{...styles.cancelButton, alignItems: 'flex-start'}} onPress={() => this.onEditCancelButton()}>
                      <Text style={{...styles.loginText, color: theme.colors.darkGray}}>Cancel</Text>
                    </TouchableOpacity>

                    <Text style={styles.editPText}>Edit Unavailability</Text>
                    <TouchableOpacity style={{...styles.cancelButton, alignItems: 'flex-end'}} onPress={() => this.onDeleteButton()}>
                      <Text style={{...styles.loginText, color: theme.colors.mainRed}}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>  

                <View style={{width: DEVICE_WIDTH, height: 400, backgroundColor: 'white', alignItems: 'center'}}>

                  <Text style={styles.startsText}>Starts</Text>
                  <View style={styles.emailInput}>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('DD MMMM, yyyy')}</Text>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('h:mm A')}</Text>
                  </View>
                  
                  <Text style={styles.startsText}>Ends</Text>
                  <View style={styles.emailInput}>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).format('DD MMMM, yyyy')}</Text>
                    <Text style={styles.timeText}>{moment(this.state.selectedStartTime).add(30, 'minutes').format('h:mm A')}</Text>
                  </View>

                  <Text style={styles.startsText}>Title</Text>
                  <TextInput
                    style={styles.emailInput}
                    value={this.state.tmpTitle}
                    onChangeText={ (text) => this.setState({tmpTitle: text}) }
                    placeholder='Give a title to unavailability'
                    autoCapitalize="none"
                    autoCompleteType="name"
                    textContentType="name"
                    keyboardType="name-phone-pad"
                  />

                  <TouchableOpacity style={styles.loginButton} onPress={() => this.onEditSave()}>
                    <Text style={styles.saveText}>Save</Text>
                  </TouchableOpacity>

                </View> 
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style={styles.navigationView}>
            
          { this.state.isWeek ? 
          <View>
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity style={styles.backView} onPress={() => this.props.navigation.goBack()}>
                <Image style={styles.backImage} source={require('../assets/images/login/arrow_back.png')}/>
              </TouchableOpacity>
              <Text style={styles.titleText}>{moment(this.state.selectedDate).format('DD MMMM, yyyy')}</Text>
            </View>      

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
            style={{marginTop: 32}}         
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

        <View style={styles.liveView}>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.workingText}>Working Hours</Text>
            <View style={{flex: 1}}/>
            <TouchableOpacity style={styles.arrowButton} onPress={() => this.onWeeklyAvailabiltiy()}>
              <Text style={styles.hoursText}>{getAvailableTime(startHour) + " - " + getAvailableTime(endHour)}</Text>
              <Text style={styles.daysText}>({availableDays[indexDays]})</Text>
              <Image  style={styles.arrowImage} source={require('../assets/images/account/arrow_forward.png')} />
            </TouchableOpacity>
          </View>
            
          <Text style={styles.tipText}>Tip: To add unavailability, tap on the timeslot below.</Text> 

          <SmartScroll hour_size={hour_size} startHour={startHour} endHour={endHour}>
            <View style={styles.body}>
              <View style={styles.hour_col}>
                <TimeCol hour_size={hour_size} startHour={startHour} endHour={endHour}/>
              </View>
              <View style={styles.schedule_col}>
                <DrawnGrid hour_size={hour_size} startHour={startHour} endHour={endHour}/>             
                <NowBar select_date={this.state.selectedDate} hour_size={hour_size} startHour={startHour} endHour={endHour}/>               
                
                { !!this.state.todayRequests && 
                  <View style={{ width: '100%', height: '100%', position: 'absolute'}}>
                    { todayData(this.state.todayRequests, this.state.selectedDate).map((row, index) => 
                      <View key={index} style={{...styles.eventView, marginTop: (row.hrsBefore - startHour) * hour_size + 10}}>                        
                        { row.rowAppts.map((appt, i) => 
                          <ApptView key={i} topTime={row.start} appt={appt} hour_size={hour_size} onEventPress={this.onEventPress}/>
                        )}
                      </View>
                    )}
                  </View>
                }

                <View style={{ width: '100%', height: '100%', position: 'absolute', paddingTop: 10}}>
                  {[...Array(2*endHour - 2*startHour)].map((val, i) =>  this.state.selectIndex == i ? 
                    <View style={{height: hour_size/2 -2, marginVertical: 1,width: '100%', borderRadius: 6, borderWidth: 1, borderColor: 'black'}} key={i} />
                    : <TouchableOpacity onPress={() => this.onSetTime(startHour, endHour, i)} style={{height: hour_size/2 -2, width: '100%', marginVertical: 1,}} key={i} /> 
                  )}
                </View> 

  
              </View>

            </View>
          </SmartScroll>
        </View>

        {this.state.isLoading ? 
          (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
          ) : null
        }  
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
    paddingTop: Platform.OS === 'ios' ? 12 : 0,
    backgroundColor: theme.colors.inputBar,
  },

  backView: {
    width: 40,
    height: 40,
    marginTop: 48,
    marginLeft: 0,
    paddingLeft: 16,
    paddingTop: 6,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  backImage: {
    width: 12,
    height: 20.5,
  },

  titleText: {
    width: DEVICE_WIDTH - 80,
    height: 39,
    marginTop: 48,
    textAlign: 'center',
    fontSize: 20,    
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
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

  liveView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
  },

  workingText: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 20,
    fontSize: 14,    
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',  
  },

  arrowButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
    flexDirection: 'row',
  },

  arrowImage: {
    width: 10,
    height: 16,
  },

  hoursText: {
    marginLeft: 16,
    paddingTop: 2,
    fontSize: 14,    
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },

  daysText: {
    marginLeft: 6,
    marginRight: 6,
    paddingTop: 2,
    fontSize: 14,    
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },

  tipText: {
    marginLeft: 16,
    marginBottom: 24,
    fontSize: 13,    
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray  
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

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow,
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    alignItems: "center",   
    backgroundColor: theme.colors.inputBar, 

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
    backgroundColor: theme.colors.inputBar,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,    
    alignItems: 'center'
  },
  
  editPText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Poppins-Medium',
  },

  expandButton: {
    width: 80, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
  },

  expandImage: {
    height: 8.33,
    width: 14.23,    
    resizeMode: 'contain',
    alignSelf: 'center',
  },  

  startsText: {
    height: 20,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 15,
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
    alignItems: 'center',
    flexDirection: 'row'
  },

  timeText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  },

  cancelButton: { 
    marginLeft: 16,
    marginRight: 16,
    height: 40,
    justifyContent: 'center',
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: 'Poppins-Medium',
  },

  titleSubview: {
    width: DEVICE_WIDTH,    
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center'
  },

  loginButton: { 
    width: DEVICE_WIDTH - 72,
    height: 48,
    marginTop: 36,
    marginBottom: 36,
    borderRadius: 24,
    backgroundColor: theme.colors.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  saveText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },  
})