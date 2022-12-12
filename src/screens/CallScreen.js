import React from 'react'
import { connect } from 'react-redux'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import REQUEST_DB from '../api/requestDB'

import QB from 'quickblox-react-native-sdk'
import WebRTCView from 'quickblox-react-native-sdk/RTCView'
import InCallManager from 'react-native-incall-manager'

import NavigationService from '../NavigationService'
import { theme } from '../core/theme'

import {
  usersGet,
  webrtcAccept,
  webrtcHangUp,
  webrtcReject,
  webrtcSwitchAudioOutput,
  webrtcSwitchCamera,
  webrtcToggleAudio,
  webrtcToggleVideo,
} from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

const PeerStateText = {
  [QB.webrtc.RTC_PEER_CONNECTION_STATE.NEW]: 'Calling...',
  [QB.webrtc.RTC_PEER_CONNECTION_STATE.CONNECTED]: 'Connected',
  [QB.webrtc.RTC_PEER_CONNECTION_STATE.DISCONNECTED]: 'Disconnected',
  [QB.webrtc.RTC_PEER_CONNECTION_STATE.FAILED]: 'Failed to connect',
  [QB.webrtc.RTC_PEER_CONNECTION_STATE.CLOSED]: 'Connection closed',
}

class CallScreen extends React.Component {

  isIncomingCall = this.props.session.initiatorId !== this.props.currentUser.id
  state = {
    loudspeaker: false,
    muteAudio: false,
    muteVideo: false,
  }

  componentDidMount() {
    const { getUsers, onCall, session } = this.props
    if (session) {
      if (!onCall) {
        const startOpts = {
          ringback: '_BUNDLE_',
          media: session.type === QB.webrtc.RTC_SESSION_TYPE.AUDIO ?
            'audio' :
            'video'
        }
        if (this.isIncomingCall) {
          InCallManager.startRingtone()
        } else {
          InCallManager.start(startOpts)
        }
      }
      const userIds = session
        .opponentsIds
        .concat(session.initiatorId)
        .join()
      getUsers({
        append: true,
        filter: {
          field: QB.users.USERS_FILTER.FIELD.ID,
          type: QB.users.USERS_FILTER.TYPE.NUMBER,
          operator: QB.users.USERS_FILTER.OPERATOR.IN,
          value: userIds
        }
      })
    }
  }

  componentDidUpdate() {
    const { session } = this.props
    if (!session) {
      this.onComplete()
    }
  }

  onComplete = async () => {
    NavigationService.navigate('Dashboard', {})
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { loudspeaker, muteAudio, muteVideo } = this.state
    const { caller, onCall, opponentsLeftCall, session, users } = this.props
    if (onCall !== nextProps.onCall) {
      if (!onCall && nextProps.onCall && !this.isIncomingCall) {
        InCallManager.stopRingback()
      }
    }
    if (session && !nextProps.session && !onCall) {
      if (this.isIncomingCall) {
        InCallManager.stopRingtone()
      } else {
        InCallManager.stop({ busytone: '_BUNDLE_' })
      }
    }
    return (
      onCall !== nextProps.onCall ||
      users.length !== nextProps.users.length ||
      session !== nextProps.session ||
      loudspeaker !== nextProps.loudspeaker ||
      muteAudio !== nextState.muteAudio ||
      muteVideo !== nextState.muteVideo ||
      opponentsLeftCall.length !== nextProps.opponentsLeftCall.length ||
      caller !== nextProps.caller
    )
  }

  componentWillUnmount() {
    InCallManager.stop()
  }

  acceptHandler = () => {
    const { accept, session } = this.props
    accept({ sessionId: session.id })
    InCallManager.stopRingtone()
  }

  callEndHandler = () => {
    const { hangUp, reject, session } = this.props
    if (this.isIncomingCall && session.state < QB.webrtc.RTC_SESSION_STATE.CONNECTED) {
      reject({ sessionId: session.id })
    } else {
      hangUp({ sessionId: session.id })
    }
  }

  requestEndHandler = () => {
    if (global.selectedRequest) {
      REQUEST_DB.completeRequest(global.selectedRequest.requestid, this.completedRequest)      
    }
  }

  completedRequest = () => {
    global.selectedRequest.status = 'completed'
  }

  callCompletionHandler = () => {
    this.requestEndHandler()
    this.callEndHandler()
  }

