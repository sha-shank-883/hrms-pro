import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Home, CheckSquare, MessageCircle, User, Zap } from 'lucide-react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppConfig } from '../context/AppConfigContext';
import LoginScreen from '../screens/LoginScreen';
import TwoFactorScreen from '../screens/TwoFactorScreen';
import MarketingScreen from '../screens/MarketingScreen';
import SplashScreen from '../screens/public/SplashScreen';
import OnboardingScreen from '../screens/public/OnboardingScreen';
import WelcomeScreen from '../screens/public/WelcomeScreen';
import PricingScreen from '../screens/public/PricingScreen';
import AboutCompanyScreen from '../screens/public/AboutCompanyScreen';
import ContactSupportScreen from '../screens/public/ContactSupportScreen';
import DemoRequestScreen from '../screens/public/DemoRequestScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeavesScreen from '../screens/LeavesScreen';
import TaskScreen from '../screens/TaskScreen';
import EmployeesScreen from '../screens/EmployeesScreen';
import DepartmentsScreen from '../screens/DepartmentsScreen';
import PayrollScreen from '../screens/PayrollScreen';
import AssetsScreen from '../screens/AssetsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import RecruitmentScreen from '../screens/RecruitmentScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import HolidaysScreen from '../screens/HolidaysScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import LeadsScreen from '../screens/LeadsScreen';
import CMSPageScreen from '../screens/CMSPageScreen';
import TenantsScreen from '../screens/TenantsScreen';
import AccessDeniedScreen from '../screens/AccessDeniedScreen';
import { canOpenModule } from '../utils/authz';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuardedScreen({ component: Component, moduleKey, ...props }: { component: React.ComponentType<any>; moduleKey?: string; [key: string]: any }) {
  const { user, tenantId, settings } = useAuth();
  if (moduleKey && !canOpenModule(user, tenantId, moduleKey, settings)) {
    return <AccessDeniedScreen {...props} />;
  }
  return <Component {...props} />;
}

function MainTabs() {
  const { settings } = useAuth();
  const { isFeatureEnabled } = useAppConfig();
  const theme = useTheme();
  const tasksEnabled = settings?.mobile_feature_tasks !== 'false';
  const chatEnabled = settings?.mobile_feature_chat !== 'false' && isFeatureEnabled('enableChat');

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      {tasksEnabled && (
        <Tab.Screen 
          name="Tasks" 
          component={TaskScreen}
          options={{
            tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
          }}
        />
      )}
      {chatEnabled && (
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
      )}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const MobileDisabledMessage = ({ theme }: { theme: { colors: Record<string, string>; mode: string } }) => (
  <StyledSafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} className="px-6 justify-center">
    <StyledView className="bg-white dark:bg-gray-900 rounded-[40px] p-10 border border-gray-100 dark:border-gray-800 shadow-2xl items-center">
      <StyledView className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-[24px] items-center justify-center mb-8">
         <XCircle size={40} color="#ef4444" />
      </StyledView>
      <StyledText className="text-3xl font-black text-center mb-4" style={{ color: theme.colors.text }}>Access Revoked</StyledText>
      <StyledText className="text-base font-bold text-center opacity-50 leading-7" style={{ color: theme.colors.subtext }}>
        Your administrator has disabled mobile uplink for this terminal. Please use the desktop command center.
      </StyledText>
    </StyledView>
  </StyledSafeAreaView>
);

export default function AppNavigator() {
  const { user, loading: authLoading, settings: mobileSettings } = useAuth();
  const { config, loading: configLoading, isFeatureEnabled } = useAppConfig();
  const theme = useTheme();
  const { colors } = theme;

  if (authLoading || configLoading) {
    return null;
  }

  // GLOBAL SUPER ADMIN MAINTENANCE CHECK
  if (config.mobile_maintenance?.isUnderMaintenance) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ backgroundColor: colors.card, padding: 32, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
          <Zap size={64} color="#f59e0b" strokeWidth={1.5} />
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 24, textAlign: 'center', letterSpacing: 1 }}>SYSTEM MAINTENANCE</Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
            {config.mobile_maintenance?.message || "Our team is currently performing a critical core update to the HRMS environment. Access will be restored shortly."}
          </Text>
          <View style={{ marginTop: 32, padding: 16, backgroundColor: colors.background, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.subtext, textTransform: 'uppercase' }}>Kernel Status</Text>
            <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600', marginTop: 4 }}>Uplink Suspended | V{config.mobile_maintenance?.minAppVersion}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (user && mobileSettings?.mobile_app_enabled === 'false') {
    return <MobileDisabledMessage theme={theme} />;
  }

  return (
    <NavigationContainer theme={theme.mode === 'dark' ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      }
    } : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      }
    }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />

      <Stack.Navigator initialRouteName={user ? "Main" : "Splash"} screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Marketing" component={MarketingScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Leaves" component={LeavesScreen} />
            
            <Stack.Screen name="Employees">
              {(props) => <GuardedScreen {...props} component={EmployeesScreen} moduleKey="employees" />}
            </Stack.Screen>
            
            <Stack.Screen name="Settings">
              {(props) => <GuardedScreen {...props} component={SettingsScreen} moduleKey="settings" />}
            </Stack.Screen>
            
            <Stack.Screen name="AuditLogs">
              {(props) => <GuardedScreen {...props} component={AuditLogsScreen} moduleKey="auditLogs" />}
            </Stack.Screen>
            
            <Stack.Screen name="Departments">
              {(props) => <GuardedScreen {...props} component={DepartmentsScreen} moduleKey="departments" />}
            </Stack.Screen>
            
            <Stack.Screen name="Payroll" component={PayrollScreen} />
            <Stack.Screen name="Assets" component={AssetsScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
            
            <Stack.Screen name="Recruitment">
              {(props) => <GuardedScreen {...props} component={RecruitmentScreen} moduleKey="recruitment" />}
            </Stack.Screen>
            
            <Stack.Screen name="Performance" component={PerformanceScreen} />
            
            <Stack.Screen name="Reports">
              {(props) => <GuardedScreen {...props} component={ReportsScreen} moduleKey="reports" />}
            </Stack.Screen>
            
            <Stack.Screen name="Holidays" component={HolidaysScreen} />
            
            <Stack.Screen name="Shifts">
              {(props) => <GuardedScreen {...props} component={ShiftsScreen} moduleKey="shifts" />}
            </Stack.Screen>
            
            <Stack.Screen name="Leads">
              {(props) => <GuardedScreen {...props} component={LeadsScreen} moduleKey="leads" />}
            </Stack.Screen>
            
            <Stack.Screen name="CMS">
              {(props) => <GuardedScreen {...props} component={CMSPageScreen} moduleKey="cms" />}
            </Stack.Screen>
            
            <Stack.Screen name="Tenants">
              {(props) => <GuardedScreen {...props} component={TenantsScreen} moduleKey="tenants" />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Marketing" component={MarketingScreen} />
            <Stack.Screen name="Pricing" component={PricingScreen} />
            <Stack.Screen name="About" component={AboutCompanyScreen} />
            <Stack.Screen name="Contact" component={ContactSupportScreen} />
            <Stack.Screen name="DemoRequest" component={DemoRequestScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="TwoFactor" component={TwoFactorScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { XCircle } from 'lucide-react-native';
