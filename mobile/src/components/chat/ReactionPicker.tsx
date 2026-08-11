import React from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, StyleSheet, Animated } from 'react-native';
import { Plus } from 'lucide-react-native';

interface ReactionPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (reaction: string) => void;
}

const REACTIONS = ['❤️', '😂', '😯', '😢', '🙏', '👍'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ isVisible, onClose, onSelect }) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {REACTIONS.map((emoji) => (
                <TouchableOpacity 
                  key={emoji} 
                  onPress={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  style={styles.reactionBtn}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addBtn}>
                <Plus size={20} color="#8696a0" />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  reactionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emojiText: {
    fontSize: 26,
  },
  addBtn: {
    paddingHorizontal: 10,
    marginLeft: 4,
  },
});
