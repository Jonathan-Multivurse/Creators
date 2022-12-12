import React from 'react'
import { Text, View, StyleSheet, Image, TouchableWithoutFeedback, Dimensions } from 'react-native'
import { theme } from '../core/theme'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class SupportItem extends React.PureComponent {
  constructor(props) {
    super(props)   
  }

  render() {
    const {support, status} = this.props

    return (
      <TouchableWithoutFeedback style={styles.cellView} onPress={() => this.props.onSelectRow(support)}>
        <View style={styles.cellContentView}>     
          <View style = {styles.imageView}>
            { support.sender.image 
              ? <Image source={{uri : support.sender.image}} style={styles.profileImage}/>
              : <Image source={require('../assets/images/home/iconUser.png')} style={styles.profileImage} />               
            } 
          </View>

          <View style={styles.contentView}>
            <View style={styles.nameView}>
              <Text style={styles.nameText}>{support.sender.firstname + " " + support.sender.lastname}</Text>
              <View  style={{flex: 1}}/>                      
              <Text style={styles.timeText}>
                {support.isSchedule === true 
                ? '' 
                : support.status == "completed" 
                ?  moment(support.time).format('MMM D, YYYY') 
                : moment(support.time).format('h:mm A')}
              </Text>
            </View>    

            <View style={styles.sessionView}>
              <Image style={styles.callImage} source={ support.type == 'Call' 
                ? require('../assets/images/home/iconVoice.png') 
                : support.type == 'Video' 
                ? require('../assets/images/home/iconVideo.png') 
                : require('../assets/images/home/iconChat.png')}  
              />
              <Text style={styles.contentText}>{support.isSchedule === true 
                ? "At " + moment(support.scheduleTime).format('h:mm A on MMM D, YYYY.') 
                : support.status == "completed" 
                ? 'Session closed' 
                : 'Active'}
              </Text>
            </View>
            
            <View style={{flex:1}} />

          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }

}

const styles = StyleSheet.create({
  cellView: {
    width: DEVICE_WIDTH,
    height: 76,
  },

  cellContentView: {    
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 14,
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar,
  },

  contentView: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    marginTop: 12,
    justifyContent: 'flex-start',
  },

  nameView: {
    marginLeft: 1,
    flexDirection: 'row',
  },

  imageView: {
    width: 52,
    height: 52,
    marginLeft: 12,
    marginTop:7,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: '#fff',
    borderWidth: 2,
  },

  iconImage: {
    width: 20,
    height: 20,
    position: 'absolute',
    right: 0,
    bottom: -2,
  },

  nameText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },

  timeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader,    
  },

  sessionView: {
    flexDirection: 'row'
  },

  callImage: {
    width: 26,
    height: 26,        
    
    marginRight: 8,
  },

  contentText: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',
    color: theme.colors.sectionHeader,    
  },
}) 