  callLeaveHandler = () => {
    this.callEndHandler()
  }

  toggleAudio = () => {
    const { muteAudio } = this.state
    const { session, toggleAudio } = this.props
    toggleAudio({ sessionId: session.id, enable: muteAudio })
    this.setState({ muteAudio: !muteAudio })
  }

  toggleVideo = () => {
    const { muteVideo } = this.state
    const { session, toggleVideo } = this.props
    toggleVideo({ sessionId: session.id, enable: muteVideo })
    this.setState({ muteVideo: !muteVideo })
  }

  switchAudioOutput = () => {
    const { loudspeaker } = this.state
    const { switchAudio } = this.props
    const output = loudspeaker ?
      QB.webrtc.AUDIO_OUTPUT.EARSPEAKER :
      QB.webrtc.AUDIO_OUTPUT.LOUDSPEAKER
    switchAudio({ output })
    this.setState({ loudspeaker: !loudspeaker })
  }

  switchCamera = () => {
    const { session, switchCamera } = this.props
    switchCamera({ sessionId: session.id })
  }

  onCallScreen = () => {
    return (
      <View style={styles.videosContainer}>
        {this.getOnCallViews()}
        {this.getOnCallButtons()}
      </View>
    )
  }

  getOnCallViews = () => {
    const { currentUser, opponentsLeftCall, session, users } = this.props
    if (session.type === QB.webrtc.RTC_SESSION_TYPE.VIDEO) {
      const opponentsIds = session
        .opponentsIds
        .concat(session.initiatorId)
        .filter(id =>
          opponentsLeftCall.indexOf(id) === -1 &&
          id !== currentUser.id
        )
      const videoStyle = opponentsIds.length > 1 ?
        { height: '50%', width: '50%' } :
        { height: '106%', width: '136%', position: 'absolute', left: -DEVICE_WIDTH * 0.18, top: -DEVICE_HEIGHT * 0.03}
      const myVideoStyle = opponentsIds.length > 2 ?
        { height: '50%', width: '50%' } :
        { height: '25%', width: '25%', position: 'absolute', bottom: 160, right: 16, borderRadius: 8 }
      return (
        <React.Fragment>
          {opponentsIds.map(userId => (
            <WebRTCView
              key={userId}
              sessionId={session.id}
              style={videoStyle}
              userId={userId}
            />
          ))}
          {
            opponentsIds.map(userId => {
              const user = users.find(user => user.id === userId)
              const username = user ?
                (user.fullName || user.login || user.email) : ''
              
              return (
              //  <Text style={{position: 'absolute', width: '100%', top: 47, left: 0, textAlign: 'center', color: 'white', fontSize: 18, lineHeight: 25,
              //  fontFamily: 'Poppins-Medium' }}>{username}</Text>
               <Text style={{position: 'absolute', width: '100%', top: 47, left: 0, textAlign: 'center', color: 'white', fontSize: 18, lineHeight: 25,
               fontFamily: 'Poppins-Medium' }}>{global.selectedRequest ? global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname: username}</Text>
              )
            })
          }
          {this.state.muteVideo ? (
            <View style={{...myVideoStyle, backgroundColor: 'black' }} />
          ) : (
            <WebRTCView
              key={currentUser.id}
              mirror
              sessionId={session.id}
              style={myVideoStyle}
              userId={currentUser.id}
            />            
          )}
        </React.Fragment>
      )
    } else {
      return this.getOnAudioCallViews()
    }
  }

  getOnAudioCallViews = () => {
    const { currentUser, peers, session, users } = this.props
    const userIds = session
      .opponentsIds
      .concat(session.initiatorId)
      .filter(userId => userId !== currentUser.id)
    return (
      <View style={styles.opponentsContainer}>
        {userIds.map(userId => {
          const user = users.find(user => user.id === userId)
          const username = user ?
            (user.fullName || user.login || user.email) :
            ''
          const backgroundColor = user && user.color ?
            user.color :
            theme.colors.primaryDisabled
          const peerState = peers[userId] || 0
          return (
            <View key={userId} style={styles.opponentView}>
              {/* {<View style={[styles.circleView, { backgroundColor }]}>
                <Text style={styles.circleText}>
                  {username.charAt(0)}
                </Text>
              </View>} */}

              <View style={styles.profileImageView} >
                <Image style={styles.profileImage} source={(global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.sender.image === '')
                ? require('../assets/images/home/iconUser.png')
                : {uri: global.selectedRequest.sender.image}
                }/>
              </View>              
              <Text style={styles.usernameText}>
                {global.selectedRequest ? global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname : username}                
              </Text>
              <Text style={styles.statusText}>
                {PeerStateText[peerState]}
              </Text>
            </View>
          )
        }
        )}
      </View>
    )
  }

