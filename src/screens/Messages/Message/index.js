import { connect } from 'react-redux'
import React from 'react'
import { Text, View, StyleSheet, Image } from 'react-native'
import QB from 'quickblox-react-native-sdk'

// import LongPressMenu from './LongPressMenu'
import MessageBody from './MessageBody'
import MessageMeta from './MessageMeta'
import { theme } from '../../../core/theme'

import { privateUrlGet } from '../../../actionCreators'

class Message extends React.PureComponent {

  hasImageAttachment = false
  hasVideoAttachment = false

  constructor(props) {
    super(props)
    const { attachments } = props.message
    if (Array.isArray(attachments) && attachments.length) {
      const [attachment] = attachments
      if (attachment.type && attachment.type.indexOf('image') > -1) {
        this.hasImageAttachment = true
      }
      if (attachment.type && attachment.type.indexOf('video') > -1) {
        this.hasVideoAttachment = true
      }
    }
  }

  componentDidMount() {
    const {
      getPrivateUrl,
      imageUrl,
      message,
    } = this.props
    if ((this.hasImageAttachment || this.hasVideoAttachment) && !imageUrl) {
      const { attachments } = message
      const [attachment] = attachments
      getPrivateUrl(attachment.id)
    }
  }

  onForwardPress = () => {
    const { message, onForwardPress } = this.props
    if (onForwardPress) {
      onForwardPress(message)
    }
  }

  onDeliveredPress = () => {
    const { message, showDelivered } = this.props
    if (showDelivered) {
      showDelivered(message)
    }
  }

  onViewedPress = () => {
    const { message, showViewed } = this.props
    if (showViewed) {
      showViewed(message)
    }
  }

  getDialogCircle = () => {
    const { dialogType, message, sender } = this.props
    const sentBy = sender ?
      (sender.fullName || sender.login || sender.email) : message.senderId.toString()
    // const circleBackground = sender ? sender.color : theme.colors.primaryDisabled
    // const circleText = sentBy
    //   .split(' ')
    //   .filter((str, i) => i < 2 ? str : undefined)
    //   .reduce((res, val) => res + val.trim().charAt(0).toUpperCase(), '')
    // return dialogType === QB.chat.DIALOG_TYPE.CHAT ? null : (
    //   <View style={[
    //     styles.senderCircleView,
    //     { backgroundColor: circleBackground }
    //   ]}>
    //     <Text numberOfLines={1} style={styles.senderCircleText}>
    //       {circleText}
    //     </Text>
    //   </View>
    // )
    var tmpUsers = []
    if (global.selectedRequest){
      if (global.selectedRequest.receiver &&  global.selectedRequest.receiver != ''){
        tmpUsers.push(global.selectedRequest.receiver)
      }
      if (global.selectedRequest.otherReceivers){
        global.selectedRequest.otherReceivers.forEach(user => {
          tmpUsers.push(user)          
        });
      }
    }

    var url = ''
    if (message.senderId == global.selectedRequest.sender.QBId) {
      if (global.selectedRequest.sender.image){
        url = global.selectedRequest.sender.image
      } 
    } else {
      console.log("message sender ID  ====>",  message.senderId)
      var filterUser = tmpUsers.filter((item) => (item.QBId === message.senderId));
      if (filterUser.length > 0){
        url = filterUser[0].image
      } 
    }    

    return (
      <View style={styles.profileImageView} >
        { url === '' ? (<Image style={styles.profileImage} source={require('../../../assets/images/home/iconUser.png')}/>) :(<Image style={styles.profileImage} source={{uri: url}}/> ) }                  
      </View>
    )
  }

  getMyDialogCircle = () => {
    return (
      <View style={{...styles.profileImageView, marginLeft: 8, marginRight: 0}} >
        <Image style={styles.profileImage} source={{uri: global.curUser.image}}/>                  
      </View>
    )
  }

  

  getSentAt = () => {
    const { message: { dateSent } } = this.props
    const date = new Date(dateSent)
    const minutes = date.getMinutes()
    const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString()
    return `${date.getHours()}:${minutesString}`
  }

  getMessage = () => {
    const { dialogType, imageUrl, message } = this.props
    const withMediaAttachment = (
      this.hasImageAttachment ||
      this.hasVideoAttachment
    )
    return (
      <View style={styles.messageView}>
        {this.getDialogCircle()}
        <View style={styles.messageContent}>          
          {/* <LongPressMenu
            dialogType={dialogType}
            onDeliveredPress={this.onDeliveredPress}
            onForwardPress={this.onForwardPress}
            onViewedPress={this.onViewedPress}
            stickToLeft={true}
          > */}
            <MessageBody
              dialogType={dialogType}
              image={this.hasImageAttachment}
              imageUrl={imageUrl}
              message={message}
              video={this.hasVideoAttachment}
            />
          {/* </LongPressMenu> */}
          <MessageMeta
            message={message}
            withMediaAttachment={withMediaAttachment}
          />
        </View>
      </View>
    )
  }

