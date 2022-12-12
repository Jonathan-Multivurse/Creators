import React from 'react'
import { Text, TouchableWithoutFeedback, View, StyleSheet } from 'react-native'
import { theme } from '../../../core/theme'
import RemoteImage from './RemoteImage'
import RemoteVideo from './RemoteVideo'

export default class MessageBody extends React.Component {

  shouldComponentUpdate(nextProps) {
    const { imageUrl } = this.props
    return imageUrl !== nextProps.imageUrl
  }

  getForwardedText = () => {
    const {
      image = false,
      message: { properties },
      messageIsMine = false,
      video = false,
    } = this.props

    const forwarded = (
      properties &&
      properties.originDialogName &&
      properties.originDialogName.length
    )
    if (!forwarded) {
      return null
    }

    let forwardedTextStyle
    let forwardedBoldTextStyle
    
    if (messageIsMine) {
      if (image || video) {
        forwardedTextStyle = styles.messageForwardedWithAttachmentText
        forwardedBoldTextStyle = styles.messageForwardedBoldText
      } else {
        forwardedTextStyle = styles.myMessageForwardedText
        forwardedBoldTextStyle = styles.myMessageForwardedBoldText
      }
    } else {
      if (image || video) {
        forwardedTextStyle = styles.messageForwardedWithAttachmentText
      } else {
        forwardedTextStyle = styles.messageForwardedText
      }
      forwardedBoldTextStyle = styles.messageForwardedBoldText
    }

    return (
      <View pointerEvents="none">
        <Text numberOfLines={1} style={forwardedTextStyle}>
          Forwarded from&nbsp;
          <Text style={forwardedBoldTextStyle}>
            {properties.originDialogName}
          </Text>
        </Text>
      </View>
    )
  }

  render() {
    const {
      image = false,
      imageUrl,
      message: { body },
      messageIsMine = false,
      onLongPress,
      video = false,
    } = this.props

    const withMediaAttachment = image || video

    const _styles = messageIsMine ? {
      bodyView: withMediaAttachment ?
        styles.myMessageBodyMedia :
        styles.myMessageBodyView,
      text: styles.myMessageBodyText
    } : {
      bodyView: withMediaAttachment ?
        styles.messageBodyMedia :
        styles.messageBodyView,
      text: styles.messageBodyText
    }

    const Content = () => {
      if (image) {
        return (
          <RemoteImage
            onLongPress={onLongPress}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.attachment}
          />
        )
      } else if (video) {
        return (
          <RemoteVideo
            onLongPress={onLongPress}
            resizeMode="cover"
            source={{ uri: imageUrl }}
            style={styles.attachment}
          />
        )
      } else {
        return (
          <View pointerEvents="none">
            <Text style={_styles.text}>
              {body}
            </Text>
          </View>
        )
      }
    }

    const ForwardedText = this.getForwardedText
    return (
      <TouchableWithoutFeedback
        onLongPress={withMediaAttachment ? null : onLongPress}
      >
        <View style={_styles.bodyView}>
          <ForwardedText />
          <Content />
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const styles = StyleSheet.create({

  messageBodyView: {
    backgroundColor: theme.colors.messageBack,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
    flex: 1,
    paddingVertical: 6,

    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 11, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
  },

  myMessageBodyView: {
    backgroundColor: theme.colors.myMessageback,
    borderWidth: 2,
    borderColor: '#E6F8FF',
    elevation: 2,
    flex: 1,
    paddingVertical: 6,

    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 11, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
  },

  messageBodyMedia: {
    overflow: 'hidden',
    minHeight: 250,
    width: 250,

    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 25,

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 11, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,   
  },

  myMessageBodyMedia: {
    overflow: 'hidden',
    minHeight: 250,
    width: 250,

    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 0,

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 11, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,   
  },

  attachment: {
    height: 250,
    width: 250,
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
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular', 
    paddingVertical: 6,
    paddingHorizontal: 15,
  },

  myMessageBodyText: {
    color: theme.colors.black,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular', 
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
})