  getOnCallButtons = () => {
    const { loudspeaker, muteAudio, muteVideo } = this.state
    const { session } = this.props
    return (
      <View style={styles.allButtons}>

        <TouchableOpacity style={styles.backButton} onPress={this.callLeaveHandler} >
          <Image
            style={styles.backImage}
            source={require('../assets/images/login/arrow_back.png')}
          />
        </TouchableOpacity>

        <View style={styles.buttons}>
          <View style = {styles.supportButton}>
            <TouchableOpacity onPress={this.toggleAudio} style={muteAudio ? styles.imageViewSeleted : styles.imageView} >
                <Image style={styles.supportImage} source={muteAudio ? require('../assets/images/call/icon_mute_Yellow.png') : require('../assets/images/call/icon_mute_White.png')}/>
            </TouchableOpacity>                 
          </View>

          {session.type === QB.webrtc.RTC_SESSION_TYPE.VIDEO ? (
            <View style = {styles.supportButton}>
              <TouchableOpacity onPress={this.toggleVideo} style={muteVideo ? styles.imageViewSeleted : styles.imageView} >
                  <Image style={styles.supportImage} source={muteVideo ? require('../assets/images/call/icon_video_Yellow.png') : require('../assets/images/call/icon_video_White.png')}/>
              </TouchableOpacity>                 
            </View>
          ) : null}

          {session.type === QB.webrtc.RTC_SESSION_TYPE.VIDEO ? (
            <View style = {styles.supportButton}>
              <TouchableOpacity onPress={this.switchCamera} style={styles.imageView} >
                  <Image style={{width: 62, height: 62, resizeMode: 'contain'}} source={require('../assets/images/call/icon_cameraBack.png')}/>
              </TouchableOpacity>                 
            </View>
          ) : null}

          <View style = {styles.supportButton}>
            <TouchableOpacity onPress={this.callCompletionHandler} style={{alignItems: 'center', alignContent: 'center', justifyContent: 'center'}} >
              <Image style={styles.endImage} source={require('../assets/images/call/icon_EndCall.png')} />
            </TouchableOpacity>                 
          </View>

          {session.type === QB.webrtc.RTC_SESSION_TYPE.AUDIO ? (
            <View style = {styles.supportButton}>
              <TouchableOpacity onPress={this.switchAudioOutput} style={loudspeaker ? styles.imageViewSeleted : styles.imageView} >
                  <Image style={styles.supportImage} source={loudspeaker ? require('../assets/images/call/icon_volume_Yellow.png') : require('../assets/images/call/icon_volume_White.png')}/>
              </TouchableOpacity>                 
            </View>
          ) : null}
        </View>
      </View>
    )
  }