  getMyMessage = () => {
    const { dialogType, imageUrl, message } = this.props
    const withMediaAttachment = (
      this.hasImageAttachment ||
      this.hasVideoAttachment
    )
    return (
      <View style={styles.myMessageView}>
        <View style={styles.messageContent}>          
          {/* <LongPressMenu
            dialogType={dialogType}
            onDeliveredPress={this.onDeliveredPress}
            onForwardPress={this.onForwardPress}
            onViewedPress={this.onViewedPress}
            stickToLeft={false}
          > */}
            <MessageBody
              dialogType={dialogType}
              image={this.hasImageAttachment}
              imageUrl={imageUrl}
              message={message}
              messageIsMine={true}
              video={this.hasVideoAttachment}
            />
          {/* </LongPressMenu> */}
          <MessageMeta
            message={message}
            messageIsMine={true}
            withMediaAttachment={withMediaAttachment}
          />
          {withMediaAttachment ? null : null}
        </View>
        {this.getMyDialogCircle()}
      </View>
    )
  }

  render() {
    const { currentUser, imageUrl, message } = this.props
    const { body, properties = {} } = message
    
    if ((this.hasImageAttachment || this.hasVideoAttachment) && !imageUrl) {
      return null
    }
    if (['1', '2', '3'].indexOf(properties.notification_type) > -1) {
      console.log("message ====>", message)
      console.log("properties ====>", properties)

      return (
        <View style={styles.messageView}>
          <View style={styles.systemMessage}>
            <Text style={[styles.messageSentAt, { textAlign: 'center' }]}>
              {body}
            </Text>
          </View>
        </View>
      )
    }
    if (currentUser && message.senderId === currentUser.id) {
      return this.getMyMessage()
    }
    return this.getMessage()
  }
}

const styles = StyleSheet.create({
  rootView: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  messagesList: {
    width: '100%',
  },
  sectionHeaderView: {
    alignItems: 'center',
    backgroundColor: theme.colors.transparent,
    justifyContent: 'center',
  },
  sectionHeaderTextView: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gray,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 5,
    marginTop: 5,
    padding: 5,
  },
  sectionHeaderText: {
    color: theme.colors.white,
    fontSize: 12,
    textAlign: 'center',
  },
  messageView: {
    flexDirection: 'row',
    marginVertical: 10,
    justifyContent: 'flex-start',
  },
  myMessageView: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginVertical: 10,
  },

  messageContent: {
    maxWidth: '80%',
  },

  senderCircleView: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 15,
    width: 40,
  },
  senderCircleText: {
    color: theme.colors.white,
    fontSize: 17,
    lineHeight: 20,
    textAlign: 'center',
  },
  systemMessage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  messageBodyView: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    elevation: 2,
    flex: 1,
    paddingVertical: 6,
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
  },
  myMessageBodyView: {
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flex: 1,
    paddingVertical: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 4,
  },
  messageMeta: {
    flexDirection: 'row',
    paddingBottom: 5,
    paddingHorizontal: 15,
  },
  mediaMessageMeta: {
    flexDirection: 'row',
    paddingBottom: 5,
    paddingHorizontal: 6,
  },
  messageSender: {
    color: theme.colors.gray,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 15,
    maxWidth: '85%',
    paddingRight: 6,
  },
  messageSentAt: {
    color: theme.colors.gray,
    fontSize: 13,
    lineHeight: 15,
    paddingLeft: 6,
  },
  messageForwardedText: {
    color: '#687a97',
    fontSize: 13,
    lineHeight: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  messageForwardedBoldText: {
    color: '#687a97',
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 15,
  },
  messageForwardedWithAttachmentText: {
    color: '#687a97',
    fontSize: 13,
    lineHeight: 15,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  myMessageForwardedText: {
    color: theme.colors.white,
    fontSize: 13,
    lineHeight: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  myMessageForwardedBoldText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 15,
  },
  messageBodyText: {
    color: theme.colors.black,
    fontSize: 15,
    lineHeight: 18,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  myMessageBodyText: {
    color: theme.colors.white,
    fontSize: 15,
    lineHeight: 18,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  messageBodyMedia: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 250,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
    width: 250,
  },
  myMessageBodyMedia: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 250,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
    width: 250,
  },
  attachment: {
    height: 250,
    width: 250,
  },
  shadowImg: {
    alignSelf: 'center',
    bottom: -15,
    maxHeight: 40,
    position: 'absolute',
    width: '100%',
    zIndex: -1,
  },
  checkmark: {
    height: 15,
    resizeMode: 'contain',
  },
  checkmarkRead: {
    height: 15,
    resizeMode: 'contain',
    tintColor: theme.colors.primary,
  },

  profileImageView :{
    width: 44,
    width: 44,
    borderRadius: 22,
    marginRight: 8,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 44 / 2,
    borderWidth: 2,
    borderColor: '#fff', 
  },
})

const getAttachmentUrl = (filesMap, message) => {
  const { attachments } = message
  if (Array.isArray(attachments) && attachments.length) {
    const [attachment] = attachments
    return filesMap[attachment.id]
  }
  return undefined
}

const mapStateToProps = ({ auth, content }, { message = {} }) => {
  return {
    currentUser: auth.user,
    imageUrl: getAttachmentUrl(content, message),
  }
}

const mapDispatchToProps = { getPrivateUrl: privateUrlGet }

export default connect(mapStateToProps, mapDispatchToProps)(Message)