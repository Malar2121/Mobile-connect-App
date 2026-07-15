import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function OtpInput({ length = 6, value = '', onChangeText }) {
  const { colors, radii, isDark } = useTheme();
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Store individual digits
  const [digits, setDigits] = useState(Array(length).fill(''));

  useEffect(() => {
    // Sync external value to internal state
    const chars = value.split('').slice(0, length);
    const newDigits = Array(length).fill('');
    chars.forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (text, index) => {
    // Allow only numbers
    const cleanText = text.replace(/[^0-9]/g, '');
    
    // Handle paste (multiple chars)
    if (cleanText.length > 1) {
      const chars = cleanText.split('').slice(0, length);
      const newDigits = Array(length).fill('');
      chars.forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      onChangeText(newDigits.join(''));
      
      const nextFocusIndex = Math.min(chars.length, length - 1);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanText;
    setDigits(newDigits);
    onChangeText(newDigits.join(''));

    if (cleanText !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Focus previous input if current is empty and we press backspace
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChangeText(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index] !== '') {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChangeText(newDigits.join(''));
      }
    }
  };

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <OtpBox
          key={index}
          index={index}
          value={digit}
          focused={focusedIndex === index}
          onFocus={() => setFocusedIndex(index)}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          ref={(el) => (inputRefs.current[index] = el)}
          colors={colors}
          radii={radii}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

const OtpBox = React.forwardRef(({ value, focused, onFocus, onChangeText, onKeyPress, colors, radii, isDark }, ref) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, { damping: 14, stiffness: 280 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = focused 
    ? (isDark ? colors.surfaceTertiary : colors.surfaceElevated)
    : (isDark ? colors.surfaceSecondary : colors.backgroundAlt);
    
  const borderColor = focused ? colors.primary : (isDark ? colors.borderStrong : colors.border);

  return (
    <AnimatedTextInput
      ref={ref}
      value={value}
      onFocus={onFocus}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
      keyboardType="number-pad"
      maxLength={6} // Allow pasting up to 6 chars
      selectTextOnFocus
      style={[
        styles.box,
        animStyle,
        {
          backgroundColor,
          borderColor,
          borderRadius: radii.lg,
          color: colors.text,
        }
      ]}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 2,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
});
