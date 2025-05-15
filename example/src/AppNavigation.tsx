import React from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from "./HomePage";
import HostPage from "./HostPage";
import AudiencePage from "./AudiencePage";

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
    return (
        // @ts-ignore
        <Stack.Navigator initialRouteName="HomePage">
            {/* @ts-ignore */}
            <Stack.Screen options={{headerShown: false}} headerMode="none" name="HomePage" component={HomePage} />
            <Stack.Screen options={{headerShown: false}} name="HostPage" component={HostPage} />
            <Stack.Screen options={{headerShown: false}} name="AudiencePage" component={AudiencePage} />
        </Stack.Navigator>
    );
}