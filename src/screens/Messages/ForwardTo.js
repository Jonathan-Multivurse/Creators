import { connect } from 'react-redux'

import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native'

import { theme } from '../../core/theme'

import { dialogSelectReset, messageSend } from '../../actionCreators'

class ForwardTo extends React.Component {

  static navigationOptions = ({ navigation }) => {
    const selected = navigation.getParam('selected', [])
    const sendHandler = navigation.getParam('submit')
    return {
      headerTitle: (
        <View style={styles.titleView}>
          <Text style={styles.titleText}>Forward to</Text>
          <Text style={styles.titleSmallText}>
            {selected.length} chat(s)
          </Text>
        </View>
      ),
      headerRight: (
        <TouchableOpacity
          disabled={selected.length === 0}
          onPress={sendHandler}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            Send
          </Text>
        </TouchableOpacity>
      )
    }
  }

  componentDidMount() {
    const { navigation, selected } = this.props
    navigation.setParams({
      selected,
      submit: this.forwardMessage
    })
  }

  shouldComponentUpdate(nextProps) {
    const { loading, navigation, selected } = this.props
    if (selected.length !== nextProps.selected.length) {
      navigation.setParams({ selected: nextProps.selected })
    }
    return loading !== nextProps.loading
  }

  forwardMessage = () => {
    const { dialogs, navigation, selected, sendMessage } = this.props
    const message = navigation.getParam('message')
    if (!message) {
      return navigation.goBack()
    }
    const { attachments, body } = message
    const originDialog = dialogs.find(dialog => dialog.id === message.dialogId)
    const promises = selected.map(dialogId => new Promise((resolve, reject) =>
      sendMessage({
        attachments,
        body,
        dialogId,
        properties: {
          originDialogId: message.dialogId,
          originDialogName: originDialog ? originDialog.name : '',
        },
        resolve,
        reject,
      })
    ))
    Promise.all(promises).then(() => navigation.goBack())
  }

  componentWillUnmount() {
    this.props.cancel && this.props.cancel()
  }

  render() {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentView}>
          {/* <DialogsList selectable /> */}
        </View>
      </SafeAreaView>
    )
  }

}

const styles = StyleSheet.create({
  contentView: {
    flex: 1,
    backgroundColor: theme.colors.inputBar,
    width: '100%',
  },

  safeArea: {
    backgroundColor: theme.colors.primary,
    flex: 1,
    width: '100%',
  },
  titleView: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  titleSmallText: {
    color: theme.colors.white,
    fontSize: 13,
    lineHeight: 15,
    opacity: 0.6,
  },
  headerButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerButtonText: {
    color: theme.colors.white,
    fontSize: 17,
    lineHeight: 20,
  },
})

const mapStateToProps = ({ dialogs }) => ({
  dialogs: dialogs.dialogs,
  loading: dialogs.loading,
  selected: dialogs.selected,
})

const mapDispatchToProps = {
  cancel: dialogSelectReset,
  sendMessage: messageSend,
}

export default connect(mapStateToProps, mapDispatchToProps)(ForwardTo)