import { StyleProp, ViewStyle, TextStyle, I18nManager } from 'react-native';

/**
 * RTL/LTR Utility Functions for React Native
 * Helps manage bidirectional text layouts
 */

export interface RTLStyles {
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
}

/**
 * Flip flexDirection for RTL
 * - 'row' becomes 'row-reverse'
 * - 'column' stays 'column'
 */
export const getFlexDirection = (
  isRTL: boolean,
  defaultDirection: 'row' | 'column' = 'row'
): 'row' | 'row-reverse' | 'column' | 'column-reverse' => {
  if (!isRTL) return defaultDirection;
  
  if (defaultDirection === 'row') return 'row-reverse';
  if (defaultDirection === 'column') return 'column';
  return defaultDirection;
};

/**
 * Get text alignment based on RTL
 */
export const getTextAlign = (
  isRTL: boolean,
  preferredAlign: 'left' | 'right' | 'center' = 'left'
): 'auto' | 'left' | 'right' | 'center' | 'justify' => {
  if (preferredAlign === 'center') return 'center';
  
  if (isRTL) {
    return preferredAlign === 'left' ? 'right' : 'left';
  }
  
  return preferredAlign;
};

/**
 * Flip marginStart/marginEnd for RTL compatibility
 * In RTL context: marginStart = marginRight, marginEnd = marginLeft
 */
export const getMarginStyle = (
  isRTL: boolean,
  marginStart?: number,
  marginEnd?: number
): { marginStart?: number; marginEnd?: number; marginLeft?: number; marginRight?: number } => {
  if (!isRTL) {
    return { marginStart, marginEnd };
  }
  
  return {
    marginStart: marginEnd,
    marginEnd: marginStart,
  };
};

/**
 * Get padding style for RTL
 */
export const getPaddingStyle = (
  isRTL: boolean,
  paddingStart?: number,
  paddingEnd?: number
): { paddingStart?: number; paddingEnd?: number } => {
  if (!isRTL) {
    return { paddingStart, paddingEnd };
  }
  
  return {
    paddingStart: paddingEnd,
    paddingEnd: paddingStart,
  };
};

/**
 * Combine RTL styles with existing styles
 */
export const withRTL = (
  baseStyles: StyleProp<ViewStyle | TextStyle>,
  rtlStyles: RTLStyles,
  isRTL: boolean
): StyleProp<ViewStyle | TextStyle> => {
  if (!isRTL) {
    return baseStyles;
  }
  
  return [baseStyles, rtlStyles];
};

/**
 * Get alignment properties based on RTL
 */
export const getAlignmentProps = (
  isRTL: boolean
): {
  textAlign: 'left' | 'right' | 'center';
  alignItems: 'flex-start' | 'flex-end' | 'center';
  justifyContent: 'flex-start' | 'flex-end' | 'center';
} => {
  if (!isRTL) {
    return {
      textAlign: 'left',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    };
  }
  
  return {
    textAlign: 'right',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  };
};

/**
 * Apply RTL settings to the entire app
 * Call this once when language is set to Arabic
 */
export const applyRTLLayout = (isRTL: boolean): void => {
  try {
    // This requires app restart on most platforms
    // But we set it for consistency
    if (isRTL) {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  } catch (error) {
    console.warn('Failed to apply RTL layout:', error);
  }
};

/**
 * Get RTL direction string
 */
export const getDirection = (isRTL: boolean): 'rtl' | 'ltr' => {
  return isRTL ? 'rtl' : 'ltr';
};

/**
 * Mirror position values for RTL
 * Useful for absolute positioning
 */
export const getMirroredPosition = (
  isRTL: boolean,
  left?: number,
  right?: number
): { left?: number; right?: number } => {
  if (!isRTL) {
    return { left, right };
  }
  
  return {
    left: right,
    right: left,
  };
};

/**
 * Get transform style for flipping icons
 * For RTL icon rotation
 */
export const getRotateStyle = (
  isRTL: boolean,
  shouldFlip: boolean = true
): { transform?: Array<{ scaleX: number }> } => {
  if (!isRTL || !shouldFlip) {
    return {};
  }
  
  return {
    transform: [{ scaleX: -1 }],
  };
};

/**
 * Conditional style helper
 */
export const conditionalStyle = (
  isRTL: boolean,
  ltrStyle: StyleProp<ViewStyle | TextStyle>,
  rtlStyle: StyleProp<ViewStyle | TextStyle>
): StyleProp<ViewStyle | TextStyle> => {
  return isRTL ? rtlStyle : ltrStyle;
};
