import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Play, Pause, Mic } from 'lucide-react-native';
import * as ExpoAV from 'expo-av';
const Audio = ExpoAV.Audio;

interface AudioMessageProps {
  uri: string;
  isMe?: boolean;
}

export const AudioMessage = ({ uri, isMe }: AudioMessageProps) => {
  const [sound, setSound] = useState<ExpoAV.Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: ExpoAV.AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      } else {
        setLoading(true);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error playing sound', error);
      setLoading(false);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const accentColor = '#53bdeb'; // WhatsApp blue for played voice notes

  return (
    <View style={styles.container}>
      <View style={styles.avatarPlaceholder}>
        <Mic size={24} color="#8696a0" />
      </View>
      
      <TouchableOpacity 
        onPress={playSound}
        style={styles.playBtn}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#8696a0" />
        ) : isPlaying ? (
          <Pause size={28} color="#8696a0" />
        ) : (
          <Play size={28} color="#8696a0" fill="#8696a0" />
        )}
      </TouchableOpacity>
      
      <View style={styles.progressContainer}>
        <View style={styles.track}>
          <View 
            style={[
              styles.progress, 
              { width: `${duration > 0 ? (position / duration) * 100 : 0}%`, backgroundColor: accentColor }
            ]}
          />
        </View>
        <Text style={styles.durationText}>
          {formatTime(position || duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 200,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playBtn: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 8,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
  durationText: {
    fontSize: 12,
    color: '#8696a0',
    marginTop: 4,
  }
});
