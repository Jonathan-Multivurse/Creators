import { connect } from 'react-redux'
import React from 'react'
import { Image, Text, View, StyleSheet } from 'react-native'
import moment from 'moment'
import QB from 'quickblox-react-native-sdk'
import { theme } from '../../../core/theme'

import { usersGet } from '../../../actionCreators'

class MessageMeta extends React.PureComponent {

  componentDidMount() {
    const { getUsers, message, sender } = this.props
    if (!sender && getUsers) {
      getUsers({
        append: true,
        filter: {
          field: QB.users.USERS_FILTER.FIELD.ID,
          type: QB.users.USERS_FILTER.TYPE.NUMBER,
          operator: QB.users.USERS_FILTER.OPERATOR.EQ,
          value: `${message.senderId}`
        }
      })
    }
  }

  getSentAt = () => {
    const { message: { dateSent } } = this.props
    const date = new Date(dateSent)
    const minutes = date.getMinutes()
    const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString()
    // return `${date.getHours()}:${minutesString}`
    return moment(date).format('h:mm A')
  }

  getSentBy = () => {
    const { message, messageIsMine = false, sender } = this.props
    if (messageIsMine) {
      return ''
    } else {
      return sender ?
        (sender.fullName.split(" ")[0] || sender.login || sender.email) : message.senderId.toString()
    }
  }

  getCheckMarks = () => {
    const { delivered, messageIsMine = false, read } = this.props
    const checkmarkStyle = read ? styles.checkmarkRead : styles.checkmark
    if (messageIsMine) {
      return delivered ? (
        <Image source={require('../../../assets/images/message/check_double.png')} style={checkmarkStyle} />
      ) : (
        <Image source={require('../../../assets/images/message/check.png')} style={checkmarkStyle} />
      )
    } else {
      return null
    }
  }

  render() {
    const { withMediaAttachment = false, messageIsMine = false, } = this.props
    // const metaViewStyle = withMediaAttachment ?
    //   styles.mediaMessageMeta :
    //   messageIsMine ? styles.mymessageMeta : styles.messageMeta

    const metaViewStyle = messageIsMine ? styles.mymessageMeta : styles.messageMeta
      
    return (
      <View style={metaViewStyle}>
        <Text numberOfLines={1} style={styles.messageSender}>
          {this.getSentBy()}
        </Text>
        {/* <View style={{ flex: 1 }} /> */}
        {this.getCheckMarks()}
        <Text style={styles.messageSentAt}>
          {this.getSentAt()}
        </Text>
      </View>
    )
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
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingLeft: 3,
    paddingRight: 25,
  },

  mymessageMeta: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    paddingTop: 10,
    paddingLeft: 25,
    paddingRight: 3,
  },

  mediaMessageMeta: {
    flexDirection: 'row',
    paddingBottom: 5,
    paddingHorizontal: 6,

    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingLeft: 25,
    paddingRight: 3,
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
})

const mapStateToProps = ({ auth, users }, { message = {} }) => {
  const sender = users.users.find(user => user.id === message.senderId)
  const currentUser = auth.user || {}
  let delivered = false
  let read = false
  if (message.senderId === currentUser.id) {
    const { deliveredIds = [], readIds = [], recipientId } = message
    if (recipientId && recipientId !== currentUser.id) {
      delivered = deliveredIds.indexOf(recipientId) > -1
      read = readIds.indexOf(recipientId) > -1
    } else {
      delivered = deliveredIds
        .filter(id => id !== currentUser.id)
        .length > 0
      read = readIds
        .filter(id => id !== currentUser.id)
        .length > 0
    }
  }
  return {
    delivered,
    read,
    sender,
  }
}

const mapDispatchToProps = { getUsers: usersGet }

export default connect(mapStateToProps, mapDispatchToProps)(MessageMeta)