import React, { Component } from 'react'
import { View, Platform, StyleSheet, Dimensions, Text, FlatList, TouchableWithoutFeedback, TextInput, } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'

const DEVICE_WIDTH = Dimensions.get('window').width

const new_timezones = [
  {"label": "Azores Standard Time (GMT-01:00)", "name": "(GMT-01:00) Azores", "tzCode": "Atlantic/Azores", "utc": "-01:00"},
  {"label": "Cape Verde Standard Time (GMT-01:00)", "name": "(GMT-01:00) Cape Verde Islands", "tzCode": "Atlantic/Cape_Verde", "utc": "-01:00"},
  {"label": "Mid-Atlantic Standard Time (GMT-02:00)", "name": "(GMT-02:00) Mid-Atlantic", "tzCode": "Atlantic/South_Georgia", "utc": "-02:00"},
  {"label": "E. South America Standard Time (GMT-03:00)", "name": "(GMT-03:00) Brasilia", "tzCode": "America/Sao_Paulo", "utc": "-03:00"},
  {"label": "SA Eastern Standard Time (GMT-03:00)", "name": "(GMT-03:00) Buenos Aires, Georgetown", "tzCode": "America/Argentina/Buenos_Aires", "utc": "-03:00"},
  {"label": "Greenland Standard Time (GMT-03:00)", "name": "(GMT-03:00) Greenland", "tzCode": "America/Godthab", "utc": "-03:00"},
  {"label": "Newfoundland Standard Time (GMT-03:30)", "name": "(GMT-03:30) Newfoundland and Labrador", "tzCode": "America/St_Johns", "utc": "-03:30"},
  {"label": "Atlantic Standard Time (GMT-04:00)", "name": "(GMT-04:00) Atlantic Time (Canada)", "tzCode": "America/Halifax", "utc": "-04:00"},
  {"label": "SA Western Standard Time (GMT-04:00)", "name": "(GMT-04:00) Caracas, La Paz", "tzCode": "America/La_Paz", "utc": "-04:00"},
  {"label": "Central Brazilian Standard Time (GMT-04:00)", "name": "(GMT-04:00) Manaus", "tzCode": "America/Cuiaba", "utc": "-04:00"},
  {"label": "Pacific SA Standard Time (GMT-04:00)", "name": "(GMT-04:00) Santiago", "tzCode": "America/Santiago", "utc": "-04:00"},
  {"label": "SA Pacific Standard Time (GMT-05:00)", "name": "(GMT-05:00) Bogota, Lima, Quito", "tzCode": "America/Bogota", "utc": "-05:00"},
  {"label": "Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Eastern Time (US and Canada)", "tzCode": "America/New_York", "utc": "-05:00"},
  {"label": "US Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Indiana (East)", "tzCode": "America/Indiana/Indianapolis", "utc": "-05:00"},
  {"label": "Central America Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central America", "tzCode": "America/Costa_Rica", "utc": "-06:00"},
  {"label": "Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central Time (US and Canada)", "tzCode": "America/Chicago", "utc": "-06:00"},
  {"label": "Central Standard Time (Mexico) (GMT-06:00)", "name": "(GMT-06:00) Guadalajara, Mexico City, Monterrey", "tzCode": "America/Monterrey", "utc": "-06:00"},
  {"label": "Canada Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Saskatchewan", "tzCode": "America/Edmonton", "utc": "-06:00"},
  {"label": "US Mountain Standard Time (GMT-07:00)", "name": "(GMT-07:00) Arizona", "tzCode": "America/Phoenix", "utc": "-07:00"},
  {"label": "Mountain Standard Time (Mexico) (GMT-07:00)", "name": "(GMT-07:00) Chihuahua, La Paz, Mazatlan", "tzCode": "America/Chihuahua", "utc": "-07:00"},
  {"label": "Mountain Standard Time (GMT-07:00)", "name": "(GMT-07:00) Mountain Time (US and Canada)", "tzCode": "America/Denver", "utc": "-07:00"},
  {"label": "Pacific Standard Time (GMT-08:00)", "name": "(GMT-08:00) Pacific Time (US and Canada); Tijuana", "tzCode": "America/Tijuana", "utc": "-08:00"},
  {"label": "Alaskan Standard Time (GMT-09:00)", "name": "(GMT-09:00) Alaska", "tzCode": "America/Anchorage", "utc": "-09:00"},
  {"label": "Hawaiian Standard Time (GMT-10:00)", "name": "(GMT-10:00) Hawaii", "tzCode": "Pacific/Honolulu", "utc": "-10:00"},
  {"label": "Samoa Standard Time (GMT-11:00)", "name": "(GMT-11:00) Midway Island, Samoa", "tzCode": "Pacific/Apia", "utc": "-11:00"},
  {"label": "Greenwich Standard Time (GMT)", "name": "(GMT) Casablanca, Monrovia", "tzCode": "Africa/Monrovia", "utc": "+00:00"},
  {"label": "GMT Standard Time (GMT)", "name": "(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London", "tzCode": "Europe/London", "utc": "+00:00"},
  {"label": "W. Europe Standard Time (GMT+01:00)", "name": "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "tzCode": "Europe/Berlin", "utc": "+01:00"},
  {"label": "Central Europe Standard Time (GMT+01:00)", "name": "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague", "tzCode": "Europe/Belgrade", "utc": "+01:00"},
  {"label": "Romance Standard Time (GMT+01:00)", "name": "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris", "tzCode": "Europe/Paris", "utc": "+01:00"},
  {"label": "Central European Standard Time (GMT+01:00)", "name": "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb", "tzCode": "Europe/Belgrade", "utc": "+01:00"},
  {"label": "W. Central Africa Standard Time (GMT+01:00)", "name": "(GMT+01:00) West Central Africa", "tzCode": "Africa/Lagos", "utc": "+01:00"},
  {"label": "GTB Standard Time (GMT+02:00)", "name": "(GMT+02:00) Athens, Bucharest, Istanbul", "tzCode": "Europe/Istanbul", "utc": "+02:00"},
  {"label": "Egypt Standard Time (GMT+02:00)", "name": "(GMT+02:00) Cairo", "tzCode": "Africa/Cairo", "utc": "+02:00"},
  {"label": "South Africa Standard Time (GMT+02:00)", "name": "(GMT+02:00) Harare, Pretoria", "tzCode": "Africa/Harare", "utc": "+02:00"},
  {"label": "FLE Standard Time (GMT+02:00)", "name": "(GMT+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius", "tzCode": "Europe/Riga", "utc": "+02:00"},
  {"label": "Israel Standard Time (GMT+02:00)", "name": "(GMT+02:00) Jerusalem", "tzCode": "Asia/Jerusalem", "utc": "+02:00"},
  {"label": "E. Europe Standard Time (GMT+02:00)", "name": "(GMT+02:00) Minsk", "tzCode": "Europe/Minsk", "utc": "+02:00"},
  {"label": "Namibia Standard Time (GMT+02:00)", "name": "(GMT+02:00) Windhoek", "tzCode": "Africa/Windhoek", "utc": "+02:00"},
  {"label": "Arabic Standard Time (GMT+03:00)", "name": "(GMT+03:00) Baghdad", "tzCode": "Asia/Baghdad", "utc": "+03:00"},
  {"label": "Arab Standard Time (GMT+03:00)", "name": "(GMT+03:00) Kuwait, Riyadh", "tzCode": "Asia/Kuwait", "utc": "+03:00"},
  {"label": "Russian Standard Time (GMT+03:00)", "name": "(GMT+03:00) Moscow, St. Petersburg, Volgograd", "tzCode": "Europe/Moscow", "utc": "+03:00"},
  {"label": "E. Africa Standard Time (GMT+03:00)", "name": "(GMT+03:00) Nairobi", "tzCode": "Africa/Nairobi", "utc": "+03:00"},
  {"label": "Iran Standard Time (GMT+03:30)", "name": "(GMT+03:30) Tehran", "tzCode": "Asia/Tehran", "utc": "+03:30"},
  {"label": "Arabian Standard Time (GMT+04:00)", "name": "(GMT+04:00) Abu Dhabi, Muscat", "tzCode": "Asia/Muscat", "utc": "+04:00"},
  {"label": "Azerbaijan Standard Time (GMT+04:00)", "name": "(GMT+04:00) Baku", "tzCode": "Asia/Baku", "utc": "+04:00"},
  {"label": "Georgian Standard Time (GMT+04:00)", "name": "(GMT+04:00) Tblisi", "tzCode": "Asia/Tbilisi", "utc": "+04:00"},
  {"label": "Caucasus Standard Time (GMT+04:00)", "name": "(GMT+04:00) Yerevan", "tzCode": "Asia/Yerevan", "utc": "+04:00"},
  {"label": "Afghanistan Standard Time (GMT+04:30)", "name": "(GMT+04:30) Kabul", "tzCode": "Asia/Kabul", "utc": "+04:30"},
  {"label": "Ekaterinburg Standard Time (GMT+05:00)", "name": "(GMT+05:00) Ekaterinburg", "tzCode": "Asia/Yekaterinburg", "utc": "+05:00"},
  {"label": "West Asia Standard Time (GMT+05:00)", "name": "(GMT+05:00) Islamabad, Karachi, Tashkent", "tzCode": "Asia/Tashkent", "utc": "+05:00"},
  {"label": "India Standard Time (GMT+05:30)", "name": "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi", "tzCode": "Asia/Calcutta", "utc": "+05:30"},
  {"label": "Nepal Standard Time (GMT+05:45)", "name": "(GMT+05:45) Kathmandu", "tzCode": "Asia/Kathmandu", "utc": "+05:45"},
  {"label": "N. Central Asia Standard Time (GMT+06:00)", "name": "(GMT+06:00) Almaty, Novosibirsk", "tzCode": "Asia/Novosibirsk", "utc": "+06:00"},
  {"label": "Central Asia Standard Time (GMT+06:00)", "name": "(GMT+06:00) Astana, Dhaka", "tzCode": "Asia/Almaty", "utc": "+06:00"},
  {"label": "Sri Lanka Standard Time (GMT+06:00)", "name": "(GMT+06:00) Sri Jayawardenepura", "tzCode": "Asia/Colombo", "utc": "+06:00"},
  {"label": "Myanmar Standard Time (GMT+06:30)", "name": "(GMT+06:30) Yangon (Rangoon)", "tzCode": "Asia/Rangoon", "utc": "+06:30"},
  {"label": "SE Asia Standard Time (GMT+07:00)", "name": "(GMT+07:00) Bangkok, Hanoi, Jakarta", "tzCode": "Asia/Bangkok", "utc": "+07:00"},
  {"label": "North Asia Standard Time (GMT+07:00)", "name": "(GMT+07:00) Krasnoyarsk", "tzCode": "Asia/Krasnoyarsk", "utc": "+07:00"},
  {"label": "China Standard Time (GMT+08:00)", "name": "(GMT+08:00) Beijing, Chongqing, Hong Kong SAR, Urumqi", "tzCode": "Asia/Shanghai", "utc": "+08:00"},
  {"label": "North Asia East Standard Time (GMT+08:00)", "name": "(GMT+08:00) Irkutsk, Ulaanbaatar", "tzCode": "Asia/Irkutsk", "utc": "+08:00"},
  {"label": "Singapore Standard Time (GMT+08:00)", "name": "(GMT+08:00) Kuala Lumpur, Singapore", "tzCode": "Asia/Singapore", "utc": "+08:00"},
  {"label": "W. Australia Standard Time (GMT+08:00)", "name": "(GMT+08:00) Perth", "tzCode": "Australia/Perth", "utc": "+08:00"},
  {"label": "Taipei Standard Time (GMT+08:00)", "name": "(GMT+08:00) Taipei", "tzCode": "Asia/Taipei", "utc": "+08:00"},
  {"label": "Tokyo Standard Time (GMT+09:00)", "name": "(GMT+09:00) Osaka, Sapporo, Tokyo", "tzCode": "Asia/Tokyo", "utc": "+09:00"},
  {"label": "Korea Standard Time (GMT+09:00)", "name": "(GMT+09:00) Seoul", "tzCode": "Asia/Seoul", "utc": "+09:00"},
  {"label": "Yakutsk Standard Time (GMT+09:00)", "name": "(GMT+09:00) Yakutsk", "tzCode": "Asia/Yakutsk", "utc": "+09:00"},
  {"label": "Cen. Australia Standard Time (GMT+09:30)", "name": "(GMT+09:30) Adelaide", "tzCode": "Australia/Adelaide", "utc": "+09:30"},
  {"label": "AUS Central Standard Time (GMT+09:30)", "name": "(GMT+09:30) Darwin", "tzCode": "Australia/Darwin", "utc": "+09:30"},
  {"label": "E. Australia Standard Time (GMT+10:00)", "name": "(GMT+10:00) Brisbane", "tzCode": "Australia/Brisbane", "utc": "+10:00"},
  {"label": "AUS Eastern Standard Time (GMT+10:00)", "name": "(GMT+10:00) Canberra, Melbourne, Sydney", "tzCode": "Australia/Sydney", "utc": "+10:00"},
  {"label": "West Pacific Standard Time (GMT+10:00)", "name": "(GMT+10:00) Guam, Port Moresby", "tzCode": "Pacific/Guam", "utc": "+10:00"},
  {"label": "Tasmania Standard Time (GMT+10:00)", "name": "(GMT+10:00) Hobart", "tzCode": "Australia/Hobart", "utc": "+10:00"},
  {"label": "Vladivostok Standard Time (GMT+10:00)", "name": "(GMT+10:00) Vladivostok", "tzCode": "Asia/Vladivostok", "utc": "+10:00"},
  {"label": "Central Pacific Standard Time (GMT+11:00)", "name": "(GMT+11:00) Magadan, Solomon Islands, New Caledonia", "tzCode": "Pacific/Guadalcanal", "utc": "+11:00"},
  {"label": "New Zealand Standard Time (GMT+12:00)", "name": "(GMT+12:00) Auckland, Wellington", "tzCode": "Pacific/Auckland", "utc": "+12:00"},
  {"label": "Fiji Standard Time (GMT+12:00)", "name": "(GMT+12:00) Fiji Islands, Kamchatka, Marshall Islands", "tzCode": "Pacific/Fiji", "utc": "+12:00"},
  {"label": "Tonga Standard Time (GMT+13:00)", "name": "(GMT+13:00) Nuku'alofa", "tzCode": "Pacific/Tongatapu", "utc": "+13:00"}]

export default class TimeZone extends Component {
  constructor(props) {
    super(props)

    // const filtered = timezones.filter(
    //   function(item){
    //     const itemData = item.label.toUpperCase()
    //     const text1 = "Pacific".toUpperCase()
    //     const text2 = "America".toUpperCase()
    //     return (itemData.indexOf(text1) > -1) || (itemData.indexOf(text2) > -1)
    //   }
    // )    
    
    // const filtered = []
    // for (let i = 0; i < 78; i++) {
    //   let name = newTimezoens[78 + i];
    //   let tzcode = newTimezoens[156 + i];
    //   let gmt = name.split(" ")[0]
    //   let label = newTimezoens[i] + " " + gmt;
    //   var utc = ''
    //   if (gmt.length > 5) {
    //     utc = gmt.substring(4, 10);
    //   } else {
    //     utc = "+00:00"
    //   }
    //   filtered.push({"label": label, "name": name, "tzCode": tzcode, "utc": utc})
    // }

    this.state = {
      isLoading: false,
      originalData: new_timezones,
      filteredData: new_timezones,      
      searchText: '',
      selectedTimeZone: {},      
    }
  }

  actionOnRow = (item) => {
    console.log(item);
    this.props.route.params.onGoBackFromOptions(item)
    this.props.navigation.goBack()
  }

  searchFilter = (text) => {
    if (text) {
      const newData = this.state.originalData.filter(
        function(item){
          const itemData = item.label.toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
        }
      )
      this.setState({
        searchText: text,
        filteredData: newData,
      })
    } else {
      this.setState({
        searchText: text,
        filteredData: this.state.originalData,
      })
    }
  }

  render() {
    return (
      <Background>
        <View style={styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Time Zone</PageTitle>
        </View>

        <View style={styles.listView}>
          <View style={styles.searchView}>
            {/* <Icon name="search" size={14} color={theme.colors.lightGray} style={{marginLeft: 9, marginTop: 11, fontWeight: 'regular'}} /> */}
            <TextInput
              style= {styles.searchInput}
              returnKeyType="search"
              value={this.state.searchText}
              onChangeText={(text) => this.searchFilter(text)}
              underlineColorAndroid="transparent"
              placeholder="Search"
            />
          </View>

          <FlatList                
            data={this.state.filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) =>{
              let itemTimes= item.label.split('/').pop();
              let timeName = itemTimes.substr(0, itemTimes.indexOf('('));
              let timeZone = itemTimes.split('(').pop().replace(')', '');
              return  (
                <TouchableWithoutFeedback onPress={ () => this.actionOnRow(item)}>
                    <View style={styles.cellView}>
                      <Text style={styles.nameText}>{timeName} </Text>
                      <Text style={styles.zoneText}>{timeZone} </Text>
                    </View>
                </TouchableWithoutFeedback>
              )
            }
          }
          />
        </View>

      </Background>
    )
  }
}
  
const styles = StyleSheet.create({
  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 40,
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.searchBar,
    borderRadius: 20,
    flexDirection: 'row',
  },

  listView: {
    width: DEVICE_WIDTH,
    flex: 1,
  },

  searchInput:{
    flex: 1,
    marginLeft: 16,
  },

  cellView: {
    height: 60,
    marginHorizontal: 16,
    borderBottomColor: theme.colors.inputBorder,
    borderBottomWidth: 1,
  },

  nameText: {
    marginTop: 10,
    marginLeft: 8,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  zoneText: {
    marginTop: 4,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },
})