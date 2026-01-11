import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, signup, isPasswordSetup, isLoading } = useAuth();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Determine if we're in signup mode
  const isSignupMode = !isPasswordSetup && !isLoading;

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (isSignupMode) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const success = isSignupMode
        ? await signup(password)
        : await login(password);

      if (!success) {
        setError(isSignupMode ? 'Failed to create password' : 'Invalid password');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Authentication failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.emoji, { color: colors.primary }]}>🔐</Text>

          <Text style={[styles.title, { color: colors.onBackground }]}>
            Mood Diary
          </Text>

          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            {isSignupMode
              ? 'Create a password to protect your diary'
              : 'Enter your password to access your diary'}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              editable={!loading}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
          </View>

          {isSignupMode && (
            <View style={styles.inputContainer}>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                editable={!loading}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
            </View>
          )}

          {error && (
            <Text style={[styles.error, { color: colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.button}
          >
            {loading
              ? isSignupMode
                ? 'Creating Password...'
                : 'Authenticating...'
              : isSignupMode
              ? 'Create Password'
              : 'Unlock Diary'}
          </Button>

          <Text style={[styles.info, { color: colors.onSurfaceVariant }]}>
            All entries are stored locally and remain private
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  error: {
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 24,
    paddingVertical: 4,
  },
  info: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
