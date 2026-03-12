// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {describe, expect, test, vi} from 'vitest';
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
  test('fills a single input and dispatches typing events followed by enter', () => {
    document.body.innerHTML = '<input type="text" />';
    const input = document.querySelector('input');
    expect(input).toBeInstanceOf(HTMLInputElement);

    const typedEvents: string[] = [];
    ['keydown', 'beforeinput', 'input', 'keyup', 'keypress', 'change'].forEach((eventName) => {
      input?.addEventListener(eventName, (event) => {
        if ((event as KeyboardEvent).key && (event as KeyboardEvent).key !== 'Enter') {
          typedEvents.push(eventName);
          return;
        }

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
      'keydown',
      'keypress',
      'keyup',
    ]);
  });

  test('submits the parent form after filling a single input', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="code" />
      </form>
    `;
    const input = document.querySelector('input') as HTMLInputElement;
    const form = document.querySelector('form') as HTMLFormElement;
    const submitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => undefined);

    fillOtp({
      code: '123',
      input: {
        type: 'single',
        input,
      },
    });

    expect(submitSpy).toHaveBeenCalled();
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

  test('submits after filling multi-input OTP boxes', () => {
    document.body.innerHTML = `
      <form>
        <div>
          <input type="text" maxlength="1" />
          <input type="text" maxlength="1" />
          <input type="text" maxlength="1" />
          <input type="text" maxlength="1" />
        </div>
      </form>
    `;
    const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
    const form = document.querySelector('form') as HTMLFormElement;
    const events: string[] = [];
    const submitSpy = vi.spyOn(form, 'requestSubmit').mockImplementation(() => undefined);

    inputs[3]?.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') {
        events.push('keydown');
      }
    });
    inputs[3]?.addEventListener('keypress', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') {
        events.push('keypress');
      }
    });
    inputs[3]?.addEventListener('keyup', (event) => {
      if ((event as KeyboardEvent).key === 'Enter') {
        events.push('keyup');
      }
    });

    fillOtp({
      code: '9876',
      input: {
        type: 'multi',
        inputs,
      },
    });

    expect(events).toEqual(['keydown', 'keypress', 'keyup']);
    expect(submitSpy).toHaveBeenCalled();
  });

  test('clicks a nearby submit button when there is no form', () => {
    document.body.innerHTML = `
      <section>
        <input type="text" name="code" />
        <button type="submit">Continue</button>
      </section>
    `;
    const input = document.querySelector('input') as HTMLInputElement;
    const button = document.querySelector('button') as HTMLButtonElement;
    const clickSpy = vi.spyOn(button, 'click').mockImplementation(() => undefined);

    fillOtp({
      code: '123456',
      input: {
        type: 'single',
        input,
      },
    });

    expect(clickSpy).toHaveBeenCalled();
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
