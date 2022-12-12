import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { theme } from '../core/theme'

const Tab = createBottomTabNavigator();

export default function CustomTapNav(props) {

  let typeProps = {
    screenOptions: {
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.lightGray,
    },
  };
  if (props.type === "switch") {
    typeProps = {
      backBehavior: "none",
      tabBar: () => null
    };
  } else if (props.type === "auth") {
    typeProps = {
      tabBar: () => null
    };
  }

  return (<Tab.Navigator {...typeProps} {...props} />)
}