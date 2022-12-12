import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import App from './App'
import configureStore from './store'
import rootSaga from './sagas'

const { runSaga, store, persistor } = configureStore()
runSaga(rootSaga)

export default () => (
  <Provider store={store}>
    <PersistGate persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
)