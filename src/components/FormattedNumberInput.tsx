import React, { useState, useEffect } from 'react';

/**
 * 천단위 콤마가 표시되는 숫자 입력 컴포넌트.
 * - 포커스 중: 콤마 없는 순수 숫자로 표시 (편집 용이)
 * - 포커스 해제: 천단위 콤마가 포함된 형식으로 표시
 * - inputMode="numeric" 으로 모바일에서 숫자 키패드 표시
 *
 * 앞으로 추가되는 모든 금액 입력 필드에 이 컴포넌트를 사용하세요.
 */
interface FormattedNumberInputProps {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '',
}) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  // 포커스 해제 상태에서 외부 value가 바뀌면 동기화
  useEffect(() => {
    if (!focused) {
      setRaw(value > 0 ? String(value) : '');
    }
  }, [value, focused]);

  const handleFocus = () => {
    setFocused(true);
    setRaw(value > 0 ? String(value) : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    setRaw(digits);
    onChange(digits === '' ? 0 : parseInt(digits, 10));
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const displayValue = focused
    ? raw
    : value > 0
    ? value.toLocaleString('ko-KR')
    : '';

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  );
};

export default FormattedNumberInput;
