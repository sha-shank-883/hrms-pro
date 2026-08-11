import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { FileIcon, FileText, Download, Video } from 'lucide-react-native';
import { AudioMessage } from './AudioMessage';
import { API_URL } from '../../api';

const buildFullUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  const base = API_URL.replace('/api', '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface AttachmentPreviewProps {
  fileUrl: string;
  fileType?: string;
  fileName?: string;
  isMe?: boolean;
}

export const AttachmentPreview = ({ fileUrl, fileType, fileName, isMe }: AttachmentPreviewProps) => {
  if (!fileUrl) return null;

  const fullUrl = buildFullUrl(fileUrl);
  const isImage = fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isAudio = fileType?.startsWith('audio/') || /\.(m4a|mp3|wav|ogg)$/i.test(fileUrl);
  const isVideo = fileType?.startsWith('video/') || /\.(mp4|mov|avi)$/i.test(fileUrl);
  const isPdf = fileType === 'application/pdf' || fileUrl.endsWith('.pdf');

  if (isAudio) {
    return <AudioMessage uri={fullUrl} isMe={isMe} />;
  }

  const handleOpen = () => {
    Linking.openURL(fullUrl).catch(() => Alert.alert('Cannot Open', 'Unable to open this file.'));
  };

  if (isImage) {
    return (
      <TouchableOpacity onPress={handleOpen} style={styles.imageWrapper}>
        <Image 
          source={{ uri: fullUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  if (isVideo) {
    return (
      <TouchableOpacity onPress={handleOpen} style={styles.videoWrapper}>
        <View style={styles.videoOverlay}>
          <Video size={40} color="#fff" />
        </View>
        <Text style={styles.videoText} numberOfLines={1}>{fileName || 'Video'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleOpen} style={styles.fileContainer}>
      <View style={styles.fileIconWrapper}>
        {isPdf ? <FileText size={24} color="#f44336" /> : <FileIcon size={24} color="#8696a0" />}
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{fileName || 'Document'}</Text>
        <Text style={styles.fileMeta}>{fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</Text>
      </View>
      <Download size={18} color="#8696a0" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageWrapper: {
    width: 240,
    height: 180,
    marginVertical: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoWrapper: {
    width: 240,
    height: 180,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    zIndex: 1,
  },
  videoText: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 10,
    borderRadius: 8,
    width: 240,
  },
  fileIconWrapper: {
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#111b21',
    fontWeight: '500',
  },
  fileMeta: {
    fontSize: 11,
    color: '#8696a0',
    marginTop: 2,
  }
});
