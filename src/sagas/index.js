import { all } from 'redux-saga/effects'

import appSagas from './app'
import authSagas from './auth'
import chatSagas from './chat'
import dialogsSagas from './dialogs'
import fileSagas from './file'
import eventsSagas from './events'
import infoSagas from './info'
import messagesSagas from './messages'
import netInfoSagas from './netinfo'
import usersSagas from './users'
import webRTCSagas from './webrtc'
import QBeventsSagas from './QBevents'

export default function* rootSaga() {
  yield all([
    ...appSagas,
    ...authSagas,
    ...chatSagas,
    ...dialogsSagas,
    ...fileSagas,
    ...eventsSagas,
    ...infoSagas,
    ...messagesSagas,
    ...netInfoSagas,
    ...usersSagas,
    ...webRTCSagas,
    ...QBeventsSagas,
  ])
}