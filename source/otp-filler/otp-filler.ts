export type OtpInputResult =
  | {
      type: 'single';
      input: Element;
    }
  | {
      type: 'multi';
      inputs: Element[];
    }
  | {
      type: 'not-found';
    };

const OTP_KEYWORDS = ['otp', 'code', 'token', 'digit', 'verification', 'verify', 'passcode', '2fa'];
const ALLOWED_INPUT_TYPES = new Set(['', 'text', 'tel', 'number', 'password']);

export function findOtpInput(page: Element): OtpInputResult {
  const inputs = Array.from(page.querySelectorAll('input')).filter(isFillableInput);

  const multiInputs = findMultiInputGroup(inputs);
  if (multiInputs.length > 1) {
    return {
      type: 'multi',
      inputs: multiInputs,
    };
  }

  const singleInput = findSingleInput(inputs);
  if (singleInput) {
    return {
      type: 'single',
      input: singleInput,
    };
  }

  return {type: 'not-found'};
}

export function fillOtp({code, input}: {code: string; input: OtpInputResult}): void {
  if (input.type === 'not-found' || code.length === 0) {
    return;
  }

  if (input.type === 'single') {
    const element = asInputElement(input.input);
    if (!element) {
      return;
    }

    typeText(element, code);
    return;
  }

  if (input.inputs.length !== code.length) {
    return;
  }

  input.inputs.forEach((element, index) => {
    const inputElement = asInputElement(element);
    if (!inputElement) {
      return;
    }

    typeText(inputElement, code[index] ?? '');
  });
}

function findMultiInputGroup(inputs: HTMLInputElement[]): HTMLInputElement[] {
  const candidates = inputs.filter((input) => {
    if (input.maxLength === 1 || input.size === 1) {
      return true;
    }

    return scoreOtpInput(input) >= 3;
  });

  const groups = new Map<Element, HTMLInputElement[]>();

  candidates.forEach((input) => {
    const container = input.parentElement ?? input.form;
    if (!container) {
      return;
    }

    const group = groups.get(container) ?? [];
    group.push(input);
    groups.set(container, group);
  });

  const firstGroup = Array.from(groups.values()).find(
    (group) => group.length > 1 && group.every((input) => input.maxLength === 1 || input.size === 1)
  );

  return firstGroup ?? [];
}

function findSingleInput(inputs: HTMLInputElement[]): HTMLInputElement | undefined {
  const scoredInputs = inputs
    .map((input) => {
      return {input, score: scoreOtpInput(input)};
    })
    .filter(({score}) => score > 0)
    .sort((left, right) => right.score - left.score);

  return scoredInputs[0]?.input;
}

function scoreOtpInput(input: HTMLInputElement): number {
  let score = 0;
  const attributeText = [
    input.name,
    input.id,
    input.placeholder,
    input.autocomplete,
    input.inputMode,
    input.getAttribute('aria-label'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (input.autocomplete === 'one-time-code') {
    score += 6;
  }

  if (input.inputMode === 'numeric') {
    score += 2;
  }

  if (input.pattern === '[0-9]*') {
    score += 1;
  }

  if (input.maxLength >= 4 && input.maxLength <= 8) {
    score += 2;
  }

  if (/^[0-9]{4,8}$/.test(input.placeholder)) {
    score += 2;
  }

  if (OTP_KEYWORDS.some((keyword) => attributeText.includes(keyword))) {
    score += 3;
  }

  return score;
}

function isFillableInput(input: HTMLInputElement): boolean {
  const type = input.type.toLowerCase();

  return (
    ALLOWED_INPUT_TYPES.has(type) &&
    !input.disabled &&
    !input.readOnly &&
    input.getAttribute('aria-hidden') !== 'true'
  );
}

function asInputElement(element: Element): HTMLInputElement | undefined {
  return element instanceof HTMLInputElement ? element : undefined;
}

function typeText(input: HTMLInputElement, text: string): void {
  input.focus();

  let currentValue = '';

  for (const character of text) {
    dispatchKeyboardEvent(input, 'keydown', character);
    dispatchTextEvent(input, 'beforeinput', character);

    currentValue += character;
    setInputValue(input, currentValue);

    dispatchTextEvent(input, 'input', character);
    dispatchKeyboardEvent(input, 'keyup', character);
  }

  dispatchChangeEvent(input);
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
}

function dispatchKeyboardEvent(input: HTMLInputElement, type: 'keydown' | 'keyup', key: string): void {
  input.dispatchEvent(
    new KeyboardEvent(type, {
      key,
      bubbles: true,
      cancelable: true,
    })
  );
}

function dispatchTextEvent(input: HTMLInputElement, type: 'beforeinput' | 'input', data: string): void {
  if (typeof InputEvent !== 'undefined') {
    input.dispatchEvent(
      new InputEvent(type, {
        data,
        inputType: 'insertText',
        bubbles: true,
        cancelable: true,
      })
    );
    return;
  }

  input.dispatchEvent(
    new Event(type, {
      bubbles: true,
      cancelable: true,
    })
  );
}

function dispatchChangeEvent(input: HTMLInputElement): void {
  input.dispatchEvent(
    new Event('change', {
      bubbles: true,
    })
  );
}
