import React, {Component} from 'react';
import { ScrollView, Dimensions } from 'react-native';

const DEVICE_HEIGHT = Dimensions.get('window').height;

class SmartScroll extends Component {
  _nowHeight(){
    const {hour_size, startHour, endHour} = this.props;

    var midnight = new Date();
    midnight.setHours(startHour,0,0,0);
    var now = new Date();
    var hours = ((now-midnight)/3600000);
    return hours * hour_size + 10;
  }

  componentDidMount() {
    const {hour_size, startHour, endHour} = this.props;

    const SCROLL_HT = (endHour - startHour) * hour_size + 20;
    const SCREEN_HT = (Dimensions.get('window').height - 240);
    const OFFSET_HT = this._nowHeight() - (SCREEN_HT / 2);

    if ( OFFSET_HT > SCROLL_HT - SCREEN_HT) {
      this._scroller.scrollTo({x: 0, y: SCROLL_HT - SCREEN_HT});
    } else if (OFFSET_HT > 0) {
      this._scroller.scrollTo({x: 0, y: OFFSET_HT});
    }
  }

  render() {
    const {hour_size, startHour, endHour} = this.props;
    const SCROLL_HT = (endHour - startHour) * hour_size + 20;

    return (
      <ScrollView contentContainerStyle={{paddingBottom: 24}} style={{height: SCROLL_HT}} ref={(component) => {this._scroller = component}}>
        {this.props.children}
      </ScrollView>
    )
  }
}

export default SmartScroll