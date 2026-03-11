// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import {fillOtp, findOtpInput} from './otp-filler';

const vas3kFixture = readFileSync('source/otp-filler/__test__/vas3k.html', 'utf8');

describe('findOtpInput', () => {
  test('finds the single OTP input in the vas3k fixture', () => {
    const parser = new DOMParser();
    const document = parser.parseFromString(vas3kFixture, 'text/html');

    const result = findOtpInput(document.body);

    expect(result.type).toBe('single');
    if (result.type !== 'single') {
      return;
    }

    const input = result.input as HTMLInputElement;
    expect(input.name).toBe('code');
    expect(input.placeholder).toBe('000000');
  });

  test('finds a multi-input OTP group', () => {
    document.body.innerHTML = `
      <form>
        <div>
          <input type="text" inputmode="numeric" maxlength="1" name="digit-1" />
          <input type="text" inputmode="numeric" maxlength="1" name="digit-2" />
          <input type="text" inputmode="numeric" maxlength="1" name="digit-3" />
          <input type="text" inputmode="numeric" maxlength="1" name="digit-4" />
        </div>
      </form>
    `;

    const result = findOtpInput(document.body);

    expect(result.type).toBe('multi');
    if (result.type !== 'multi') {
      return;
    }

    expect(result.inputs).toHaveLength(4);
  });

  test('returns not-found when there is no OTP-like input', () => {
    document.body.innerHTML = `
      <form>
        <input type="email" name="email" />
        <input type="password" name="password" />
      </form>
    `;

    expect(findOtpInput(document.body)).toEqual({type: 'not-found'});
  });
});

describe('fillOtp', () => {
  test('fills a single input and dispatches typing events', () => {
    document.body.innerHTML = '<input type="text" />';
    const input = document.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);

    const typedEvents: string[] = [];
    ['keydown', 'beforeinput', 'input', 'keyup', 'change'].forEach((eventName) => {
      input?.addEventListener(eventName, () => {
        typedEvents.push(eventName);
      });
    });

    fillOtp({
      code: '123',
      input: {
        type: 'single',
        input: input as HTMLInputElement,
      },
    });

    expect((input as HTMLInputElement).value).toBe('123');
    expect(typedEvents).toEqual([
      'keydown',
      'beforeinput',
      'input',
      'keyup',
      'keydown',
      'beforeinput',
      'input',
      'keyup',
      'keydown',
      'beforeinput',
      'input',
      'keyup',
      'change',
    ]);
  });

  test('fills multi-input OTP boxes one character at a time', () => {
    document.body.innerHTML = `
      <div>
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
      </div>
    `;
    const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];

    fillOtp({
      code: '9876',
      input: {
        type: 'multi',
        inputs,
      },
    });

    expect(inputs.map((input) => input.value)).toEqual(['9', '8', '7', '6']);
  });

  test('does nothing when multi-input length does not match the code length', () => {
    document.body.innerHTML = `
      <div>
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
        <input type="text" maxlength="1" />
      </div>
    `;
    const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
    const inputEvents = inputs.map(() => 0);

    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        inputEvents[index] += 1;
      });
    });

    fillOtp({
      code: '123',
      input: {
        type: 'multi',
        inputs,
      },
    });

    expect(inputs.map((input) => input.value)).toEqual(['', '', '', '']);
    expect(inputEvents).toEqual([0, 0, 0, 0]);
  });
});
