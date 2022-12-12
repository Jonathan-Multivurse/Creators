import React from 'react';
import { View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import {AppContext} from './ContextProvider';
import { theme } from '../core/theme'

const HrLine = ({color, width, hour_size}) =>
  <AppContext.Consumer>
    {(context) =>
      <View
        style={{
          width: '100%',
          paddingTop: 10 - 1,
          marginBottom: hour_size - 10,
          borderBottomColor: theme.colors.inputBorder,
          borderBottomWidth: width,
        }}
      />
    }
  </AppContext.Consumer>

HrLine.propTypes = {
  color: PropTypes.string,
  width: PropTypes.number,
};

HrLine.defaultProps = {
  color: theme.colors.inputBorder,
  width: 1,
};

export default HrLine;