  dialingScreen = () => {
    const { caller, session } = this.props
    if (!session) return null
    let username = ''
    if (caller) {
      username = caller.fullName || caller.login || caller.email
    }
    const circleBackground = {
      backgroundColor: caller && caller.color ?
        caller.color :
        theme.colors.primaryDisabled
    }
    return (
      <View style={{ flex: 1, width: '100%' }}>
        {this.isIncomingCall 
        ? session.type === QB.webrtc.RTC_SESSION_TYPE.AUDIO 
          ? (<View style={{ flex: 1, width: '100%' }}>
              <View style = {{...styles.logoView, backgroundColor: theme.colors.inputBar}}>
                <View style={{flex: 1}} />
                <View style={styles.profileImageView} >
                  {(global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.sender.image === '') 
                    ? <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/> 
                    : <Image style={styles.profileImage} source={{uri: global.selectedRequest.sender.image}}/>
                  }
                </View>

                <Text style={styles.melisaText}>{global.selectedRequest ? global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname: username}</Text>
                <Text style={styles.requestText}>Incoming voice call</Text>
                <View style={{flex: 1}} />
              </View>

              <View style = {{...styles.contentView, backgroundColor: 'white'}}>
                <View style={{flex: 1}}/>
                <Image style={styles.iconImage} source={require('../assets/images/call/icon_Incoming.png')} />
              </View>
            </View>) 
          : (<View style={{ flex: 1, width: '100%', backgroundColor: '#000'}}>
              <View style = {styles.logoView}>
                <View style={{flex: 1}} />
                { (global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.sender.image === '') 
                  ? <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/> 
                  : <Image style={styles.profileImage} source={{uri: global.selectedRequest.sender.image}}/>
                }

                <Text style={{...styles.melisaText, color: 'white'}}>{global.selectedRequest ? global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname : username}</Text>                
                <Text style={{...styles.requestText, color: 'white'}}>Connecting...</Text>
                <View style={{flex: 1}} />
              </View>

              <View style = {styles.contentView}>
                <View style={{flex: 1}}/>
                <Image style={styles.iconImage} source={require('../assets/images/call/icon_Incoming_White.png')} />
              </View>
            </View>)
        : session.type === QB.webrtc.RTC_SESSION_TYPE.AUDIO 
          ? (<View style={{ flex: 1, width: '100%' }}>
              <View style = {{...styles.logoView, backgroundColor: 'white'}}>
                <View style={{flex: 1}} />
                <View style={styles.profileImageView} >
                  { (global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.sender.image === '') 
                    ? <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/> 
                    : <Image style={styles.profileImage} source={{uri: global.selectedRequest.sender.image}}/>
                  }
                </View>
                <Text style={styles.melisaText}>{global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname}</Text>
                <Text style={styles.requestText}>Calling...</Text>
                <View style={{flex: 1}} />
              </View>
              <View style = {{...styles.contentView, backgroundColor: theme.colors.inputBar}}/>
            </View>) 
          : (<View style={{ flex: 1, width: '100%', backgroundColor: '#000'}}>
              <View style = {styles.logoView}>
                <View style={{flex: 1}} />
                { (global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.sender.image === '') 
                  ? <Image style={styles.profileImage} source={require('../assets/images/home/iconUser.png')}/> 
                  : <Image style={styles.profileImage} source={{uri: global.selectedRequest.sender.image}}/>
                }

                <Text style={{...styles.melisaText, color: 'white'}}>{global.selectedRequest.sender.firstname + " " + global.selectedRequest.sender.lastname}</Text>                
                <Text style={{...styles.requestText, color: 'white'}}>Calling...</Text>
                <View style={{flex: 1}} />
              </View>

              <View style = {styles.contentView}/>
            </View>)
        }

        <View style={styles.buttons}>
          <View style = {styles.supportButton}>
            <TouchableOpacity onPress={this.callCompletionHandler} style={{alignItems: 'center', alignContent: 'center', justifyContent: 'center'}} >
              <Image style={styles.endImage} source={require('../assets/images/call/icon_EndCall.png')} />
            </TouchableOpacity>                 
          </View>

          {this.isIncomingCall 
          ? (<View style = {styles.supportButton}>
              <TouchableOpacity onPress={this.acceptHandler} style={{alignItems: 'center', alignContent: 'center', justifyContent: 'center'}} >
                  <Image style={styles.endImage} source={require('../assets/images/call/icon_PhoneCall.png')}/>
              </TouchableOpacity>                 
            </View>)
          : null}
        </View>
      </View>
    )
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {this.props.onCall ? this.onCallScreen() : this.dialingScreen()}
      </SafeAreaView>
    )
  }

}

