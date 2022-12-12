import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { theme } from '../core/theme'
import USER_DB from '../api/userDB'
import firestore from '@react-native-firebase/firestore';
import {firebase} from '@react-native-firebase/auth'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

getTimeago = (mSeconds) =>{
  var deffTime = '';
  const diff = new Date().getTime() - mSeconds;
  if (diff < 60*60*1000) {
    deffTime = Math.floor( diff/(60*1000) ) + "m ago";
  } else if (diff < 2*60*60*1000 ){
    deffTime = "1h ago";
  } else if(diff < 24*60*60*1000) {
    deffTime = Math.floor( diff/(60 * 60 * 1000) ) + "h ago";
  } else if (diff < 2*24*60*60*1000 ){
    deffTime = "1d ago";
  } else {
    deffTime = Math.floor( diff/(24 * 60 * 60 * 1000) ) + "d ago";
  }
  return deffTime;
}

export default class SupportAdmin extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    this.state = { 
      isLoading: false,
      selectedIndex: 0,

      cUsers:[],
      pUsers: [],
    }
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getSupports();
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
      .onSnapshot(querySnapshot => {
        if (querySnapshot.docChanges().length > 0){
          this.getSupports();
        }      
      });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observer();
  }

  getSupports = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getAdminSupports', {
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
        cUsers: responseJson.accepted,
        pUsers: responseJson.pending,
      });     
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });   
  }

  goSearch = () => {
    this.props.navigation.navigate('SupportSearchAdmin', {
      users: this.state.cUsers
    });
  }

  selectRow = (rep) => {
    this.props.navigation.navigate('ManageComProfile', {
      rep: rep
    });
  }

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>  
          <Text style={styles.pageTitle}>Support</Text>
          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.rightButton} onPress={() => this.goSearch()}>
            <Image
              style={styles.searchImage}
              source={require('../assets/images/support/search_blue.png')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.listView}>

          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'Team',
              'New Requests',
            ]}
            selectedIndex={this.state.selectedIndex}
            onChange={(event) => {
              this.setState({selectedIndex: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />

          {this.state.selectedIndex == 0 ? 
            <FlatList
              data={this.state.cUsers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => 
                <View style={styles.cellView1}>
                  <TouchableOpacity style={styles.cellContentView1} onPress={() => this.selectRow(item.receiver)}>

                    <View style={styles.profileImageView1}>
                      <Image source={{uri : item.receiver.image}} style={styles.profileImage} />
                    </View>

                    <View style={styles.contentView}>
                      <Text style={styles.nameText}>{item.receiver.firstname + " " + item.receiver.lastname}</Text>

                      {(item.request === null) ?
                        <View style={{flexDirection: 'row', marginTop: 2}}>                        
                          <View style={styles.statusView}/> 
                          <Text style={styles.timeText1}>Idle</Text>
                        </View>                      
                       : <View style={{flexDirection: 'row', marginTop: 2}}>                        
                          <Image source={ (item.request.isSchedule) ? require('../assets/images/home/iconSchedule.png') : (item.request.type === 'Video') ? require('../assets/images/home/iconVideo.png') : (item.request.type === 'Call') ? require('../assets/images/home/iconVoice.png') : require('../assets/images/home/iconChat.png')} style={styles.iconImage} />
                          <Text style={styles.timeText}> {"with " + item.request.sender.firstname + " " + item.request.sender.lastname}</Text>
                        </View>
                      }
                    </View>
                  </TouchableOpacity>
                </View>
              }
            />
          : <FlatList
              data={this.state.pUsers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => 
                <View style={styles.cellView}>
                  <View style={styles.cellContentView}>

                    <View style={styles.profileImageView}>
                      <Image source={{uri : item['image']}} style={styles.profileImage} />
                    </View>

                    <View style={styles.contentView}>
                      <View style={{flexDirection: 'row'}}>
                        <Text style={styles.nameText}>{item['firstname'] + " " + item['lastname']}</Text>
                        <View style={{flex: 1}}/>
                        <Text style={styles.timeText}> {getTimeago(item['updated'])}</Text>
                      </View>

                      <View style={{flex: 1,}}></View>
                      <Text style={styles.emailText}>{item['email']}</Text>

                      <View style={{flex: 3}}/>
                      <View style={{flexDirection: 'row'}}>
                        <TouchableOpacity style={{...styles.cellButton, backgroundColor: '#2BCC71',}} onPress = {() => USER_DB.updateUser(item['userid'], 
                        {'isAccept': "accepted"})}>
                          <Text style= {styles.titleText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={{...styles.cellButton, backgroundColor: '#FF3B30', marginLeft: 12, }} onPress = {() => USER_DB.updateUser(item['userid'], 
                        {'isAccept': "declined"})}>
                          <Text style= {styles.titleText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              }
            />          
        }          
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

  rightButton: {
    width: 50,
    height: 50,
    paddingLeft: 14,
    paddingTop: 17,
  },

  searchImage: {
    width: 16,
    height: 16,
  },

  listView: {
    flex: 1,
    width: DEVICE_WIDTH,
    marginTop: 9,  
    alignItems: 'center'
  },

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginBottom: 10,
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 116,
  },

  cellContentView: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  profileImageView: {    
    width: 46,
    height: 46,
    marginLeft: 12,
    marginTop: 12,
    borderRadius: 23,
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

  cellView1: {
    width: DEVICE_WIDTH,
    height: 76,
  },

  cellContentView1: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  profileImageView1: {    
    width: 46,
    height: 46,
    marginLeft: 12,    
    borderRadius: 23,
    alignSelf: 'center',
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
    width: 46,
    height: 46,
    
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#fff',
  },

  contentView: {
    flex: 1,
    margin: 12,
  },

  nameText: {
    fontSize: 16,    
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  timeText1: {
    marginLeft: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  timeText: {
    marginLeft: 2,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  emailText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray, 
  },

  cellButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: 'white', 
  },

  iconImage: {
    width: 20,
    height: 20,
    alignSelf: 'center'
  },

  statusView: {
    width: 20,
    height: 20,
    borderColor: 'white',
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#6F6F6F',   
    backgroundColor: theme.colors.sectionHeader 
  },

})