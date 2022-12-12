import React, {Component} from 'react';
import { View } from 'react-native';
import { theme } from '../core/theme';
import {AppContext} from './ContextProvider';

class NowBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      calc_pad: 0,
    }
    this._setHeight();
  }

  componentDidMount() {
    var int_ms = 1000

    this._setHeight();
    var that = this;

    this._interval = setInterval(() => {
      that._setHeight();
    }, int_ms);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  _setHeight() {
    const {hour_size, startHour, endHour} = this.props;
    var midnight = new Date();
    midnight.setHours(startHour,0,0,0);
    var now = new Date();
    var hours = ((now-midnight)/3600000)
    var calc_pad = hours * hour_size + 10

    this.setState({
      calc_pad: calc_pad
    })
  }

  render() {
    const {calc_pad} = this.state
    const {select_date, startHour, endHour} = this.props
    return (
      <AppContext.Consumer>
        {(context) => {
          if (!sameDay(select_date, new Date())) { return null }
          if (!availableShowNowBar(startHour, endHour, new Date())) { return null }
          return <View
            style={{
              width: '100%',  
              marginRight: 24,
              paddingTop: calc_pad,
              borderBottomColor: theme.colors.primary,
              borderBottomWidth: 2,
              position: 'absolute',
            }}
          />
        }}
      </AppContext.Consumer>
    )
  }
}

const availableShowNowBar = (startHour, endHour, d) => {  
  return (d.getHours() >= startHour) && (d.getHours() <= endHour);
}

const sameDay = (d1, d2) => {
  return d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();
}

export default NowBar