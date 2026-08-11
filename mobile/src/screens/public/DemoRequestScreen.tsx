import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useBranding } from '../../hooks/useBranding';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { leadService } from '../../api';

export default function DemoRequestScreen() {
  const theme = useTheme();
  const { contact } = useBranding();
  const [form, setForm] = useState({ companyName: '', employeeCount: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.email || !form.phone) {
      Alert.alert('Incomplete form', 'Please complete all required fields before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await leadService.createLead({
        company_name: form.companyName,
        email: form.email,
        phone: form.phone,
        employees_count: Number(form.employeeCount || 0),
        message: form.message,
        source: 'mobile_app',
      });
      Alert.alert('Request sent', 'Your demo request was submitted successfully. A representative will contact you soon.');
      setForm({ companyName: '', employeeCount: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Demo request error', error);
      Alert.alert('Unable to submit', 'Please try again later or contact support.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: theme.colors.text }]}>Request a Demo</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Complete the form below and our team will reach out with a dedicated walkthrough.</Text>

        <View style={[styles.form, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Company name</Text>
            <TextInput value={form.companyName} onChangeText={(value) => handleChange('companyName', value)} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="Acme Corp" placeholderTextColor={theme.colors.muted} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Employees count</Text>
            <TextInput value={form.employeeCount} onChangeText={(value) => handleChange('employeeCount', value)} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="120" keyboardType="numeric" placeholderTextColor={theme.colors.muted} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email address</Text>
            <TextInput value={form.email} onChangeText={(value) => handleChange('email', value)} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="hello@company.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.colors.muted} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Phone number</Text>
            <TextInput value={form.phone} onChangeText={(value) => handleChange('phone', value)} style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]} placeholder="+1 555 012 345" keyboardType="phone-pad" placeholderTextColor={theme.colors.muted} />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Message</Text>
            <TextInput
              value={form.message}
              onChangeText={(value) => handleChange('message', value)}
              style={[styles.input, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Tell us your goals"
              placeholderTextColor={theme.colors.muted}
              multiline
            />
          </View>
          <PrimaryButton label="Submit request" onPress={handleSubmit} style={styles.button} />
          <Text style={[styles.helpText, { color: theme.colors.subtext }]}>Prefer direct support? Email us at {contact.email}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  form: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
  },
  helpText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
  },
});