const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.darkGray,
      flex: 1,
      justifyContent: 'center',
      width: '100%',
    },

    opponentsContainer: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 100,
    },

    // opponentsContainer: {
    //   alignItems: 'center',
    //   width: '100%',
    //   height: '100%',
    //   flexDirection: 'row',
    //   flexWrap: 'wrap',
    //   justifyContent: 'center',
    //   marginTop: 60,
    // },

    videosContainer: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%',
    },
    opponentView: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      width: '50%',
    },
    circleView: {
      alignItems: 'center',
      borderRadius: 30,
      height: 60,
      justifyContent: 'center',
      marginBottom: 16,
      width: 60,
    },
    circleText: {
      color: 'white',
      fontSize: 25,
      lineHeight: 30,
      textAlign: 'center',
    },

    allButtons: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0
    },
  
    backButton: {
      width: 50,
      height: 50,
      position: 'absolute',
      left: 12,
      top: 24,
      paddingBottom: 8,
      paddingLeft: 16,
      justifyContent: 'flex-end',
    },
  
    backImage: {
      width: 12,
      height: 20.5,
    },

    buttons: {
      alignItems: 'center',      
      flexDirection: 'row',
      justifyContent: 'space-around',      
      padding: 5,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 51,
      width: '100%',
    },

    usernameText: {
      color: 'white',
      marginTop: 20,
      fontSize: 18, 
      lineHeight: 25,
      fontFamily: 'Poppins-SemiBold'
    },

    statusText: {
      color: '#b3bed4',
      fontSize: 15,
      lineHeight: 18,
      fontFamily: 'Poppins-Regular'
    },

    buttonActive: {
      backgroundColor: '#6d7c94',
    },
    buttonImageActive: {
      tintColor: theme.colors.shadow,
    },

    supportButton: {
      width: 62,
      height: 62,
    },

    imageView: {
      width: 62,
      height: 62,
      borderRadius: 31,
      alignItems: 'center',
      alignContent: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF30',
        
      shadowColor: theme.colors.shadow,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 11 },
      shadowOpacity: 1,
    },

    imageViewSeleted: {
      width: 62,
      height: 62,
      borderRadius: 31,    
      alignItems: 'center',
      alignContent: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
  
      shadowColor: theme.colors.shadow,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 11 },
      shadowOpacity: 1,
    },

    supportImage: {
      width: 33,
      height: 33,
      resizeMode: 'contain'
    },

    endImage: {    
      width: 99,
      height: 99,   
      alignSelf: 'center'  
    },

    logoView: {
      width: '100%',
      height: DEVICE_HEIGHT * 0.55,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'flex-start',      
    },
  
    profileImageView :{
      width: DEVICE_WIDTH - 180,
      width: DEVICE_WIDTH - 180,
  
      shadowColor: theme.colors.shadow,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 11 },
      shadowOpacity: 1,
    },
  
    profileImage: {
      width: DEVICE_WIDTH - 180,
      height: DEVICE_WIDTH - 180,
      borderRadius: (DEVICE_WIDTH - 180) / 2,
      borderWidth: 3,
      borderColor: '#fff',
  
      shadowColor: theme.colors.shadow,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 11 },
      shadowOpacity: 1,
    },
  
    melisaText: {
      width: 280,
      marginTop: 15,
      textAlign: 'center',
      fontSize: 20,
      lineHeight: 30,
      fontFamily: 'Poppins-SemiBold',       
    },
  
    requestText: {
      width: DEVICE_WIDTH - 54,
      marginTop: 3,
      textAlign: 'center',
      fontSize: 16,
      lineHeight: 21,
      fontFamily: 'Poppins-Regular',     
    },
    
    contentView: {
      width: DEVICE_WIDTH,
      flex: 1,
      marginBottom: 0, 
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'flex-start',
      
    },

    iconImage: {    
      width: 34,
      height: 68,    
      marginBottom: 136 
    },

    logoImage: {
      width: DEVICE_WIDTH - 120,
      height: DEVICE_WIDTH - 120,
      resizeMode: 'contain',
    },

  })



const getUserFromSessionInitiator = (session, currentUser, users = []) => {
  if (!session) return
  if (session.initiatorId === currentUser.id) return currentUser
  return users.find(user => user.id === session.initiatorId)
}

const mapStateToProps = ({ auth, users, webrtc }) => ({
  caller: getUserFromSessionInitiator(webrtc.session, auth.user, users.users),
  currentUser: auth.user,
  onCall: webrtc.onCall,
  opponentsLeftCall: webrtc.opponentsLeftCall,
  peers: webrtc.peers,
  session: webrtc.session,
  users: users.users,
})

const mapDispatchToProps = {
  accept: webrtcAccept,
  getUsers: usersGet,
  hangUp: webrtcHangUp,
  reject: webrtcReject,
  switchAudio: webrtcSwitchAudioOutput,
  switchCamera: webrtcSwitchCamera,
  toggleAudio: webrtcToggleAudio,
  toggleVideo: webrtcToggleVideo,
}

export default connect(mapStateToProps, mapDispatchToProps)(CallScreen)