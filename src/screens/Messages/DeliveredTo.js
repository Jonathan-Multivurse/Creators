import { connect } from 'react-redux'

import React from 'react'
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView
} from 'react-native'
import QB from 'quickblox-react-native-sdk'

import User from './User'
import { theme } from '../../core/theme'
import { usersGet } from '../../actionCreators'

class DeliveredTo extends React.PureComponent {

  static navigationOptions = ({ navigation }) => {
    const message = navigation.getParam('message', { })
    const { deliveredIds = [] } = message
    return {
      headerTitle: (
        <View style={styles.titleView}>
          <Text style={styles.titleText}>Message delivered to</Text>
          <Text style={styles.titleSmallText}>
            {deliveredIds.length} members
          </Text>
        </View>
      ),
      headerRight: (
        <View style={{ width: 50 }} />
      )
    }
  }

  componentDidMount() {
    const { message, getUsers, users } = this.props
    const { deliveredIds = [] } = message
    const loadUsers = []
    deliveredIds.forEach(userId => {
      const index = users.findIndex(user => user.id === userId)
      if (index === -1) {
        loadUsers.push(userId)
      }
    })
    if (loadUsers.length) {
      getUsers({
        append: true,
        filter: {
          field: QB.users.USERS_FILTER.FIELD.ID,
          type: QB.users.USERS_FILTER.TYPE.NUMBER,
          operator: QB.users.USERS_FILTER.OPERATOR.IN,
          value: loadUsers.join()
        }
      })
    }
  }

  renderUser = ({ item }) => <User user={item} />

  render() {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={this.props.data}
          keyExtractor={({ id }) => `${id}`}
          renderItem={this.renderUser}
          renderToHardwareTextureAndroid={Platform.OS === 'android'}
          style={styles.list}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: theme.colors.inputBar,
    height: '100%',
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

const mapStateToProps = ({ users }, { navigation }) => {
  const message = navigation.getParam('message')
  const { deliveredIds = [] } = message
  const data = users.users.filter(user =>
    deliveredIds.indexOf(user.id) > -1
  )
  return {
    data,
    message,
    users: users.users,
  }
}

const mapDispatchToProps = { getUsers: usersGet }

export default connect(mapStateToProps, mapDispatchToProps)(DeliveredTo)