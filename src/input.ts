export type InputEvent =
  | {
      type: 'key';
      ch: string;
      keyName: string;
      keyFull: string;
      shift: boolean;
      ctrl: boolean;
    }
  | {
      type: 'mouse';
      source?: 'mouse' | 'click' | 'mousedown';
    }
  | {
      type: 'resize';
    };

export type ControlCommand =
  | 'quit'
  | 'toggleLock'
  | 'toggleColorScheme'
  | 'toggleMute'
  | 'debugNearEnd'
  | 'toggleDebugOverlay'
  | 'pauseResume'
  | 'resetRun'
  | 'startWork'
  | 'startShort'
  | 'startLong'
  | 'none';

export function resolveControlCommand(event: InputEvent): ControlCommand {
  if (event.type !== 'key') {
    return 'none';
  }

  if (event.keyFull === 'C-c' || (event.ctrl && event.keyName === 'c')) {
    return 'quit';
  }

  const lowerChar = event.ch.toLowerCase();
  if (event.keyName === 'q' || lowerChar === 'q') {
    return 'quit';
  }

  if (event.keyName === 'l' && (event.shift || event.ch === 'L' || event.keyFull === 'S-l')) {
    return 'toggleLock';
  }

  if (event.keyName === 'p' || lowerChar === 'p') {
    return 'pauseResume';
  }

  if (event.keyName === 'c' || lowerChar === 'c') {
    return 'toggleColorScheme';
  }

  if (event.keyName === 'm' || lowerChar === 'm') {
    return 'toggleMute';
  }

  if (event.keyName === 'i' && (event.shift || event.ch === 'I' || event.keyFull === 'S-i')) {
    return 'toggleDebugOverlay';
  }

  if (event.keyName === 'd' && (event.shift || event.ch === 'D' || event.keyFull === 'S-d')) {
    return 'debugNearEnd';
  }

  if (event.keyName === 'r' || lowerChar === 'r') {
    return 'resetRun';
  }

  if (event.keyName === 'w' || lowerChar === 'w') {
    return 'startWork';
  }

  if (event.keyName === 's' || lowerChar === 's') {
    return 'startShort';
  }

  if (event.keyName === 'l' || lowerChar === 'l') {
    return 'startLong';
  }

  return 'none';
}

export function isAllowedWhenLocked(command: ControlCommand): boolean {
  return (
    command === 'quit' ||
    command === 'toggleLock' ||
    command === 'toggleColorScheme' ||
    command === 'toggleMute'
  );
}

export function isPromptConfirmEvent(event: InputEvent, command: ControlCommand): boolean {
  if (command === 'quit') {
    return false;
  }

  if (command === 'debugNearEnd') {
    return false;
  }

  return event.type === 'mouse' || event.type === 'key';
}
