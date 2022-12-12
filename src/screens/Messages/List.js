import { connect } from 'react-redux'

import React from 'react'
import {
  ActivityIndicator,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image
} from 'react-native'
import moment from 'moment'
import Message from './Message'
import TypingIndicator from './TypingIndicator'
import Navigation from '../../NavigationService'
import { theme } from '../../core/theme'

import { messageMarkRead, messagesGet } from '../../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

class MessagesList extends React.PureComponent {

  viewabilityConfig = {
    minimumViewTime: 600,
    itemVisiblePercentThreshold: 100,
  }
  PAGE = 0
  PER_PAGE = 30

  componentDidMount() {
    const { dialogId, getMessages } = this.props
    if (dialogId && getMessages) {
      getMessages({
        dialogId,
        limit: this.PER_PAGE,
        skip: this.PAGE * this.PER_PAGE,
      })
    }
  }

  loadMore = () => {
    const { hasMore, dialogId, getMessages, loading } = this.props
    if (loading || !hasMore) {
      return
    }
    this.PAGE += 1
    getMessages({
      dialogId,
      limit: this.PER_PAGE,
      skip: this.PAGE * this.PER_PAGE,
    })
  }

  forwardTo = message => Navigation.navigate({
    key: message.id,
    params: { message },
    routeName: 'ForwardTo',
  })

  showDelivered = message => Navigation.navigate({
    key: message.id,
    params: { message },
    routeName: 'DeliveredTo',
  })

  showViewed = message => Navigation.navigate({
    key: message.id,
    params: { message },
    routeName: 'ViewedBy',
  })

  renderLoadingIndicator = () => this.props.loading ? (
    <ActivityIndicator
      color={theme.colors.primary}
      size={30}
      style={{ padding: 10 }}
    />
  ) : null

  getDateString = date => {
    const now = new Date()
    if (date.getFullYear() === now.getFullYear()) {
      if (date.getMonth() === now.getMonth()) {
        if (date.getDate() === now.getDate()) {
          return 'Today'
        }
        if (date.getDate() === now.getDate() - 1) {
          return 'Yesterday'
        }
      }
      // return date.toDateString().replace(/(^\w+\s)|(\s\d+$)/g, '')
      return moment(date).format('MMM D, yyyy')
    } else {
      // return date.toDateString().replace(/(^\w+\s)/, '')
      return moment(date).format('MMM D, yyyy')
    }
  }

  listEmptyComponent = () => this.props.loading ? null : (
    <View style = {styles.logoView}>     
      <View style={styles.simulatorView}>
        <Text style={styles.simulText}>Facility :   </Text>
        <Text style={styles.simulatorText}>{(global.selectedRequest === null || global.selectedRequest === undefined || !global.selectedRequest.facility ) ? '' : global.selectedRequest.facility}</Text>      
      </View>       

      <View style={styles.simulatorView}>
        <Text style={styles.simulText}>Simulator :   </Text>
        <Text style={styles.simulatorText}>{(global.selectedRequest === null || global.selectedRequest === undefined ) ? '' : global.selectedRequest.simulator}</Text>      
      </View>

      <View style={styles.simulatorView}>
        <Text style={styles.simulText}>Date & Time :   </Text>
        <Text style={styles.simulatorText}>{(global.selectedRequest === null || global.selectedRequest === undefined ) ? '' : moment(global.selectedRequest.time).format('DD-MM-yyyy HH:MM A')}</Text>      
      </View>

      <View style={styles.simulatorView}>
        <Text style={styles.simulText}>Description :   </Text>
        <Text style={styles.simulatorText}>{(global.selectedRequest === null || global.selectedRequest === undefined ) ? '' : global.selectedRequest.description}</Text>  
      </View>

      <View style={{flex: 1}} />
    </View> 
  )

  renderMessage = ({ item }) => (
    <Message
      dialogType={this.props.dialogType}
      message={item}
      // onForwardPress={this.forwardTo}
      // showDelivered={this.showDelivered}
      // showViewed={this.showViewed}
      onForwardPress={() => {}}
      showDelivered={() => {}}
      showViewed={() => {}}
    />
  )

  renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeaderView}>
      <View style={styles.sectionHeaderTextView}>
        <Text style={styles.sectionHeaderText}>
          {this.getDateString(section.title)}
        </Text>
      </View>
    </View>
  )

  viewableItemsChanged = ({ viewableItems }) => {
    const { currentUser, markAsRead } = this.props
    viewableItems
      .filter(item => item.index !== null)
      .forEach(({ isViewable, item: message }) => {
        const { readIds = [] } = message
        const shouldMarkAsRead = (
          isViewable &&
          readIds.indexOf(currentUser.id) === -1
        )
        if (shouldMarkAsRead) {
          markAsRead(message)
        }
      })
  }

  render() {
    const { dialogId, hasMore, sections } = this.props
    return (
      <SectionList
        inverted={true}
        keyExtractor={({ id }) => id}
        // ListEmptyComponent={this.listEmptyComponent}
        ListFooterComponent={
          // this.renderLoadingIndicator
          this.listEmptyComponent
        }
        ListHeaderComponent={
          <TypingIndicator dialogId={dialogId} style={{ padding: 10 }} />
        }
        onEndReached={hasMore ? this.loadMore : undefined}
        onEndReachedThreshold={1}
        onViewableItemsChanged={this.viewableItemsChanged}
        renderItem={this.renderMessage}
        renderSectionFooter={this.renderSectionHeader}
        renderToHardwareTextureAndroid={Platform.OS === 'android'}
        sections={sections}
        style={styles.messagesList}
        viewabilityConfig={this.viewabilityConfig}
      />
    )
  }
}

const styles = StyleSheet.create({
  messagesList: {
    backgroundColor: theme.colors.inputBar,
    paddingHorizontal: 10,
    marginVertical: 1,
    width: '100%',
  },

  sectionHeaderView: {
    alignItems: 'center',
    backgroundColor: theme.colors.transparent,
    justifyContent: 'center',
  },

  sectionHeaderTextView: {
    alignItems: 'center',
    backgroundColor: theme.colors.greyedBlue,
    borderRadius: 11,
    height: 20,
    justifyContent: 'center',
    marginBottom: 5,
    marginTop: 5,
    paddingHorizontal: 10,
  },

  sectionHeaderText: {
    color: theme.colors.gray,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },

  noMessagesView: {
    alignSelf: 'center',
    height: '100%',
    transform: [{ scaleY: -1 }]
  },

  noMessagesText: {
    color: theme.colors.label,
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
  },

  logoView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.inputBar,

    // transform: [{ scaleY: -1 }]
  },

  profileImageView :{
    marginTop: 74,
    width: DEVICE_WIDTH - 160,
    width: DEVICE_WIDTH - 160,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  logoImage: {
    width: DEVICE_WIDTH - 160,
    height: DEVICE_WIDTH - 160,
    resizeMode: 'contain',
  },

  yourText: {
    width: 320,
    marginTop: 24,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Medium',       
  },

  youText: {
    width: DEVICE_WIDTH - 40,
    marginTop: 14,
    marginBottom: 18,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',      
    color: theme.colors.sectionText 
  },

  simulatorView: {
    width: DEVICE_WIDTH - 48,
    marginTop: 12,
    marginBottom: 12,
    flexDirection: 'row',   
  },

  simulText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',      
    color: theme.colors.sectionText 
  },

  simulatorText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',      
  },
})

const mapMessagesToSections = (messages = []) => messages
  .sort((a, b) => +b.dateSent - +a.dateSent)
  .reduce((acc, message) => {
    const date = new Date(message.dateSent)
    const section = acc.find(({ title }) => (
      title.getDate() === date.getDate() &&
      title.getMonth() === date.getMonth() &&
      title.getFullYear() === date.getFullYear()
    ))
    if (section) {
      section.data.push(message)
    } else {
      acc.push({
        title: date, data: [message]
      })
    }
    return acc
  }, [])


const mapStateToProps = ({ auth, dialogs, messages }, { dialogId }) => {
  const dialog = dialogs.dialogs.find(d => d.id === dialogId) || {}
  const { type } = dialog
  const { loading, messages: data } = messages
  const messagesData = data[dialogId]
  return {
    currentUser: auth.user,
    dialogType: type,
    hasMore: messagesData ? messagesData.hasMore : false,
    loading,
    sections: mapMessagesToSections(messagesData),
  }
}

const mapDispatchToProps = {
  getMessages: messagesGet,
  markAsRead: messageMarkRead,
}

export default connect(mapStateToProps, mapDispatchToProps)(MessagesList)