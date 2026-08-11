import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Mail, Building, Phone, ArrowLeft, CheckCircle2, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    phone: '',
    industry: '',
  });

  const handleRegister = () => {
    Alert.alert(
      'Success',
      'Your request has been submitted. We will contact you soon.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Shield color="#4f46e5" size={64} />
            <Text style={styles.title}>{step === 1 ? 'Personal Info' : 'Company Info'}</Text>
            <Text style={styles.subtitle}>
              Step {step} of 2
            </Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrap}>
                    <User size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      value={formData.firstName}
                      onChangeText={(t) => setFormData({...formData, firstName: t})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputWrap}>
                    <User size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      value={formData.lastName}
                      onChangeText={(t) => setFormData({...formData, lastName: t})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Work Email</Text>
                  <View style={styles.inputWrap}>
                    <Mail size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="john@company.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(t) => setFormData({...formData, email: t})}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company Name</Text>
                  <View style={styles.inputWrap}>
                    <Building size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Acme Corp"
                      value={formData.companyName}
                      onChangeText={(t) => setFormData({...formData, companyName: t})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrap}>
                    <Phone size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="+1234567890"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(t) => setFormData({...formData, phone: t})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Industry</Text>
                  <View style={styles.inputWrap}>
                    <Building size={20} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      placeholder="Technology"
                      value={formData.industry}
                      onChangeText={(t) => setFormData({...formData, industry: t})}
                    />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => step === 1 ? setStep(2) : handleRegister()}
            >
              <Text style={styles.primaryBtnText}>{step === 1 ? 'NEXT' : 'SUBMIT'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryBtnText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 30 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 8 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { marginTop: 24, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
});

