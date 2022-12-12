import { combineReducers } from 'redux'

import app from './app'
import auth from './auth'
import chat from './chat'
import info from './info'
import users from './users'
import webrtc from './webrtc'
import device from './device'
import dialogs from './dialogs'
import content from './content'
import messages from './messages'

export default combineReducers({
  app,
  auth,
  chat,
  device,
  dialogs,
  content,
  info,
  users,
  messages,
  webrtc,
})