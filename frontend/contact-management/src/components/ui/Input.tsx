import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  helperTextClassName?: string;
  requiredIndicator?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  helperText,
  startIcon,
  endIcon,
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperTextClassName = '',
  requiredIndicator = false,
  disabled = false,
  readOnly = false,
  required,
  id,
  type = 'text',
  ...props
}) => {
  // Generate a unique ID for accessibility if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  // Determine input classes based on state
  const getInputClasses = () => {
    let baseClasses = 'px-3 py-2 border rounded-md focus:outline-none transition-colors duration-200';
    
    // Width
    baseClasses += ' w-full';
    
    // Border and focus states
    if (disabled || readOnly) {
      baseClasses += ' bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed';
    } else if (error) {
      baseClasses += ' border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50';
    } else {
      baseClasses += ' border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50';
    }
    
    // Add custom classes
    if (className) {
      baseClasses += ` ${className}`;
    }
    if (inputClassName) {
      baseClasses += ` ${inputClassName}`;
    }
    
    return baseClasses;
  };

  const getContainerClasses = () => {
    let classes = '';
    if (fullWidth) {
      classes += ' w-full';
    }
    if (containerClassName) {
      classes += ` ${containerClassName}`;
    }
    return classes.trim();
  };

  return (
    <div className={getContainerClasses()}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 ${
            disabled ? 'text-gray-400' : 'text-gray-700'
          } ${labelClassName}`}
        >
          {label}
          {required && requiredIndicator && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      {/* Input with optional icons */}
      <div className="relative">
        {/* Start Icon */}
        {startIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {startIcon}
          </div>
        )}

        {/* Input Field */}
        <input
          id={inputId}
          type={type}
          className={getInputClasses()}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : undefined
          }
          style={{
            paddingLeft: startIcon ? '2.5rem' : undefined,
            paddingRight: endIcon ? '2.5rem' : undefined,
          }}
          {...props}
        />

        {/* End Icon */}
        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {endIcon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={`${inputId}-error`}
          className={`mt-1 text-sm text-red-600 ${errorClassName}`}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className={`mt-1 text-sm text-gray-500 ${helperTextClassName}`}
        >
          {helperText}
        </p>
      )}

      {/* Character Count (for text inputs) */}
      {type === 'text' && props.maxLength && props.value && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          {String(props.value).length}/{props.maxLength}
        </div>
      )}
    </div>
  );
};

export default Input;