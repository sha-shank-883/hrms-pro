import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    // Here you would typically log to an external service like Sentry
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <ShieldAlert size={64} color="#ef4444" strokeWidth={1.5} />
            </View>
            
            <Text style={styles.title}>CRITICAL SYSTEM FAILURE</Text>
            <Text style={styles.subtitle}>
              An unexpected exception has occurred in the application kernel. 
              The current session has been suspended for security.
            </Text>

            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>LOG_TRACE:</Text>
              <Text style={styles.errorText} numberOfLines={3}>
                {this.state.error?.toString() || 'Unknown Kernel Panic'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <RefreshCw size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.retryText}>RESTART INTERFACE</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeButton} 
              onPress={this.handleReset}
            >
              <Home size={18} color="#6366f1" style={styles.buttonIcon} />
              <Text style={styles.homeText}>RETURN TO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>SYSTEM_ID: HRMS_MOBILE_PRO_v1.0</Text>
            <Text style={styles.footerText}>REPORT_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  errorLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#f1f5f9',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'center',
  },
  homeText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 10,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default ErrorBoundary;
