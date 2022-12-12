import React from 'react'
import { Text, View, StyleSheet, Image } from 'react-native'

export default class RatingView extends React.PureComponent {
  constructor(props) {
    super(props)   
  }

  render() {
    const {star, type} = this.props

    return (
      <View style={type == 0 ? styles.ratingView0 : type == 1 ? styles.ratingView1 : type == 2 ? styles.ratingView2 : styles.ratingView2 }>

          <View style={type == 0 ? styles.starView0 : type == 1 ? styles.starView1 : type == 2 ? styles.starView2 : styles.starView2}>
            <Image style={type == 0 ? styles.starImage0 : type == 1 ? styles.starImage1 : type == 2 ? styles.starImage2 : styles.starImage2} source={star >= 0.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
          </View>

          <View style={type == 0 ? styles.starView0 : type == 1 ? styles.starView1 : type == 2 ? styles.starView2 : styles.starView2}>
            <Image style={type == 0 ? styles.starImage0 : type == 1 ? styles.starImage1 : type == 2 ? styles.starImage2 : styles.starImage2} source={star >= 1.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
          </View>

          <View style={type == 0 ? styles.starView0 : type == 1 ? styles.starView1 : type == 2 ? styles.starView2 : styles.starView2}>
            <Image style={type == 0 ? styles.starImage0 : type == 1 ? styles.starImage1 : type == 2 ? styles.starImage2 : styles.starImage2} source={star >= 2.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
          </View>

          <View style={type == 0 ? styles.starView0 : type == 1 ? styles.starView1 : type == 2 ? styles.starView2 : styles.starView2}>
            <Image style={type == 0 ? styles.starImage0 : type == 1 ? styles.starImage1 : type == 2 ? styles.starImage2 : styles.starImage2} source={star >= 3.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
          </View>

          <View style={type == 0 ? styles.starView0 : type == 1 ? styles.starView1 : type == 2 ? styles.starView2 : styles.starView2}>
            <Image style={type == 0 ? styles.starImage0 : type == 1 ? styles.starImage1 : type == 2 ? styles.starImage2 : styles.starImage2} source={star >= 4.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
          </View>

          {star > 0.5 && <Text style={type == 0 ? styles.ratingText0 : type == 1 ? styles.ratingText1 : type == 2 ? styles.ratingText2 : styles.ratingText2}>{star.toString()}</Text>
          }
       
      </View>
    )
  }

}

const styles = StyleSheet.create({
  ratingView0: {
    flex: 1,
    height: 29,
    marginTop: 12,
    marginLeft: 12,    
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  starView0: {
    height: 29,    
    width: 29,
    marginRight: 4,
  },

  starImage0: {
    position: 'absolute',
    left: -30,
    top: -16,
    width: 89,
    height: 88,
  },

  ratingText0: {
    height: 29,
    marginLeft: 8,
    paddingTop: 3,
    fontSize: 20,
    fontFamily: 'Poppins-Regular',
  },

  ratingView1: {
    height: 22,
    flexDirection: 'row',
  },

  starView1: {
    width: 22,
    height: 22,    
    marginRight: 4,
  },

  starImage1: {
    position: 'absolute',
    left: -24,
    top: -10,
    width: 69,
    height: 68,
  },

  ratingText1: {
    height: 22,
    marginLeft: 2,
    paddingTop: 4,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },

  ratingView2: {
    height: 16,
    flexDirection: 'row',
  },

  starView2: {
    width: 16,
    height: 16,    
    marginRight: 3,
  },

  starImage2: {
    position: 'absolute',
    left: -22,
    top: -8,
    width: 59,
    height: 58,
  },

  ratingText2: {
    height: 22,
    marginLeft: 2,
    paddingTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
  },


}) 