import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AlertOctagon, RotateCcw } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Uncaught Error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <AlertOctagon size={36} color={colors.criticalDelete} />
            </View>
            <Text style={styles.title}>APPLICATION EXCEPTION</Text>
            <Text style={styles.subtitle}>
              An unexpected runtime error occurred on the site client. The technical state has been preserved.
            </Text>

            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Unknown technical runtime error.'}
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.reloadButton} onPress={this.handleReset}>
              <RotateCcw size={18} color="#071224" />
              <Text style={styles.reloadText}>RELOAD WORKSPACE</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.criticalDelete,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    maxHeight: 120,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    width: '100%',
    marginBottom: 20,
  },
  errorText: {
    color: colors.criticalDelete,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAccent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  reloadText: {
    color: '#071224',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

