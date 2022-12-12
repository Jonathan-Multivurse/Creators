import { NativeEventEmitter } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, cancelled, put, select, spawn, take } from 'redux-saga/effects'
import QB from 'quickblox-react-native-sdk'

import { 
  webrtcReject, 
  webrtcHangUp, 
  dialogEditSuccess,
  dialogUnreadCountIncrement,
  messageMarkDelivered,
  dialogGet, } from '../actionCreators'
import Navigation from '../NavigationService'
import NavigationService from '../NavigationService'

function* handleCallEvent(event) {
  const { session, user } = yield select(({ auth, webrtc }) => ({
    session: webrtc.session,
    user: auth.user
  }))
  if (session && session.id !== event.payload.session.id) {
    const username = user ?
      (user.fullName || user.login || user.email) :
      'User'
    yield put(webrtcReject({
      sessionId: event.payload.session.id,
      userInfo: { reason: `${username} is busy` }
    }))
  } else {
    yield put(event)
    console.log('222222222')
    NavigationService.navigate('CallScreen', {})
  }
}

function* handleHangUpEvent(event) {
  const { currentSession, peers } = yield select(({ webrtc }) => ({
    currentSession: webrtc.session,
    peers: webrtc.peers,
  }))
  yield put(event)
  if (currentSession && currentSession.id === event.payload.session.id) {
    const { session, userId } = event.payload
    if (session.state < QB.webrtc.RTC_SESSION_STATE.CONNECTED &&
        userId === session.initiatorId) {
      yield put(webrtcReject({ sessionId: session.id }))
    }
    if (session.state === QB.webrtc.RTC_SESSION_STATE.CONNECTED) {
      const haveActivePeers = Object.keys(peers).some(peerId => {
        const peerState = peers[peerId]
        return peerState === QB.webrtc.RTC_PEER_CONNECTION_STATE.CONNECTED
      })
      if (!haveActivePeers) {
        yield put(webrtcHangUp({ sessionId: session.id }))
      }
    }
  }
}

function* handleWebRTCEvent(event) {
  if (event.type === QB.webrtc.EVENT_TYPE.CALL) {
    yield call(handleCallEvent, event)
  } else if (event.type === QB.webrtc.EVENT_TYPE.HANG_UP) {
    yield call(handleHangUpEvent, event)
  } else {
    yield put(event)
  }
}

function* createChatConnectionChannel() {
  return eventChannel(emitter => {
    const chatEmitter = new NativeEventEmitter(QB.chat)
    const QBConnectionEvents = [
      QB.chat.EVENT_TYPE.CONNECTED,
      QB.chat.EVENT_TYPE.CONNECTION_CLOSED,
      QB.chat.EVENT_TYPE.CONNECTION_CLOSED_ON_ERROR,
      QB.chat.EVENT_TYPE.RECONNECTION_FAILED,
      QB.chat.EVENT_TYPE.RECONNECTION_SUCCESSFUL,
    ]
    const subscriptions = QBConnectionEvents.map(eventName =>
      chatEmitter.addListener(eventName, emitter)
    )
    return () => {
      while (subscriptions.length) {
        const subscription = subscriptions.pop()
        subscription.remove()
      }
    }
  })
}

function* createWebRTCChannel() {
  return eventChannel(emitter => {
    const webRtcEmitter = new NativeEventEmitter(QB.webrtc)
    const QBWebRTCEvents = Object
      .keys(QB.webrtc.EVENT_TYPE)
      .map(key => QB.webrtc.EVENT_TYPE[key])
    const subscriptions = QBWebRTCEvents.map(eventName =>
      webRtcEmitter.addListener(eventName, emitter)
    )
    return () => {
      while (subscriptions.length) {
        const subscription = subscriptions.pop()
        subscription.remove()
      }
    }
  })
}

function* QBconnectionEventsSaga() {
  try {
    const channel = yield call(createChatConnectionChannel)
    while (true) {
      const event = yield take(channel)
      yield put(event)
    }
  } catch (e) {
    yield put({ type: 'QB_CONNECTION_CHANNEL_ERROR', error: e.message })
  }
}

function* QBWebRTCEventsSaga() {
  try {
    const channel = yield call(createWebRTCChannel)
    while (true) {
      const event = yield take(channel)
      yield call(handleWebRTCEvent, event)
    }
  } catch (e) {
    yield put({ type: 'QB_WEBRTC_CHANNEL_ERROR', error: e.message })
  }
}

function* handlewNewMessage(message) {
  const { currentUser, dialogs } = yield select(({ auth, dialogs }) => ({
    currentUser: auth.user,
    dialogs: dialogs.dialogs,
  }))
  const dialog = dialogs.find(d => d.id === message.dialogId)
  if (dialog) {
    yield put(dialogEditSuccess({
      ...dialog,
      lastMessage: message.body,
      lastMessageDateSent: message.dateSent,
      lastMessageUserId: message.senderId
    }))
    if (currentUser && message.senderId !== currentUser.id) {
      if (!message.markable) {
        yield put(messageMarkDelivered(message))
      }
      if (dialog.type !== QB.chat.DIALOG_TYPE.PUBLIC_CHAT) {
        yield put(dialogUnreadCountIncrement({
          dialogId: message.dialogId
        }))
      }
    }
  } else {
    // re-load dialogs to get new dialog(s) or update occupants list
    yield put(dialogGet())
  }
}

function* createChatEventsChannel() {
  return eventChannel(emitter => {
    const chatEmitter = new NativeEventEmitter(QB.chat)
    const subscriptions = Object.keys(QB.chat.EVENT_TYPE).map(key =>
      chatEmitter.addListener(QB.chat.EVENT_TYPE[key], emitter)
    )
    return () => {
      while (subscriptions.length) {
        const subscription = subscriptions.pop()
        subscription.remove()
      }
    }
  })
}

function* QBChatEventsSaga() {
  const channel = yield call(createChatEventsChannel)
  try {
    while (true) {
      const event = yield take(channel)
      yield put(event)
      const { type, payload } = event
      if (type === QB.chat.EVENT_TYPE.RECEIVED_NEW_MESSAGE) {
        yield call(handlewNewMessage, payload)
      } else if (type === QB.chat.EVENT_TYPE.RECEIVED_SYSTEM_MESSAGE) {
        yield put(dialogGet())
      }
    }
  } catch (e) {
    yield put({ type: 'ERROR', error: e.message })
  } finally {
    if (yield cancelled()) {
      channel.close()
    }
  }
}

export default [
  spawn(QBconnectionEventsSaga),
  spawn(QBWebRTCEventsSaga),
  spawn(QBChatEventsSaga),
]
