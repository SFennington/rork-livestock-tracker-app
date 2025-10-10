import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Mic, MicOff, Loader2 } from 'lucide-react-native';
import { Audio } from 'expo-av';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onParsedData?: (data: any) => void;
  placeholder?: string;
  style?: any;
}

export default function VoiceInput({ 
  onTranscription, 
  onParsedData, 
  placeholder = "Tap to speak",
  style 
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [liveTranscription, setLiveTranscription] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRecording) pulse();
        });
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      console.log('=== STARTING RECORDING ===');
      setLiveTranscription('');
      setTranscription('');
      setRecordingDuration(0);
      setDebugInfo('Starting recording...');
      
      if (Platform.OS === 'web') {
        console.log('Web platform detected');
        setDebugInfo('Web: Starting speech recognition...');
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
          setDebugInfo('❌ Speech Recognition not supported in this browser. Please use Chrome or Edge.');
          return;
        }
        
        try {
          const recognition = new SpeechRecognition();
          
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.maxAlternatives = 1;
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
            setDebugInfo('🎤 Listening... speak now!');
            setIsRecording(true);
          };
          
          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            const fullTranscript = (finalTranscript + interimTranscript).trim();
            console.log('Live transcript:', fullTranscript);
            setLiveTranscription(fullTranscript);
            setDebugInfo(`Heard: "${fullTranscript}"`);
          };
          
          recognition.onerror = (event: any) => {
            let errorMessage = '';
            
            switch (event.error) {
              case 'network':
                // Network errors are common in some browsers and can be ignored
                // Don't show error message or stop recording for network errors
                return;
              case 'not-allowed':
              case 'service-not-allowed':
                errorMessage = '❌ Microphone access denied. Please allow microphone access in your browser settings.';
                console.error('Speech recognition error:', event.error);
                break;
              case 'no-speech':
                errorMessage = '⚠️ No speech detected. Please try again.';
                break;
              case 'audio-capture':
                errorMessage = '❌ No microphone found. Please connect a microphone.';
                console.error('Speech recognition error:', event.error);
                break;
              case 'aborted':
                errorMessage = 'Recording stopped.';
                break;
              default:
                errorMessage = `❌ Error: ${event.error}`;
                console.error('Speech recognition error:', event.error);
            }
            
            setDebugInfo(errorMessage);
            setIsRecording(false);
            
            // Clear duration timer on error
            if (durationIntervalRef.current) {
              clearInterval(durationIntervalRef.current);
              durationIntervalRef.current = null;
            }
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsRecording(false);
          };
          
          recognition.start();
          recognitionRef.current = recognition;
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          setDebugInfo(`❌ Failed to start: ${error}`);
          return;
        }
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000) as any;
      } else {
        console.log('Mobile platform detected');
        setDebugInfo('Mobile: Requesting permissions...');
        
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setDebugInfo('Microphone permission denied');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm;codecs=opus',
            bitsPerSecond: 128000,
          },
        });

        await recording.startAsync();
        recordingRef.current = recording;
        setIsRecording(true);
        setDebugInfo('🎤 Recording... speak now!');
        
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000) as any;
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setDebugInfo(`Recording failed: ${error}`);
    }
  };

  const stopRecording = async () => {
    console.log('=== STOPPING RECORDING ===');
    setIsRecording(false);
    setIsProcessing(true);
    setDebugInfo('Processing...');
    
    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    try {
      if (Platform.OS === 'web') {
        // Stop speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        
        // Wait for final results
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const finalText = liveTranscription.trim();
        console.log('Final web transcription:', finalText);
        
        if (finalText) {
          setTranscription(finalText);
          onTranscription(finalText);
          setDebugInfo(`Got: "${finalText}"`);
          
          // Parse and send data
          if (onParsedData) {
            const parsedData = parseVoiceInput(finalText);
            console.log('Parsed data:', parsedData);
            if (parsedData) {
              setDebugInfo(`✅ Parsed: ${parsedData.type}`);
              onParsedData(parsedData);
            } else {
              setDebugInfo(`❌ Could not parse: "${finalText}"`);
            }
          }
        } else {
          setDebugInfo('No speech detected');
        }
      } else {
        // Mobile implementation
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          
          if (uri) {
            await transcribeAudioFile(uri);
          }

          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setDebugInfo(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
      recordingRef.current = null;
      setRecordingDuration(0);
    }
  };

  const transcribeAudioFile = async (uri: string) => {
    try {
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const audioFile = {
        uri,
        name: "recording." + fileType,
        type: "audio/" + fileType
      };

      const formData = new FormData();
      formData.append('audio', audioFile as any);

      console.log('Sending mobile transcription request...');
      setDebugInfo('Transcribing audio...');
      
      const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      const text = result.text?.trim() || '';
      console.log('Mobile transcription result:', text);
      
      if (text) {
        setTranscription(text);
        onTranscription(text);
        setDebugInfo(`Got: "${text}"`);
        
        if (onParsedData) {
          const parsedData = parseVoiceInput(text);
          console.log('Mobile parsed data:', parsedData);
          if (parsedData) {
            setDebugInfo(`✅ Parsed: ${parsedData.type}`);
            onParsedData(parsedData);
          } else {
            setDebugInfo(`❌ Could not parse: "${text}"`);
          }
        }
      } else {
        setDebugInfo('No speech detected');
      }
    } catch (error) {
      console.error('Mobile transcription error:', error);
      setDebugInfo(`Transcription error: ${error}`);
    }
  };

  const parseVoiceInput = (text: string) => {
    console.log('=== PARSING VOICE INPUT ===');
    console.log('Text to parse:', JSON.stringify(text));
    
    const lowerText = text.toLowerCase().trim();
    console.log('Lowercase text:', JSON.stringify(lowerText));
    if (!lowerText) {
      console.log('Empty text, returning null');
      return null;
    }
    
    // More comprehensive egg patterns
    const eggPatterns = [
      /(\d+)\s*eggs?\s*today/i,              // "10 eggs today"
      /(\d+)\s*eggs?\s*collected/i,          // "10 eggs collected"
      /collected\s*(\d+)\s*eggs?/i,          // "collected 10 eggs"
      /got\s*(\d+)\s*eggs?/i,                // "got 10 eggs"
      /laid\s*(\d+)\s*eggs?/i,               // "laid 10 eggs"
      /(\d+)\s*eggs?\s*(?:this\s*morning|yesterday|from\s*chickens)?/i, // "10 eggs this morning"
      /^(\d+)\s*eggs?$/i,                    // "10 eggs"
      /^eggs?\s*(\d+)$/i,                    // "eggs 10"
      /(\d+)\s*eggs?/i,                      // "10 eggs" (catch-all)
    ];
    
    console.log('Testing patterns against:', lowerText);
    for (let i = 0; i < eggPatterns.length; i++) {
      const pattern = eggPatterns[i];
      const match = lowerText.match(pattern);
      console.log(`Pattern ${i + 1} (${pattern.toString()}):`, match ? `MATCH - ${match[1]}` : 'NO MATCH');
      if (match) {
        const count = parseInt(match[1]);
        console.log('Parsed count:', count, 'isNaN:', isNaN(count));
        if (!isNaN(count) && count >= 0 && count <= 50) { // reasonable range
          const result = {
            type: 'eggs' as const,
            count,
            date: new Date().toISOString().split('T')[0],
            originalText: text
          };
          console.log('✅ RETURNING PARSED RESULT:', JSON.stringify(result, null, 2));
          return result;
        }
      }
    }

    // Expense patterns
    const expensePatterns = [
      /spent\s*\$?(\d+(?:\.\d{2})?)\s*(?:on|for)\s*(.+)/i,
      /bought\s*(.+?)\s*(?:for|cost)\s*\$?(\d+(?:\.\d{2})?)/i,
    ];

    for (const pattern of expensePatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const amount = parseFloat(match[1] || match[2]);
        const description = (match[2] || match[1])?.trim();
        if (!isNaN(amount) && description && description.length > 0) {
          console.log('✅ Parsed expense:', amount, description);
          return {
            type: 'expense',
            amount,
            description,
            date: new Date().toISOString().split('T')[0],
            originalText: text
          };
        }
      }
    }

    console.log('❌ No patterns matched for:', lowerText);
    return null;
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recordingButton,
          isProcessing && styles.processingButton
        ]}
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 size={24} color="#fff" />
        ) : isRecording ? (
          <MicOff size={24} color="#fff" />
        ) : (
          <Mic size={24} color="#fff" />
        )}
      </TouchableOpacity>
      
      <View style={styles.textContainer}>
        {isRecording && (
          <View style={styles.recordingInfo}>
            <View style={styles.recordingIndicator}>
              <Animated.View style={[
                styles.pulsingDot,
                { opacity: pulseAnim }
              ]} />
              <Text style={styles.recordingText}>Recording {recordingDuration}s</Text>
            </View>
          </View>
        )}
        
        <Text style={[
          styles.placeholder,
          (liveTranscription || transcription) && styles.transcriptionText
        ]}>
          {isProcessing 
            ? '⏳ Processing...' 
            : isRecording 
              ? (liveTranscription || '🎤 Listening... speak now') 
              : transcription || placeholder
          }
        </Text>
        
        {debugInfo && (
          <Text style={styles.debugText}>
            {debugInfo}
          </Text>
        )}
        
        {isRecording && (
          <Text style={styles.hint}>Tap microphone to stop</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 50,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  processingButton: {
    backgroundColor: '#6b7280',
  },
  textContainer: {
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  transcriptionText: {
    color: '#111827',
    fontStyle: 'normal',
    fontWeight: '500',
  },
  recordingInfo: {
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
});